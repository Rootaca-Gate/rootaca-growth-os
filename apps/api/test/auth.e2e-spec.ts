import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/configure-app';
import { PasswordService } from '../src/auth/crypto/password.service';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let passwordService: PasswordService;

  const password = 'E2eAuth#2026';
  const users = {
    admin: {
      email: 'admin.e2e@rootaca.test',
      displayName: 'E2E Admin',
      role: Role.ADMIN,
    },
    mentor: {
      email: 'mentor.e2e@rootaca.test',
      displayName: 'E2E Mentor',
      role: Role.MENTOR,
    },
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();

    prisma = app.get(PrismaService);
    passwordService = app.get(PasswordService);
    await prisma.$connect();

    await prisma.refreshToken.deleteMany({
      where: { user: { email: { in: [users.admin.email, users.mentor.email] } } },
    });
    await prisma.orientationSession.deleteMany({
      where: { createdBy: { email: { in: [users.admin.email, users.mentor.email] } } },
    });
    await prisma.user.deleteMany({
      where: { email: { in: [users.admin.email, users.mentor.email] } },
    });

    const passwordHash = await passwordService.hash(password);
    await prisma.user.createMany({
      data: [
        { ...users.admin, passwordHash },
        { ...users.mentor, passwordHash },
      ],
    });
  });

  afterAll(async () => {
    await prisma.refreshToken.deleteMany({
      where: { user: { email: { in: [users.admin.email, users.mentor.email] } } },
    });
    await prisma.orientationSession.deleteMany({
      where: { createdBy: { email: { in: [users.admin.email, users.mentor.email] } } },
    });
    await prisma.user.deleteMany({
      where: { email: { in: [users.admin.email, users.mentor.email] } },
    });
    await app.close();
  });

  async function login(email: string) {
    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password });

    expect(response.status).toBe(200);
    return response.body as {
      accessToken: string;
      refreshToken: string;
      user: { email: string; role: Role };
    };
  }

  it('validates login payloads', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'not-an-email', password: 'short' });

    expect(response.status).toBe(400);
  });

  it('rejects unknown credentials', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: users.admin.email, password: 'WrongPass#2026' });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Invalid email or password');
  });

  it('logs in, returns the current user, and authorizes admin routes', async () => {
    const session = await login(users.admin.email);

    expect(session.user.role).toBe(Role.ADMIN);

    const me = await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${session.accessToken}`);

    expect(me.status).toBe(200);
    expect(me.body).toEqual(
      expect.objectContaining({
        email: users.admin.email,
        role: Role.ADMIN,
      }),
    );

    const admin = await request(app.getHttpServer())
      .get('/api/admin')
      .set('Authorization', `Bearer ${session.accessToken}`);

    expect(admin.status).toBe(200);
    expect(admin.body).toEqual({ status: 'ok', scope: 'ADMIN' });
  });

  it('blocks mentors from admin routes', async () => {
    const session = await login(users.mentor.email);

    const admin = await request(app.getHttpServer())
      .get('/api/admin')
      .set('Authorization', `Bearer ${session.accessToken}`);

    expect(admin.status).toBe(403);
    expect(admin.body.message).toBe('Insufficient permissions');
  });

  it('requires a bearer token for /auth/me', async () => {
    const response = await request(app.getHttpServer()).get('/api/auth/me');
    expect(response.status).toBe(401);
  });

  it('rotates refresh tokens and revokes them on logout', async () => {
    const session = await login(users.admin.email);

    const refreshed = await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .send({ refreshToken: session.refreshToken });

    expect(refreshed.status).toBe(200);
    expect(refreshed.body.refreshToken).not.toBe(session.refreshToken);

    const reuse = await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .send({ refreshToken: session.refreshToken });

    expect(reuse.status).toBe(401);

    const logout = await request(app.getHttpServer())
      .post('/api/auth/logout')
      .send({ refreshToken: refreshed.body.refreshToken });

    expect(logout.status).toBe(200);

    const afterLogout = await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .send({ refreshToken: refreshed.body.refreshToken });

    expect(afterLogout.status).toBe(401);
  });
});

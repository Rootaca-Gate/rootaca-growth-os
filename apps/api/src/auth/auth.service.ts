import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import { EnvironmentVariables } from '../common/config/env.validation';
import { parseDurationToMs, parseDurationToSeconds } from '../common/time/duration';
import { PrismaService } from '../prisma/prisma.service';
import { PasswordService } from './crypto/password.service';
import { generateRefreshToken, hashRefreshToken } from './crypto/refresh-token.util';
import { AuthResponseDto } from './dto/auth-response.dto';
import { CurrentUserDto } from './dto/current-user.dto';
import { LoginDto } from './dto/login.dto';
import { AuthenticatedUser } from './types/authenticated-user';
import { JwtPayload } from './types/jwt-payload';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly passwordService: PasswordService,
    private readonly config: ConfigService<EnvironmentVariables, true>,
  ) {}

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    const passwordMatches = await this.passwordService.verify(user?.passwordHash, dto.password);

    if (!user || !user.isActive || !passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.issueSession(user);
  }

  async refresh(refreshToken: string): Promise<AuthResponseDto> {
    const tokenHash = hashRefreshToken(refreshToken);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!stored) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (stored.revokedAt) {
      await this.prisma.refreshToken.updateMany({
        where: { userId: stored.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException('Refresh token reuse detected');
    }

    if (stored.expiresAt.getTime() <= Date.now() || !stored.user.isActive) {
      await this.revokeToken(stored.id);
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.revokeToken(stored.id);
    return this.issueSession(stored.user);
  }

  async logout(refreshToken: string): Promise<void> {
    const tokenHash = hashRefreshToken(refreshToken);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });

    if (stored && !stored.revokedAt) {
      await this.revokeToken(stored.id);
    }
  }

  toCurrentUser(user: AuthenticatedUser): CurrentUserDto {
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
    };
  }

  private async issueSession(user: User): Promise<AuthResponseDto> {
    const accessExpiresIn = this.config.get('JWT_EXPIRES_IN', { infer: true });
    const refreshExpiresIn = this.config.get('JWT_REFRESH_EXPIRES_IN', { infer: true });
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: parseDurationToSeconds(accessExpiresIn),
    });
    const refreshToken = generateRefreshToken();

    await this.prisma.refreshToken.create({
      data: {
        tokenHash: hashRefreshToken(refreshToken),
        userId: user.id,
        expiresAt: new Date(Date.now() + parseDurationToMs(refreshExpiresIn)),
      },
    });

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: parseDurationToSeconds(accessExpiresIn),
      user: this.toCurrentUser(user),
    };
  }

  private async revokeToken(id: string): Promise<void> {
    await this.prisma.refreshToken.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
  }
}

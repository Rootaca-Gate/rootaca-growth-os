import { Role } from '@prisma/client';

export type DevSeedUser = {
  email: string;
  displayName: string;
  role: Role;
  password: string;
};

export const DEV_SEED_USERS: DevSeedUser[] = [
  {
    email: 'admin@rootaca.com',
    displayName: 'ROOTACA Admin',
    role: Role.ADMIN,
    password: 'DevAdmin#2026',
  },
  {
    email: 'mentor@rootaca.com',
    displayName: 'ROOTACA Mentor',
    role: Role.MENTOR,
    password: 'DevMentor#2026',
  },
  {
    email: 'counselor@rootaca.com',
    displayName: 'ROOTACA Counselor',
    role: Role.COUNSELOR,
    password: 'DevCounselor#2026',
  },
];

export type Role = 'ADMIN' | 'MENTOR' | 'COUNSELOR';

export type CurrentUser = {
  id: string;
  email: string;
  displayName: string;
  role: Role;
};

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  user: CurrentUser;
};

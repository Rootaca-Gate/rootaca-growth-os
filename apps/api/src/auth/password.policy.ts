import { isStrongPassword } from 'class-validator';

export const PASSWORD_POLICY = {
  minLength: 10,
  minLowercase: 1,
  minUppercase: 1,
  minNumbers: 1,
  minSymbols: 1,
} as const;

export function isValidPassword(password: string): boolean {
  return isStrongPassword(password, PASSWORD_POLICY);
}

export function assertValidPassword(password: string): void {
  if (!isValidPassword(password)) {
    throw new Error(
      'Password must be at least 10 characters and include upper, lower, number, and symbol.',
    );
  }
}

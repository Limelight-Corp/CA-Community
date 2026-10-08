import { z } from 'zod';

export const LoginWithEmailSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
});
export type LoginWithEmailInput = z.infer<typeof LoginWithEmailSchema>;

export const LoginWithOtpSchema = z.object({
  mobile: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number'),
});
export type LoginWithOtpInput = z.infer<typeof LoginWithOtpSchema>;

export const VerifyOtpSchema = z.object({
  mobile: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number'),
  otp: z.string().trim().length(6, 'OTP must be 6 digits'),
});
export type VerifyOtpInput = z.infer<typeof VerifyOtpSchema>;

export const MemberRegisterSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  email: z.string().trim().email('Please enter a valid email address'),
  mobile: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number'),
  city: z.string().trim().min(2, 'City is required'),
  membershipNumber: z.string().trim().optional(),
  qualificationYear: z
    .number()
    .int()
    .min(1950)
    .max(new Date().getFullYear())
    .optional(),
  firmName: z.string().trim().optional(),
  plan: z.enum(['Core', 'Associate', 'Student']).default('Core'),
  termsAccepted: z.literal(true, {
    errorMap: () => ({ message: 'You must accept the terms and conditions' }),
  }),
});
export type MemberRegisterInput = z.infer<typeof MemberRegisterSchema>;

export const AdminLoginSchema = z.object({
  email: z.string().trim().email('Please enter a valid admin email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  totpCode: z.string().trim().length(6, 'TOTP 2FA code must be 6 digits').optional(),
});
export type AdminLoginInput = z.infer<typeof AdminLoginSchema>;

export const AdminSudoReauthSchema = z.object({
  password: z.string().min(1, 'Password is required for sensitive operation'),
  totpCode: z.string().trim().length(6, 'TOTP code must be 6 digits').optional(),
});
export type AdminSudoReauthInput = z.infer<typeof AdminSudoReauthSchema>;

export const Setup2FASchema = z.object({
  totpCode: z.string().trim().length(6, 'TOTP code must be 6 digits'),
});
export type Setup2FAInput = z.infer<typeof Setup2FASchema>;

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().optional(),
});
export type RefreshTokenInput = z.infer<typeof RefreshTokenSchema>;

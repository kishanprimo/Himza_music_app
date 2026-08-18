import { z } from 'zod';

export const SigninSchema = z.object({
    email: z
        .string({ required_error: 'Email is required' })
        .email('Please enter a valid email address')
        .optional(),
    mobile_number: z
        .string({ required_error: 'mobile_number is required' })
        .optional(),
    country_code: z
        .string({ required_error: 'country_code is required' })
        .optional(),
    login_type: z.enum(['email', 'mobile','google','apple'], {
        required_error: 'Login type is required',
        invalid_type_error: 'Login type must be either "email", "mobile", "google" or "apple"',
    }),
});

export const verifyOtpSchema = z.object({
    email: z
        .string({ required_error: 'Email is required' })
        .email('Please enter a valid email address')
        .optional(),
    mobile_number: z
        .string({ required_error: 'mobile_number is required' })
        .optional(),
    otp: z
        .string({ required_error: 'OTP is required' }),
    login_type: z.enum(['email', 'mobile'], {
        required_error: 'Login type is required',
        invalid_type_error: 'Login type must be either "email" or "social"',
    })
});

export const resendOtpSchema = z.object({
    email: z
        .string({ required_error: 'Email is required' })
        .email('Please enter a valid email address'),
});
 
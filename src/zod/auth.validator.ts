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
    device_token: z
        .string()
        .optional(),
    // Google / Apple ID token from the client SDK; verified on the server.
    // Older app builds send only the email (see ALLOW_LEGACY_SOCIAL_LOGIN).
    id_token: z.string().min(1).optional(),
}).refine(
    (data) => !['google', 'apple'].includes(data.login_type) || !!data.id_token || !!data.email,
    { message: 'id_token is required for google and apple login', path: ['id_token'] }
);

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
    device_token: z.string().optional(),
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
 
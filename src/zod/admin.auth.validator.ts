import z from 'zod';

export const adminLoginSchema = z.object({
    email: z
        .string({ required_error: 'Email is required' })
        .email('Please enter a valid email address'),
    password: z
        .string({ required_error: 'Password is required' })
});

export const adminUpdateSchema = z.object({
    first_name: z
        .string({ required_error: 'First name is required' })
        .optional(),
    last_name: z
        .string({ required_error: 'Last name is required' })
        .optional(),
    email: z
        .string({ required_error: 'Email is required' })
        .email('Please enter a valid email address')
        .optional(),
    profile_pic: z
        .string({ required_error: 'Profile picture is required' })
        .optional(),
    gender: z
        .string({ required_error: 'Gender is required' })
        .optional(),
    dob: z
        .string({ required_error: 'Date of birth is required' })
        .optional(),
    mobile_number: z
        .string({ required_error: 'Mobile number is required' })
        .min(10, 'Mobile number must 10 characters long')
        .max(10, 'Mobile number must 10 characters long')
        .optional(),
})
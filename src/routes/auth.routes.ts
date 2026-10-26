import express from 'express';
import {
    register,
    verifyOtp,
    resendOTP,
} from '../controllers/auth.controller';
import { validateBody } from '../middleware/zod.middleware';
import { otpSendLimit } from '../middleware/otpRateLimit.middleware';
import {
    SigninSchema,
    verifyOtpSchema,
    resendOtpSchema,
} from '../zod/auth.validator';
const router = express.Router();

router.post('/register', validateBody(SigninSchema), otpSendLimit, register);
router.post('/verify-otp', validateBody(verifyOtpSchema), verifyOtp);
router.post('/resend-otp', validateBody(resendOtpSchema), otpSendLimit, resendOTP);

export default router;

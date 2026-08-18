import express from 'express';
import {
    register,
    verifyOtp,
    resendOTP,
} from '../controllers/auth.controller';
import { validateBody } from '../middleware/zod.middleware';
import {
    SigninSchema,
    verifyOtpSchema,
    resendOtpSchema,
} from '../zod/auth.validator';
const router = express.Router();

router.post('/register', validateBody(SigninSchema), register);
router.post('/verify-otp', validateBody(verifyOtpSchema), verifyOtp);
router.post('/resend-otp', validateBody(resendOtpSchema), resendOTP);

export default router;

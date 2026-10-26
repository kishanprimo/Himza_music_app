import nodemailer from 'nodemailer';
import { logger } from "./logger";
import { config, emailConfig } from '../config';
import axios from 'axios';
import { randomInt } from 'crypto';

const accountSid = config.TWILIO_ACCOUNT_SID;
const authToken = config.TWILIO_AUTH_TOKEN;
import twilio from 'twilio';

const twilioClient = twilio(accountSid, authToken);

async function sendTwilioOTP(country_code: string, mobile_num: string, otp: string) {
    // Create a transporter object using SMTP transport
    try {
        // Send email
        if (config.nodeEnv == "development") {
            return true
        }
        const response = await twilioClient.messages.create({
            body: `Otp from Reel Boost is ${otp}.`,
            to: `${country_code}${mobile_num}`,
            from: config.TWILIO_FROM_NUMBER,
        })

        if (response.status === "queued" || response.status === "sent" || response.status === "delivered") {
            return true
        } else {
            return false
        }
    } catch (err) {
        logger.error("Error sending otp in twilio:", err);
        return false; // Error occurred while sending email
    }
}
async function sendMesg91TP(country_code: string, mobile_num: string, otp: string) {
    // Create a transporter object using SMTP transport
    try {
        // Send email
        if (config.nodeEnv == "development") {
            return true
        }
        const response = await axios.get(config.MSG91_API_ENDPOINT, {
            params: {
                authkey: config.MSG91_API_KEY,
                template_id: config.MSG91_TEMPLATE_ID, // Template ID from your MSG91 account
                mobile: `91${mobile_num}`,
                // variables: { OTP: generatedOtp },
                otp: otp,
                sender: config.MSG91_SENDER_ID,
            },
        });
        if (response.data.type === "success") {
            return true
        } else {
            return false
        }
    } catch (err) {
        logger.error("Error sending otp in Message91:", err);
        return false; // Error occurred while sending email
    }
}


// Secure random 4-digit OTP (Math.random is predictable).
function generateOTP() {
    return randomInt(1000, 10000).toString();
}

const sendEmailOTP = async (email: string, otp: string) => {
    if (config.nodeEnv === 'development') {
        return true;
    }

    const transporter = nodemailer.createTransport({
        service: emailConfig.service,
        host: emailConfig.host,
        port: Number(emailConfig.port),
        secure: false,
        auth: {
            user: emailConfig.user,
            pass: emailConfig.pass
        }
    });

    const mailOptions = {
        from: emailConfig.user,
        to: email,
        subject: 'OTP for Verification on Music App',
        text: `Your OTP is: ${otp}`
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        return info
    } catch (err) {
        logger.error("Error sending email:", err);
        return false;
    }
};


export {
    generateOTP,
    sendEmailOTP,
    sendTwilioOTP,
    sendMesg91TP
}
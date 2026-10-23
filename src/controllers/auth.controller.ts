import { logger } from "../utils";
import { config } from "../config/index";
import { user_service, response_service, token_service } from "../services";
import { Request, Response } from "express";
import removeExtraFields from "../services/common/removeExtraFields.service";
import { sendEmailOTP, sendMesg91TP, sendTwilioOTP } from "../utils/otp";
import db from "../models";
import socialAuthService from "../services/common/socialAuth.service";
import otp_service from "../services/otp.service";

const { SubscribedUsers, SunscriptionPlans } = db;

async function register(req: Request, res: Response) {
  try {
    // let otp = config.nodeEnv === "development" ? "1234" : generateOTP();
    let otp =
      req.body.email === "demo@gmail.com"
        ? "1234"
        : config.nodeEnv === "development"
          ? "1234"
          : otp_service.generateOTP();

    if (req.body.login_type == "email") {
      if (config.ALLLOW_LOGIN_BY_EMAIL == "false") {
        return response_service.badRequestResponse(
          res,
          "Email login is disabled."
        );
      }
      let user = await user_service.getUser({ email: req.body.email });
      const otpSent = await sendEmailOTP(req.body.email, otp);
      if (!otpSent) {
        return response_service.badRequestResponse(res, "Failed to send OTP.");
      }
      await otp_service.saveOtp({ email: req.body.email }, otp);
      if (user) {
        return response_service.successResponse(res, "OTP sent successfully.", {
          newUser: false,
        });
      } else {
        await user_service.createUser({ ...req.body });
        return response_service.successResponse(res, "OTP sent successfully.", {
          newUser: true,
        });
      }
    } else if (req.body.login_type == "mobile") {
      if (config.ALLLOW_LOGIN_BY_MOBILE == "false") {
        return response_service.badRequestResponse(
          res,
          "Mobile login is disabled."
        );
      }
      let user = await user_service.getUser({
        mobile_number: req.body.mobile_number,
      });
      let otpSent;
      if (req.body.country_code == "+91") {
        otpSent = await sendMesg91TP(
          req.body.country_code,
          req.body.mobile_number,
          otp
        );
      } else {
        logger.info("Sending OTP via Twilio");
        otpSent = await sendTwilioOTP(
          req.body.country_code,
          req.body.mobile_number,
          otp
        );
      }
      await otp_service.saveOtp({ mobile_number: req.body.mobile_number }, otp);
      if (user) {
        return response_service.successResponse(res, "OTP sent successfully.", {
          newUser: false,
        });
      } else {
        await user_service.createUser({ ...req.body });
        return response_service.successResponse(res, "OTP sent successfully.", {
          newUser: true,
        });
      }
    } else if (
      req.body.login_type == "google" ||
      req.body.login_type == "apple"
    ) {
      if (
        (config.ALLLOW_LOGIN_BY_GOOGLE == "false" &&
          req.body.login_type == "google") ||
        (config.ALLLOW_LOGIN_BY_APPLE == "false" &&
          req.body.login_type == "apple")
      ) {
        return response_service.badRequestResponse(
          res,
          "Login by google or apple is disabled."
        );
      }

      // Take the email from a verified Google/Apple ID token when the app sends one.
      // Older app builds send only the email; they are accepted while
      // ALLOW_LEGACY_SOCIAL_LOGIN is "true".
      let email: string;
      if (req.body.id_token) {
        try {
          email = await socialAuthService.verifySocialIdToken(
            req.body.login_type,
            req.body.id_token
          );
        } catch (err: any) {
          logger.warn(`Rejected ${req.body.login_type} login: ${err.message}`);
          return response_service.unauthorizedResponse(
            res,
            "Invalid or expired login token."
          );
        }
      } else if (config.ALLOW_LEGACY_SOCIAL_LOGIN != "false" && req.body.email) {
        email = req.body.email;
      } else {
        return response_service.badRequestResponse(
          res,
          "id_token is required for google and apple login"
        );
      }

      let user = await user_service.getUser({ email }, [
        {
          model: SubscribedUsers,
          as: "subscriptionPlan",
          where: { is_active: true },
          required: false,
          include: [
            {
              model: SunscriptionPlans,
              as: "plan",
            },
          ],
        },
      ]);

      if (user) {
        if (req.body.device_token) {
          await user_service.updateUser(
            {
              device_token: req.body.device_token,
            },
            {
              user_id: user.user_id,
            }
          );
        }

        const token = await token_service.generateToken({
          user_id: user.user_id,
        });
        return response_service.successResponse(
          res,
          "Logged in successfully.",
          {
            user: removeExtraFields(user, [
              "otp",
              "login_verification_status",
              "login_type",
              "is_admin",
              "device_token",
            ]),
            token,
            newUser: false,
          }
        );
      } else {
        let user = await user_service.createUser({
          ...req.body,
          email,
        });
        const token = await token_service.generateToken({
          user_id: user?.user_id,
        });
        user = await user_service.getUser({ user_id: user?.user_id }, [
          // {
          //   model: SunscriptionPlans,
          //   as: "subscriptionPlan",
          // },
        ]);
        return response_service.successResponse(
          res,
          "Logged in successfully.",
          {
            user: removeExtraFields(user, [
              "otp",
              "login_verification_status",
              "login_type",
              "is_admin",
              "device_token",
            ]),
            token,
            newUser: true,
          }
        );
      }
    }
  } catch (err: any) {
    logger.error("Error registering user:", err);
    return response_service.internalServerErrorResponse(res, err.message);
  }
}

// resend OTP =================================================================
async function resendOTP(req: Request, res: Response) {
  try {
    let otp =
      config.nodeEnv === "development" ? "1234" : otp_service.generateOTP();
    const otpSent = await sendEmailOTP(req.body.email, otp);
    if (!otpSent) {
      return response_service.badRequestResponse(res, "Failed to send OTP.");
    }
    const user = await user_service.getUser({ email: req.body.email });
    if (user) {
      await otp_service.saveOtp({ email: req.body.email }, otp);
      return response_service.successResponse(res, "OTP resent successfully.");
    }
    return response_service.badRequestResponse(res, "Email not registered.");
  } catch (err: any) {
    logger.error("Error resending OTP:", err);
    return response_service.internalServerErrorResponse(res, err.message);
  }
}

async function verifyOtp(req: Request, res: Response) {
  try {
    let user, token;
    if (req.body.login_type == "email") {
      // Hashed, single-use, expiring OTP with an attempt limit (otp.service).
      const isValid = await otp_service.verifyOtp(
        { email: req.body.email },
        req.body.otp
      );
      user = isValid
        ? await user_service.getUser({ email: req.body.email })
        : null;
      if (!user)
        return response_service.badRequestResponse(res, "Invalid otp.");
      token = await token_service.generateToken({ user_id: user.user_id });
      await user_service.updateUser(
        {
          login_verification_status: true,
          device_token: req.body.device_token || "",
        },
        { email: req.body.email }
      );
    } else if (req.body.login_type == "mobile") {
      const isValid = await otp_service.verifyOtp(
        { mobile_number: req.body.mobile_number },
        req.body.otp
      );
      user = isValid
        ? await user_service.getUser({ mobile_number: req.body.mobile_number })
        : null;
      if (!user)
        return response_service.badRequestResponse(res, "Invalid otp.");
      token = await token_service.generateToken({ user_id: user.user_id });
      await user_service.updateUser(
        {
          login_verification_status: true,
          device_token: req.body.device_token || "",
        },
        { mobile_number: req.body.mobile_number }
      );
    }
    return response_service.successResponse(res, "OTP verified successfully.", {
      user: removeExtraFields(user, [
        "otp",
        "login_verification_status",
        "login_type",
        "is_admin",
        "device_token",
      ]),
      token,
    });
  } catch (err: any) {
    logger.error("Error verifying OTP:", err);
    return response_service.internalServerErrorResponse(res, err.message);
  }
}

export { register, verifyOtp, resendOTP };

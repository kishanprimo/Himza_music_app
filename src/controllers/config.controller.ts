import { config_service, response_service } from "../services";
import { Request, Response } from "express";
import { logger } from "../utils";
import { updateEnvVariables } from "../helpers/setEnv";

// get all config data ============================================
async function getConfig(req: Request, res: Response) {
  try {
    const config = await config_service.getConfig();
    if (!config)
      return response_service.notFoundResponse(res, "Config not found.");
    return response_service.successResponse(
      res,
      "Config fetched successfully.",
      config
    );
  } catch (err: any) {
    logger.error("Error fetching config:", err);
    return response_service.internalServerErrorResponse(res, err.message);
  }
}

async function createConfig(req: Request, res: Response) {
  try {
    const config = await config_service.createConfig(req.body);
    return response_service.successResponse(
      res,
      "Config created successfully.",
      config
    );
  } catch (err: any) {
    logger.error("Error creating config:", err);
    return response_service.internalServerErrorResponse(res, err.message);
  }
}

async function updateConfig(req: Request, res: Response) {
  try {
    let config = await config_service.getConfig();
    if (!config) {
      return response_service.notFoundResponse(res, "Config not found.");
    }

    // Parse new values if provided, otherwise fallback to existing config
    const allow_login_by_email =
      req.body.allow_login_by_email !== undefined
        ? String(req.body.allow_login_by_email).toLowerCase() === "true"
        : config.allow_login_by_email;

    const allow_login_by_mobile =
      req.body.allow_login_by_mobile !== undefined
        ? String(req.body.allow_login_by_mobile).toLowerCase() === "true"
        : config.allow_login_by_mobile;

    // Ensure at least one is true
    if (!allow_login_by_email && !allow_login_by_mobile) {
      return response_service.badRequestResponse(
        res,
        "Either allow_login_by_email or allow_login_by_mobile must be true."
      );
    }

    // Handle uploaded files safely
    if (req.files && !Array.isArray(req.files)) {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };

      if (files.logo_light?.[0]) {
        req.body.logo_light = files.logo_light[0].path;
      }

      if (files.logo_dark?.[0]) {
        req.body.logo_dark = files.logo_dark[0].path;
      }
    }

    // Update config in DB
    config = await config_service.updateConfig(req.body);

    // Update .env based on explicitly provided fields
    const envUpdates: Record<string, string | number | boolean> = {};

    const mappings: Record<string, string> = {
      allow_login_by_email: "ALLOW_LOGIN_BY_EMAIL",
      allow_login_by_mobile: "ALLOW_LOGIN_BY_MOBILE",
      allow_login_by_google: "ALLOW_LOGIN_BY_GOOGLE",
      allow_login_by_apple: "ALLOW_LOGIN_BY_APPLE",
      purchase_code: "PURCHASE_CODE",
      email_service: "EMAIL_SERVICE",
      email_host: "EMAIL_HOST",
      email_port: "EMAIL_PORT",
      email_user: "EMAIL_USER",
      email_password: "EMAIL_PASSWORD",
      twilio_account_sid: "TWILIO_ACCOUNT_SID",
      twilio_auth_token: "TWILIO_AUTH_TOKEN",
      twilio_from_number: "TWILIO_FROM_NUMBER",
      msg91_sender_id: "MSG91_SENDER_ID",
      msg91_api_key: "MSG91_API_KEY",
      msg91_template_id: "MSG91_TEMPLATE_ID",
      stripe_secret_key: "STRIPE_SECRET_KEY",
      stripe_webhook_secret: "STRIPE_WEBHOOK_SECRET",
      paypal_client_id: "PAYPAL_CLIENT_ID",
      paypal_client_secret: "PAYPAL_CLIENT_SECRET",
      one_signal_app_id: "ONE_SIGNAL_APP_ID",
      one_signal_app_key: "ONE_SIGNAL_APP_KEY",
    };

    for (const [key, envKey] of Object.entries(mappings)) {
      if (Object.prototype.hasOwnProperty.call(req.body, key)) {
        envUpdates[envKey] = (config as any)[key];
      }
    }

    if (Object.keys(envUpdates).length > 0) {
      updateEnvVariables(envUpdates);
    }

    return response_service.successResponse(
      res,
      "Config updated successfully.",
      config
    );
  } catch (err: any) {
    logger.error("Error updating config:", err);
    return response_service.internalServerErrorResponse(res, err.message);
  }
}

export { getConfig, createConfig, updateConfig };

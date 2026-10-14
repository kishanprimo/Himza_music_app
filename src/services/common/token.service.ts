import { logger } from "../../utils";
import { config } from "../../config/index";
import { IAdmin, IUser } from "../../types";

const jwt = require("jsonwebtoken");

// Secret key for signing tokens (replace with your own secret, store securely)
const secretKey = config.secret || "secret";

const tokenExpiry = config.jwtExpiresIn || "1h"; // Default token expiry (e.g., 1 hour)

// Generate JWT token
function generateToken(payload: Partial<IUser>, expiresIn = tokenExpiry) {
  try {
    // const token = jwt.sign(payload, secretKey);
    const token = jwt.sign(payload, secretKey, {
      expiresIn,
    });
    // const token = jwt.sign(payload, secretKey, { expiresIn: '1m' });

    return token;
  } catch (error) {
    logger.error("Error generating token:", error);
    throw new Error("Error generating token");
  }
}

function generateAdminToken(payload: Partial<IAdmin>, expiresIn = tokenExpiry) {
  try {
    // const token = jwt.sign(payload, secretKey);
    const token = jwt.sign(payload, secretKey, {
      expiresIn,
    });
    // const token = jwt.sign(payload, secretKey, { expiresIn: '1m' });

    return token;
  } catch (error) {
    logger.error("Error generating token:", error);
    throw new Error("Error generating token");
  }
}

function verifyToken(token: string) {
  return jwt.verify(token, secretKey) as { user_id: string };
}

function verifyAdminToken(token: string) {
  return jwt.verify(token, secretKey) as { admin_id: string };
}

export default {
  generateToken,
  verifyToken,
  generateAdminToken,
  verifyAdminToken,
};

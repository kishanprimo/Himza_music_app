import { createHmac, randomInt, timingSafeEqual } from "crypto";
import { Op, literal } from "sequelize";
import db from "../models";
import { config } from "../config";

const { UserOtp } = db;

const OTP_TTL_MS = 10 * 60 * 1000; // OTP is valid for 10 minutes
const MAX_VERIFY_ATTEMPTS = 5; // after this, a new OTP must be requested

type OtpTarget = { email?: string; mobile_number?: string };

function identifierFor(target: OtpTarget): string | null {
  if (target.email) return `email:${target.email}`;
  if (target.mobile_number) return `mobile:${target.mobile_number}`;
  return null;
}

function hashOtp(identifier: string, otp: string): string {
  return createHmac("sha256", config.secret)
    .update(`${identifier}:${otp}`)
    .digest("hex");
}

// 4 digits, same format the app already expects, but from a secure random source.
function generateOTP(): string {
  return randomInt(1000, 10000).toString();
}

/** Stores a fresh OTP for this email / mobile, replacing any earlier one. */
async function saveOtp(target: OtpTarget, otp: string): Promise<void> {
  const identifier = identifierFor(target);
  if (!identifier) throw new Error("email or mobile_number is required");

  await UserOtp.upsert({
    identifier,
    otp_hash: hashOtp(identifier, otp),
    expires_at: new Date(Date.now() + OTP_TTL_MS),
    attempts: 0,
  });
}

/**
 * Checks the OTP. It is single-use, expires, and is locked after
 * MAX_VERIFY_ATTEMPTS wrong tries.
 */
async function verifyOtp(target: OtpTarget, otp: string): Promise<boolean> {
  const identifier = identifierFor(target);
  if (!identifier || !otp) return false;

  const record = await UserOtp.findByPk(identifier);
  if (!record) return false;

  if (
    new Date(record.expires_at).getTime() < Date.now() ||
    record.attempts >= MAX_VERIFY_ATTEMPTS
  ) {
    await record.destroy();
    return false;
  }

  // Atomically claim one attempt before comparing, so parallel guesses can't
  // get past the limit.
  const [claimed] = await UserOtp.update(
    { attempts: literal("attempts + 1") },
    { where: { identifier, attempts: { [Op.lt]: MAX_VERIFY_ATTEMPTS } } }
  );
  if (!claimed) return false;

  const expected = Buffer.from(record.otp_hash, "hex");
  const actual = Buffer.from(hashOtp(identifier, String(otp).trim()), "hex");
  const isValid =
    expected.length === actual.length && timingSafeEqual(expected, actual);

  if (isValid) await record.destroy();
  return isValid;
}

export default { generateOTP, saveOtp, verifyOtp };

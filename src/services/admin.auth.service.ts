import { comparePassword, hashPassword } from "../services/common/password.service";
import db from "../models";

const { Admin } = db;
import { IAdmin } from "../types";

async function getAdmin(data: Partial<IAdmin>): Promise<IAdmin | null> {
  try {
    const user = await Admin.findOne({ where: data });
    if (!user) return null;
    return user.toJSON() as IAdmin;
  } catch (err) {
    throw err;
  }
}


const BCRYPT_HASH = /^\$2[aby]\$\d{2}\$/;

// Production admins may still have plain-text passwords (stored before hashing was
// added). Accept those once and replace them with a bcrypt hash.
async function checkAdminPassword(
  admin_id: number | string,
  password: string,
  stored: string
): Promise<boolean> {
  if (BCRYPT_HASH.test(stored)) return comparePassword(password, stored);

  if (!stored || String(password) !== stored) return false;

  await Admin.update(
    { password: await hashPassword(String(password)) },
    { where: { admin_id } }
  );
  return true;
}

async function verifyAdmin(data: Partial<IAdmin>): Promise<IAdmin | null> {
  const admin = await Admin.findOne({
    where: { email: data.email },
  });

  if (!admin) return null;

  const adminData = admin.toJSON() as IAdmin;

  const isPasswordValid = await checkAdminPassword(
    adminData.admin_id,
    String(data.password ?? ""),
    String(adminData.password ?? "")
  );

  if (!isPasswordValid) return null;

  return adminData;
}

async function updateAdmin(
  data: Partial<IAdmin>,
  where: Partial<IAdmin>
): Promise<IAdmin | null> {
  try {
    const { password, ...safeData } = data;

    const user = await Admin.update(safeData, {
      where,
      returning: true,
    });

    if (user[0] === 0 || user[1].length <= 0) return null;

    return user[1][0].toJSON() as IAdmin;
  } catch (err) {
    throw err;
  }
}


async function changePassword(
  data: Partial<IAdmin>,
  where: Partial<IAdmin>
): Promise<IAdmin | null> {
  if (!data.password) return null;

  const hashedPassword = await hashPassword(data.password);

  const [count, rows] = await Admin.update(
    { password: hashedPassword },
    { where, returning: true }
  );

  if (count === 0 || rows.length === 0) return null;

  return rows[0].toJSON() as IAdmin;
}

export default { getAdmin, verifyAdmin, updateAdmin, changePassword, checkAdminPassword };

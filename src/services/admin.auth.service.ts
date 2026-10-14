import { comparePassword, hashPassword } from "../services/common/password.service";
import db from "../models";

const { Admin } = db;
import { IAdmin } from "../types";
import { log } from "console";

async function getAdmin(data: Partial<IAdmin>): Promise<IAdmin | null> {
  try {
    const user = await Admin.findOne({ where: data });
    if (!user) return null;
    return user.toJSON() as IAdmin;
  } catch (err) {
    throw err;
  }
}

// async function verifyAdmin(data: Partial<IAdmin>): Promise<IAdmin | null> {
//   try {
//     const admin = await Admin.findOne({
//       where: { email: data.email, password: data.password },
//     });
//     if (!admin) return null;
//     const adminData = admin.toJSON() as IAdmin;
//     // const password = await comparePassword(data.password ?? "", adminData.password);
//     // if (!password) return null;
//     return admin.toJSON() as IAdmin;
//   } catch (err) {
//     throw err;
//   }
// }

async function verifyAdmin(data: Partial<IAdmin>): Promise<IAdmin | null> {
  const admin = await Admin.findOne({
    where: { email: data.email },
  });

  if (!admin) return null;

  const adminData = admin.toJSON() as IAdmin;

  const isPasswordValid = await comparePassword(
    data.password ?? "",
    adminData.password ?? ""
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

// async function changePassword(
//   data: Partial<IAdmin>,
//   where: Partial<IAdmin>
// ): Promise<IAdmin | null> {
//   try {
//     const user = await Admin.update(data, { where: where, returning: true });
//     if (user[0] == 0 || user[1].length <= 0) return null;
//     return user[1][0].toJSON() as IAdmin;
//   } catch (err) {
//     throw err;
//   }
// }

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

export default { getAdmin, verifyAdmin, updateAdmin, changePassword };

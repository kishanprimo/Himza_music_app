import db from "../src/models";
import { hashPassword } from "../src/services/common/password.service";

async function migrateAdminPassword() {
  try {
    const { Admin } = db;

    const admin = await Admin.findOne({
      where: { email: "admin@gmail.com" },
    });

    if (!admin) {
      console.log("Admin not found.");
      return;
    }

    const currentPassword = admin.getDataValue("password");

    // Prevent hashing a password that is already bcrypt-hashed.
    if (/^\$2[aby]\$\d{2}\$/.test(currentPassword)) {
      console.log("Password is already bcrypt-hashed. No changes made.");
      return;
    }

    const hashedPassword = await hashPassword(currentPassword);

    await admin.update({ password: hashedPassword });

    console.log("Admin password migrated successfully.");
  } catch (error) {
    console.error("Password migration failed:", error);
    process.exitCode = 1;
  } finally {
    await db.sequelize?.close();
  }
}

migrateAdminPassword();
import db from "../src/models";
import { hashPassword } from "../src/services/common/password.service";

const BCRYPT_HASH = /^\$2[aby]\$\d{2}\$/;

async function migrateAdminPasswords() {
  try {
    const { Admin } = db;

    const admins = await Admin.findAll();

    let migrated = 0;
    let skipped = 0;

    for (const admin of admins) {
      const currentPassword = admin.getDataValue("password");

      // Skip empty passwords and ones that are already bcrypt-hashed.
      if (!currentPassword || BCRYPT_HASH.test(String(currentPassword))) {
        skipped++;
        continue;
      }

      const hashedPassword = await hashPassword(String(currentPassword));
      await admin.update({ password: hashedPassword });
      migrated++;
    }

    console.log(
      `Admin password migration done. Hashed: ${migrated}, skipped: ${skipped}.`
    );
  } catch (error) {
    console.error("Password migration failed:", error);
    process.exitCode = 1;
  } finally {
    await db.sequelize?.close();
  }
}

migrateAdminPasswords();

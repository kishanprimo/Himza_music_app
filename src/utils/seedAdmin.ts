import db from "../models"; // adjust based on your structure
import { hashPassword } from "../services/common/password.service";

const seedAdmin = async () => {
  try {
    const { Admin } = db;

    const adminEmail = "admin@gmail.com";

    // 🔍 Check if admin already exists
    const existingAdmin = await Admin.findOne({
      where: { email: adminEmail },
    });

    if (existingAdmin) {
      console.log("✅ Admin already exists");
      return;
    }

    const hashedPassword = await hashPassword("123456");

    // 🔐 Hash password

    // ➕ Create admin
    await Admin.create({
      first_name: "Super",
      last_name: "Admin",
      email: adminEmail,
      password: hashedPassword,
      gender: "male",
      dob: "1995-01-01",
      mobile_number: "9999999999",
    });

    console.log("🔥 Default admin created successfully");
  } catch (error) {
    console.error("❌ Error seeding admin:", error);
  }
};

export default seedAdmin;
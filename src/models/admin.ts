import { config } from "../config";

module.exports = (sequelize: any, DataTypes: any) => {
  const Admin = sequelize.define(
    "Admin",
    {
      admin_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      first_name: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "",
      },
      last_name: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "",
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      profile_pic: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "",
        get(this: any): string {       
          const pic = this.getDataValue("profile_pic");
          return pic ? `${config.clientUrl}${pic}` : "";
        },
      },
      gender: { type: DataTypes.STRING },
      dob: { type: DataTypes.STRING },
      mobile_number: { type: DataTypes.STRING },
    },
    {
      tableName: "admin",
      timestamps: true,
    }
  );

  return Admin;
};

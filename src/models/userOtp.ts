"use strict";

// One pending OTP per email / mobile number. Kept out of the users table so
// no user API response can ever include OTP data.
module.exports = (sequelize: any, DataTypes: any) => {
  const UserOtp = sequelize.define(
    "UserOtp",
    {
      // "email:<email>" or "mobile:<mobile_number>"
      identifier: {
        type: DataTypes.STRING,
        primaryKey: true,
      },
      otp_hash: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      expires_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      attempts: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      tableName: "user_otps",
      timestamps: true,
    }
  );

  return UserOtp;
};

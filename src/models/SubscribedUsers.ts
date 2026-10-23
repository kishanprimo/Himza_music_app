"use strict";

module.exports = (sequelize:any, DataTypes:any) => {
  const SubscribedUsers = sequelize.define(
    "SubscribedUsers",
    {
      subscription_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      plan_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      amount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      payment_status: {
        type: DataTypes.ENUM("pending", "completed", "failed"),
        allowNull: false,
      },
      payment_date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      payment_method: {
        type: DataTypes.ENUM("stripe", "paypal"),
        allowNull: false,
      },
      // Stripe PaymentIntent id or PayPal order id. Unique so one payment activates one subscription.
      payment_reference: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
      },
      expires_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: "subscribedUsers",
      timestamps: true,
    }
  );

  // 🔗 Define associations here
  SubscribedUsers.associate = function (models:any) {
    // Each subscription belongs to one user
    SubscribedUsers.belongsTo(models.User, {
      foreignKey: "user_id",
      as: "user",
      onDelete: "CASCADE",
    });

    SubscribedUsers.belongsTo(models.SunscriptionPlans, {
      foreignKey: "plan_id",
      as: "plan",
    });
  };

  return SubscribedUsers;
};

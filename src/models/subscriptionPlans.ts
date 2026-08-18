module.exports = (sequelize: any, DataTypes: any) => {
  const SunscriptionPlans = sequelize.define(
    "SunscriptionPlans",
    {
      plan_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      title: { type: DataTypes.STRING },
      description: { type: DataTypes.STRING },
      price: { type: DataTypes.INTEGER },
      duration: {
        type: DataTypes.ENUM("1 MONTH", "6 MONTHS", "1 YEAR"),
      },
      features: { type: DataTypes.TEXT },
      is_deleted: { type: DataTypes.BOOLEAN, defaultValue: false },
    },
    {
      tableName: "subscription_plans",
      timestamps: true,
    }
  );

  SunscriptionPlans.associate = function (models: any) {
    SunscriptionPlans.hasMany(models.SubscribedUsers, {
      foreignKey: "plan_id",
      as: "subscribedUsers",
    });
  };

  return SunscriptionPlans;
};

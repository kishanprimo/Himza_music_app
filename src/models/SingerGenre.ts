
module.exports = (sequelize: any, DataTypes: any) => {
  const SingerGenre = sequelize.define(
    "singerGenre",
    {
      singerGenre_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      genre_id: { type: DataTypes.INTEGER, allowNull: false },
      user_id: { type: DataTypes.INTEGER, allowNull: false },
    },
    {
      tableName: "singerGenre",
      timestamps: true,
    }
  );

  SingerGenre.associate = function (models: any) {

    SingerGenre.belongsTo(models.User, {
      foreignKey: "user_id",
      as: "artist",
      onDelete: "CASCADE",
    });

    SingerGenre.belongsTo(models.Genre, {
      foreignKey: "genre_id",
      as: "genre",
      onDelete: "CASCADE",
    });
  }
  return SingerGenre;
}



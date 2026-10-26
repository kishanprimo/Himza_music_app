module.exports = (sequelize: any, DataTypes: any) => {
  const favoriteArtists = sequelize.define(
    "favoriteArtists",
    {
      favorite_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      artist_user_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      tableName: "favoriteArtists",
      timestamps: true,
    }
  );

  favoriteArtists.associate = function (models: any) {

    // 🔥 user who added favorite
    favoriteArtists.belongsTo(models.User, {
      foreignKey: "user_id",
      as: "user",
    });

    // 🔥 actual artist user
    favoriteArtists.belongsTo(models.User, {
      foreignKey: "artist_user_id",
      as: "artist",
    });
  };

  return favoriteArtists;
};

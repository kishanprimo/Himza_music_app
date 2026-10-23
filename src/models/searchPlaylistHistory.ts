module.exports = (sequelize: any, DataTypes: any) => {
  const SearchPlaylistHistory = sequelize.define(
    "searchPlaylistHistory",
    {
      search_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      album_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      tableName: "searchPlaylistHistory",
      timestamps: true,
    }
  );

  SearchPlaylistHistory.associate = (models: any) => {
    // 🔥 belongs to Album
    SearchPlaylistHistory.belongsTo(models.Album, {
      foreignKey: "album_id",
      as: "album",
    });

    // 🔥 belongs to User
    SearchPlaylistHistory.belongsTo(models.User, {
      foreignKey: "user_id",
      as: "user",
    });
  };

  return SearchPlaylistHistory;
};

module.exports = (sequelize: any, DataTypes: any) => {
  const MusicSinger = sequelize.define(
    "MusicSinger",
    {
      music_singer_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "users", // must match table name
          key: "user_id",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      song_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "songs", // must match table name
          key: "song_id",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
    },
    {
      tableName: "music_singers",
      timestamps: true,
    }
  );

  MusicSinger.associate = function (models: any) {
    MusicSinger.belongsTo(models.song, {
      foreignKey: "song_id",
      as: "song",
      // onDelete: "CASCADE",
      // hooks: true,
    });

    // MusicSinger belongs to User (the artist)
    MusicSinger.belongsTo(models.User, {
      foreignKey: "user_id",
      as: "singer",
      // onDelete: "CASCADE",
    });
  }
  return MusicSinger
}



import { config } from "../config";


module.exports = (sequelize: any, DataTypes: any) => {
  const User = sequelize.define(
    "User",
    {
      user_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      full_name: { type: DataTypes.STRING, allowNull: true, defaultValue: "" },
      username: { type: DataTypes.STRING, allowNull: true, defaultValue: "" },
      email: { type: DataTypes.STRING, allowNull: true, unique: true },
      otp: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
      login_type: {
        type: DataTypes.ENUM("email", "mobile", "google", "apple"),
        allowNull: true,
        defaultValue: "email",
      },
      profile_pic: {
        type: DataTypes.STRING,
        get(this: any): string {       
          if (this.getDataValue("profile_pic")) {
            return config.clientUrl + this.getDataValue("profile_pic");
          } else {
            return "";
          }
        },
        allowNull: false,
        defaultValue: "",
      },
      gender: { type: DataTypes.STRING, allowNull: false, defaultValue: "" },
      dob: { type: DataTypes.STRING, allowNull: false, defaultValue: "" },
      device_token: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "",
      },
      login_verification_status: { type: DataTypes.BOOLEAN, defaultValue: false },
      is_admin: { type: DataTypes.BOOLEAN, defaultValue: false },
      is_singer: { type: DataTypes.BOOLEAN, defaultValue: false },
      current_song_time: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "00:00",
      },
      current_song_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        // defaultValue: ,
        references: {
          model: "songs",
          key: "song_id",
        },
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      },
      current_album_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        // defaultValue: "",
        // No `references` here: albums.user_id -> users already exists, and a users <-> albums
        // FK cycle makes sequelize.sync() fall back to definition order, which fails when a
        // referenced table (e.g. playlists) hasn't been created yet.
      },
      mobile_number: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      country_code: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      description: { type: DataTypes.TEXT, allowNull: true, defaultValue: "" },
      is_deleted: { type: DataTypes.BOOLEAN, defaultValue: false },
      blocked_by_admin: { type: DataTypes.BOOLEAN, defaultValue: false },
      account_status: { type: DataTypes.BOOLEAN, defaultValue: true },
    },
    {
      tableName: "users",
      timestamps: true,
    }
  );

  User.associate = function (models:any) {
    User.hasMany(models.Album, {
      foreignKey: "user_id",
      as: "createdAlbums",
    });

    User.belongsTo(models.song, {
      foreignKey: "current_song_id",
      as: "currentSong",
      // onDelete: "SET NULL",
      // onUpdate: "CASCADE",
    });

    User.belongsTo(models.Album, {
      foreignKey: "current_album_id",
      as: "currentAlbum",
      constraints: false, // see current_album_id above
      // onDelete: "SET NULL",
      // onUpdate: "CASCADE",
    });

    User.hasMany(models.favorites, {
      foreignKey: "user_id",
      as: "favorites",
    });

    User.hasMany(models.Downloads, {
      foreignKey: "user_id",
      as: "downloads",
    });

    User.hasMany(models.MusicSinger, {
      foreignKey: "user_id",
      as: "artistSongs",
      onDelete: "CASCADE",
    });

    User.hasMany(models.History, {
      foreignKey: "user_id",
      as: "history",
    });
    User.hasMany(models.favoriteAlbums, {
      foreignKey: "user_id",
      as: "favoriteAlbums",
    });

    User.hasMany(models.favoriteArtists, {
      foreignKey: "artist_user_id",
      as: "favoriteArtistBy",
    });

    User.hasMany(models.favoriteArtists, {
      foreignKey: "user_id",
      as: "favoriteArtists",
    });

    User.hasMany(models.singerGenre, {
      foreignKey: "user_id",
      as: "singerGenres",
    });

    User.hasMany(models.SubscribedUsers, {
      foreignKey: "user_id",
      as: "subscriptionPlan",
    });
  };

  return User;
}


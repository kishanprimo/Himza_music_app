
import { config } from "../config";


module.exports = (sequelize: any, DataTypes: any) => {
  const Genre = sequelize.define(
    "Genre",
    {
      genre_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING,
      },
      is_deleted: { type: DataTypes.BOOLEAN, defaultValue: false },
      status: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      background_img: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "",
        get(this: any): string {       
          if (this.getDataValue("background_img")) {
            return config.clientUrl + this.getDataValue("background_img");
          } else {
            return "";
          }
        },
      },
    },
    {
      tableName: "genres",
      timestamps: true,
    }
  );
  Genre.associate = function (models: any) {
    Genre.hasMany(models.song, {
      foreignKey: "genre_id",
      as: "songs",
    });
    Genre.hasMany(models.Album, {
      foreignKey: "album_id",
      as: "album",
    });
    Genre.hasMany(models.singerGenre, {
      foreignKey: "genre_id",
      as: "singerGenres",
    });
  }
  return Genre
}



// models/podcast.ts
import { config } from "../config";

module.exports = (sequelize: any, DataTypes: any) => {
  const Podcast = sequelize.define(
    "Podcast",
    {
      podcast_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      podcast_image: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "",
        get(this: any) {
          const image = this.getDataValue("podcast_image");
          return image ? config.clientUrl + image : "";
        },
      },
      author_name:{
        type:DataTypes.STRING,
        allowNull:true,
      },
      category: {
        type: DataTypes.ENUM("Trending", "Latest", "Comedy", "Mix"),
        allowNull: true,
      },
      is_delete: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      tableName: "podcast",
      timestamps: true,
    }
  );

  Podcast.associate = (models: any) => {
    Podcast.hasMany(models.Episode, {
      foreignKey: "podcast_id",
      as: "episodes",
    });
  };

  return Podcast;
};

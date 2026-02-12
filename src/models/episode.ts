// models/episode.ts
import { config } from "../config";
module.exports = (sequelize: any, DataTypes: any) => {
  const Episode = sequelize.define(
    "Episode",
    {
      episode_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      podcast_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      episode_title: DataTypes.STRING,
      episode_description: DataTypes.STRING,
      episode_audio: {
        type: DataTypes.STRING,
        allowNull: false,
        get(this: any): string {
          return config.clientUrl + this.getDataValue("episode_audio");
        },
      },
      duration: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      is_delete: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      tableName: "episode",
      timestamps: true,
    }
  );

  Episode.associate = (models: any) => {
    Episode.belongsTo(models.Podcast, {
      foreignKey: "podcast_id",
      as: "podcast",
    });
  };

  

  return Episode;
};

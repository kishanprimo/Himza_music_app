
import { config } from "../config";

module.exports = (sequelize: any, DataTypes: any) => {
  const Ads = sequelize.define(
    "Ads",
    {
      ad_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      title: { type: DataTypes.STRING, allowNull: false },
      type: { type: DataTypes.ENUM("banner", "video"), allowNull: false },
      banner: {
        type: DataTypes.STRING,
        allowNull: true,
        get(this: any): string {       
          if (this.getDataValue("banner"))
            return config.clientUrl + this.getDataValue("banner");
          else return "";
        },
      },
      video: {
        type: DataTypes.STRING,
        allowNull: true,
        get(this: any): string {       
          if (this.getDataValue("video"))
            return config.clientUrl + this.getDataValue("video");
          else return "";
        },
      },
      audio: {
        type: DataTypes.STRING,
        allowNull: true,
        get(this: any): string {       
          if (this.getDataValue("audio"))
            return config.clientUrl + this.getDataValue("audio");
          else return "";
        },
      },
      description: { type: DataTypes.STRING, allowNull: true },
      link: { type: DataTypes.STRING, allowNull: true },
      // start_date: { type: DataTypes.DATEONLY, allowNull: false },
      // end_date: { type: DataTypes.DATEONLY, allowNull: false },
      position: {
        type: DataTypes.ENUM("Top", "Middle", "Bottom"),
        allowNull: true,
      },
      placement: {
        type: DataTypes.ENUM("Home", "Album", "Genre", "Song", "Search"),
        allowNull: true,
      },
      // duration_in_sec: { type: DataTypes.INTEGER, allowNull: true },
      is_deleted: { type: DataTypes.BOOLEAN, defaultValue: false },
      has_expired: { type: DataTypes.BOOLEAN, defaultValue: false },
      is_visible: { type: DataTypes.BOOLEAN, defaultValue: true },
      order_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      album_ids: {
        type: DataTypes.ARRAY(DataTypes.INTEGER),
        allowNull: true,
        defaultValue: [],
      },
    },
    {
      tableName: "ads",
      timestamps: true,
    }
  );
  return Ads;
}



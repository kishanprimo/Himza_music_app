
import { config } from '../config';

module.exports = (sequelize: any, DataTypes: any) => {
    const Album = sequelize.define('Album', {
        album_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        title: { type: DataTypes.STRING, allowNull: false },
        description: { type: DataTypes.STRING, allowNull: false, defaultValue: "" }, // Fixed typo: descrption -> description
        thumbnail: {
            type: DataTypes.STRING, allowNull: true,
            get(this: any): string {       
                // Assuming config.clientUrl is defined in your configuration
                return this.getDataValue('thumbnail') ? config.clientUrl + this.getDataValue('thumbnail') : "";
            }
        },
        genre_id: { type: DataTypes.INTEGER, allowNull: true },
        is_private: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        user_id: { // Add user_id field for the foreign key
            type: DataTypes.INTEGER,
            allowNull: true,
        },
    }, {
        tableName: 'albums',
        timestamps: true,
    });

    Album.associate = function (models: any) {
        Album.belongsTo(models.User, {
            foreignKey: "user_id",
            as: "creator",
            onDelete: "CASCADE",
        });

        // Album has many AlbumSongs
        Album.hasMany(models.AlbumSong, {
            foreignKey: "album_id",
            as: "songs",
            // onDelete: "CASCADE",
        });
        Album.hasMany(models.History, {
            foreignKey: "album_id",
            as: "history",
            onDelete: "CASCADE",
        });
        Album.belongsTo(models.Genre, {
            foreignKey: "genre_id",
            as: "albumGenre",
        });
    }
    return Album;
}



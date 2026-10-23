import { config } from '../config';

module.exports = (sequelize: any, DataTypes: any) => {
    const Playlist = sequelize.define('Playlist', {
        playlist_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        title: { type: DataTypes.STRING, allowNull: false },
        description: { type: DataTypes.STRING, allowNull: false, defaultValue: "" },
        thumbnail: {
            type: DataTypes.STRING,
            allowNull: true,
            get(this: any): string {
                return this.getDataValue('thumbnail')
                    ? config.clientUrl + this.getDataValue('thumbnail')
                    : "";
            }
        },
        genre_id: { type: DataTypes.INTEGER, allowNull: true },
        is_private: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
    }, {
        tableName: 'playlists',
        timestamps: true,
    });

    Playlist.associate = function (models: any) {

        Playlist.belongsTo(models.User, {
            foreignKey: "user_id",
            as: "creator",
            onDelete: "CASCADE",
        });

        Playlist.hasMany(models.PlaylistSong, {
            foreignKey: "playlist_id",
            as: "songs",
        });

        Playlist.hasMany(models.History, {
            foreignKey: "playlist_id",
            as: "history",
            onDelete: "CASCADE",
        });

        Playlist.belongsTo(models.Genre, {
            foreignKey: "genre_id",
            as: "playlistGenre",
        });
    };

    return Playlist;
};
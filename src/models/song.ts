
import { config } from '../config';


module.exports = (sequelize: any, DataTypes: any) => {
    const Song = sequelize.define('song', {
        song_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        title: { type: DataTypes.STRING, allowNull: false },
        audio: {
            type: DataTypes.STRING, allowNull: false,
            get(this: any): string {       
                return config.clientUrl + this.getDataValue('audio');
            }
        },
        thumbnail: {
            type: DataTypes.STRING, allowNull: false,
            get(this: any): string {       
                return config.clientUrl + this.getDataValue('thumbnail');
            }
        },
        genre_id: {
            type: DataTypes.INTEGER,

        },
        category_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'categories', // Assuming you have a categories table
                key: 'category_id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
        },
        duration: { type: DataTypes.STRING, allowNull: false },
        status: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    }, {
        tableName: 'songs',
        timestamps: true,
    });


    Song.associate = function (models: any) {
        Song.hasMany(models.favorites, {
            foreignKey: "song_id",
            as: "downloadedBy",
        });

        Song.hasMany(models.Downloads, {
            foreignKey: "song_id",
            as: "favoriteBy",
        });
        Song.hasMany(models.MusicSinger, {
            foreignKey: "song_id",
            as: "artists",
            // onDelete: "CASCADE",
            // hooks: true,
        });
        Song.belongsTo(models.Genre, {
            foreignKey: "genre_id",
            as: "genre",
        });
        Song.hasMany(models.AlbumSong, {
            foreignKey: "song_id",
            as: "albumAssociations",
            // onDelete: "CASCADE",
        });
        Song.hasMany(models.History, {
            foreignKey: "song_id",
            as: "history",
        });
        Song.hasMany(models.MovieSongConnection, {
            foreignKey: "song_id",
            as: "movie",
        });

        Song.hasMany(models.favoriteAlbums, {
            foreignKey: "album_id",
            as: "favoriteAlbumBy",
        });
    }
    return Song
}



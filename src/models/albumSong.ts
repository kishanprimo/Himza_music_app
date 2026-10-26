
module.exports = (sequelize: any, DataTypes: any) => {
    const AlbumSongs = sequelize.define('AlbumSong', {
        album_song_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        album_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "albums", // must match table name
                key: "album_id",
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
    }, {
        tableName: 'album_songs',
        timestamps: true,
    });

    AlbumSongs.associate = function (models: any) {
        AlbumSongs.belongsTo(models.Album, {
            foreignKey: "album_id",
            as: "album",
            onDelete: "CASCADE",
        });
        AlbumSongs.belongsTo(models.song, {
            foreignKey: "song_id",
            as: "song",
            onDelete: "CASCADE",
        });
    }

    return AlbumSongs;
}



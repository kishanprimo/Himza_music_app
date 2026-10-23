module.exports = (sequelize: any, DataTypes: any) => {

    const PlaylistSongs = sequelize.define('PlaylistSong', {
        playlist_song_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },

        playlist_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "playlists", // must match table name
                key: "playlist_id",
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
        tableName: 'playlist_songs',
        timestamps: true,
    });

    PlaylistSongs.associate = function (models: any) {

        PlaylistSongs.belongsTo(models.Playlist, {
            foreignKey: "playlist_id",
            as: "playlist",
            onDelete: "CASCADE",
        });

        PlaylistSongs.belongsTo(models.song, {
            foreignKey: "song_id",
            as: "song",
            onDelete: "CASCADE",
        });

    }

    return PlaylistSongs;
}
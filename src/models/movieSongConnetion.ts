

module.exports = (sequelize: any, DataTypes: any) => {
    const MovieSongConnection = sequelize.define('MovieSongConnection', {
        movie_song_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        movie_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        song_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
    }, {
        tableName: 'movie_song_connections',
        timestamps: true,
    });
    MovieSongConnection.associate = function (models: any) {

        MovieSongConnection.belongsTo(models.Movie, {
            foreignKey: "movie_id",
            as: "movie_details",
            onDelete: "CASCADE",
        });

        MovieSongConnection.belongsTo(models.song, {
            foreignKey: "song_id",
            as: "song_details",
            onDelete: "CASCADE",
        });
    }
    return MovieSongConnection;
}



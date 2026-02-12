
module.exports = (sequelize: any, DataTypes: any) => {
    const SearchHistory = sequelize.define('searchHistory', {
        search_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        type: {
            type: DataTypes.ENUM('song', 'artist', 'album', 'genre'),
            allowNull: false,
        },
        song_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        artist_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        album_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        genre_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
    }, {
        tableName: 'searchHistory',
        timestamps: true,
    });

    return SearchHistory
}



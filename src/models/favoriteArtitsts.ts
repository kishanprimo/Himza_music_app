
module.exports = (sequelize: any, DataTypes: any) => {
    const favoriteArtists = sequelize.define('favoriteArtists', {
        favorite_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        artist_user_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
    }, {
        tableName: 'favoriteArtists',
        timestamps: true,
    });

    return favoriteArtists;
}



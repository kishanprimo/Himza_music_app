
module.exports = (sequelize: any, DataTypes: any) => {
    const favorites = sequelize.define('favorites', {
        favorite_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        song_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
    }, {
        tableName: 'favorites',
        timestamps: true,
    });

    favorites.associate = function (models: any) {
        favorites.belongsTo(models.song, {
            foreignKey: "song_id",
            as: "song",
            onDelete: "CASCADE",
        });

        // favorites belongs to User
        favorites.belongsTo(models.User, {
            foreignKey: "user_id",
            as: "user",
            onDelete: "CASCADE",
        });
    }
    return favorites;
}



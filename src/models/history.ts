
module.exports = (sequelize: any, DataTypes: any) => {
    const History = sequelize.define('History', {
        history_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        song_id: {
            type: DataTypes.INTEGER,
        },
        user_id: {
            type: DataTypes.INTEGER,
        },
        album_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        song_time: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: "00:00",
        },
    }, {
        tableName: 'history',
        timestamps: true,
    });

    History.associate = function (models: any) {
        History.belongsTo(models.User, {
            foreignKey: "user_id",
            as: "user",
            onDelete: "CASCADE",
        });

        History.belongsTo(models.song, {
            foreignKey: "song_id",
            as: "song",
            onDelete: "CASCADE",
        });
        History.belongsTo(models.Album, {
            foreignKey: "album_id",
            as: "album",
            onDelete: "CASCADE",
        });
    }
    return History;
}



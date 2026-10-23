

module.exports = (sequelize: any, DataTypes: any) => {
    const Downloads = sequelize.define('Downloads', {
        download_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: false,
        },
        song_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: false,
        },
    }, {
        tableName: 'downloads',
        timestamps: true,
    });

    Downloads.associate = function (models: any) {
        Downloads.belongsTo(models.song, {
            foreignKey: "song_id",
            as: "song",
            onDelete: "CASCADE",
        });

        // Downloads belongs to User
        Downloads.belongsTo(models.User, {
            foreignKey: "user_id",
            as: "user",
            onDelete: "CASCADE",
        });
    }
    return Downloads
}



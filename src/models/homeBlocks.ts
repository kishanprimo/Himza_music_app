

module.exports = (sequelize: any, DataTypes: any) => {
    const HomeBlocks = sequelize.define('HomeBlocks', {
        block_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        type: {
            type: DataTypes.ENUM('album', 'song', 'genre', 'artist', 'mix'),
            allowNull: false,
            defaultValue: "album",
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "",
        },
        subtitle: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "",
        },
        description: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: "",
        },
        album_ids: {
            type: DataTypes.ARRAY(DataTypes.INTEGER),
            allowNull: true,
            defaultValue: [],
        },
        song_ids: {
            type: DataTypes.ARRAY(DataTypes.INTEGER),
            allowNull: true,
            defaultValue: [],
        },
        genre_ids: {
            type: DataTypes.ARRAY(DataTypes.INTEGER),
            allowNull: true,
            defaultValue: [],
        },
        artist_ids: {
            type: DataTypes.ARRAY(DataTypes.INTEGER),
            allowNull: true,
            defaultValue: [],
        },
        is_deleted: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        order_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        is_visible: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
    }, {
        tableName: 'homeBlocks',
        timestamps: true,
    });

    return HomeBlocks;
}



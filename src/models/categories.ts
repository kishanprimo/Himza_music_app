

module.exports = (sequelize: any, DataTypes: any) => {
    const Categories = sequelize.define('Categories', {
        category_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        name: { type: DataTypes.STRING },
    }, {
        tableName: 'categories',
        timestamps: true,
    });
    return Categories;
}


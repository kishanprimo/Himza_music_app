
import { config } from '../config';
module.exports = (sequelize: any, DataTypes: any) => {
    const Avatar = sequelize.define('Avatar', {
        avatar_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        path: {
            type: DataTypes.STRING,
            allowNull: false,
            get(this: any): string {       
                return config.clientUrl + this.getDataValue('path');
            }
        },
        name: { type: DataTypes.STRING, allowNull: false },
    }, {
        tableName: 'avatar',
        timestamps: true,
    });
    return Avatar;

}


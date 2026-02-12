import fs from "fs";
import path from "path";
import { Sequelize, DataTypes } from "sequelize";
import process from "process";
import configFile from "../config/config";

const basename = path.basename(__filename);
const env = (process.env.NODE_ENV || "development") as keyof typeof configFile;
const config = configFile[env];

interface DB {
  [key: string]: any;
  sequelize?: Sequelize;
  Sequelize?: typeof Sequelize;
}

const db: DB = {};

let sequelize: Sequelize;

sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  config
);

// Read all model files in the same directory
fs.readdirSync(__dirname)
  .filter((file: string) => {
    return (
      file.indexOf(".") !== 0 &&
      file !== basename &&
      (file.endsWith(".ts") || file.endsWith(".js")) &&
      file.indexOf(".test.ts") === -1
    );
  })
  .forEach((file: string) => {
    const modelImport = require(path.join(__dirname, file));
    // Use .default if it exists (ES module), otherwise use CommonJS
    const model = (modelImport.default ?? modelImport)(sequelize, DataTypes);
    db[model.name] = model;
  });

// Run associations if any
Object.keys(db).forEach((modelName: string) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

export default db;

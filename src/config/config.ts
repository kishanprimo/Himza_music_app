import dotenv from "dotenv";
import { Dialect } from "sequelize";

dotenv.config({ path: `.env` });

interface DBConfig {
    username: string;
    password: string;
    database: string;
    host: string;
    dialect: Dialect;
    logging: boolean;
}

const development: DBConfig = {
    host: process.env.DB_HOST as string,
    username: process.env.DB_USERNAME as string,
    password: process.env.DB_PASSWORD as string,
    database: process.env.DB_NAME as string,
    dialect: "postgres",
    logging: false,
};

const production: DBConfig = {
    host: process.env.DB_HOST as string,
    username: process.env.DB_USERNAME as string,
    password: process.env.DB_PASSWORD as string,
    database: process.env.DB_NAME as string,
    dialect: "postgres",
    logging: false,
};

export default {
    development,
production,
};

import "reflect-metadata";
import { DataSource } from "typeorm";
import "dotenv/config";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const AppDataSource = new DataSource({
  type: "mariadb",
  host: process.env.DB_HOST ?? "127.0.0.1",
  port: parseInt(process.env.DB_PORT ?? "3306", 10),
  username: process.env.DB_USER ?? "root", 
  password: process.env.DB_PASS ?? "", 
  database: process.env.DB_NAME ?? "Tavare", 
  synchronize: false, 
  logging: true,
  entities: [__dirname + "/entities/*.ts"],
  migrations: [__dirname + "/migrations/**/*.ts"],
  subscribers: [],
});
import "reflect-metadata"
import { DataSource } from "typeorm"
import { Contact } from "./entity/Contact"
require('dotenv').config();

export const AppDataSource = new DataSource({
    type: "postgres",
    host: process.env.HOST?.toString(),
    port: 5432,
    username: process.env.USER?.toString(),
    password: process.env.PASSWORD?.toString(),
    database: process.env.DATABASE?.toString(),
    synchronize: true,
    logging: false,
    entities: [Contact]
})

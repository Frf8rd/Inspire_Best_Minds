import dotenv from "dotenv";

dotenv.config();

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
});

export const prisma = new PrismaClient({
    adapter,
});

export async function checkDatabaseConnection() {
    try {
        await prisma.$connect();
        console.log("Database connected successfully!");
    } catch (error) {
        console.error("Database connection failed!");
        console.error(error);
    }
}

export default prisma;
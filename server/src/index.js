import express from "express";
import { checkDatabaseConnection } from "./config/database.js";

const app = express();

app.use(express.json());

const PORT = process.env.PORT || 5000;

checkDatabaseConnection();

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
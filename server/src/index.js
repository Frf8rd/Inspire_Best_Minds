import express from "express";
import { checkDatabaseConnection } from "./config/database.js";
import problemsRoutes from "./features/problems/problems.routes.js";

const app = express();

app.use(express.json());

app.use("/problems", problemsRoutes);

const PORT = process.env.PORT || 5000;

checkDatabaseConnection();

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
import "dotenv/config";
import app from "./app.js";
import { checkDatabaseConnection } from "./config/database.js";

const PORT = process.env.PORT || 5000;

checkDatabaseConnection();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

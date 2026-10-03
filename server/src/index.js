import "dotenv/config";
import app from "./app.js";
import { checkDatabaseConnection } from "./config/database.js";
import { startPriorityRecalculationJob } from "./features/problems/problems.intelligence.js";
import { startEscalationJob } from "./features/complaints/complaints.service.js";

const PORT = process.env.PORT || 5000;

checkDatabaseConnection();

// Pornire joburi periodice de fundal
startPriorityRecalculationJob();
startEscalationJob();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


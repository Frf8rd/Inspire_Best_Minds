import "dotenv/config";
console.log("[BOOT] index.js încărcat din:", import.meta.url);
import app from "./app.js";
import { getAiStatus } from "./features/ai/ai.service.js";
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
  const ai = getAiStatus();
  console.log(
    ai.enabled
      ? `[AI] Verificare activă: ${ai.provider} (${ai.model})`
      : "[AI] Verificare OPRITĂ: lipsește o cheie (ex. GEMINI_API_KEY) în server/.env. Se aplică doar verificarea locală a textului."
  );
});
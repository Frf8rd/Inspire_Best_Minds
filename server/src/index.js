import "dotenv/config";
import app from "./app.js";
import { checkDatabaseConnection } from "./config/database.js";
import { startPriorityRecalculationJob } from "./features/problems/problems.intelligence.js";
import { startEscalationJob } from "./features/complaints/complaints.service.js";
import { getAiStatus } from "./features/ai/ai.service.js";

const PORT = process.env.PORT || 5000;

checkDatabaseConnection();

// Pornire joburi periodice de fundal
startPriorityRecalculationJob();
startEscalationJob();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  const ai = getAiStatus();
  if (ai.enabled) {
    console.log(`[AI] Verificare activă: ${ai.provider} (${ai.model})`);
  } else {
    console.warn(
      "[AI] ATENȚIE: nicio cheie AI configurată în server/.env (GEMINI_API_KEY etc.). " +
        "Sesizările NU sunt verificate semantic (text/foto), doar filtrul local de taste aleatorii."
    );
  }
});


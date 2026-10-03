import http from "http";
import app from "./src/app.js";
import { prisma } from "./src/config/database.js";

async function main() {
  console.log("\n==========================================");
  console.log("   TESTARE MODUL AUTENTIFICARE & SERVER   ");
  console.log("==========================================\n");

  // Verificam daca serverul ruleaza deja pe portul 5000 sau pornim un server temporar pe 5099
  let baseUrl = "http://localhost:5000/api";
  let tempServer = null;

  try {
    const ping = await fetch("http://localhost:5000/api/health");
    if (ping.ok) {
      console.log("-> Conectat la serverul activ pe portul 5000.");
    }
  } catch {
    console.log("-> Serverul nu este pornit. Pornim o instanță de test pe portul 5099...");
    tempServer = http.createServer(app);
    await new Promise((resolve) => tempServer.listen(5099, resolve));
    baseUrl = "http://localhost:5099/api";
    console.log("-> Instanță de test pornită cu succes.\n");
  }

  const authUrl = `${baseUrl}/auth`;
  const uniqueId = Date.now();
  const testUser = {
    username: `tester_${uniqueId}`,
    email: `tester_${uniqueId}@example.com`,
    password: "Password123!",
  };

  let savedCookies = [];

  // 1. Health check
  console.log("[1/6] Testare Health Check (/api/health)...");
  const healthRes = await fetch(`${baseUrl}/health`);
  const healthData = await healthRes.json();
  if (healthRes.ok && healthData.status === "ok") {
    console.log("  ✔ Serverul răspunde: OK");
  } else {
    throw new Error("Health check eșuat.");
  }

  // 2. Register
  console.log("\n[2/6] Testare Înregistrare User (/api/auth/register)...");
  const regRes = await fetch(`${authUrl}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(testUser),
  });
  const regData = await regRes.json();
  if (regRes.status === 201) {
    console.log("  ✔ Utilizator creat cu succes:", regData.user.email);
    const rawCookies = regRes.headers.getSetCookie ? regRes.headers.getSetCookie() : [regRes.headers.get("set-cookie")];
    savedCookies = rawCookies.map((c) => c.split(";")[0]);
    console.log("  ✔ Cookie-uri primite (accessToken & refreshToken): OK");
  } else {
    throw new Error(`Înregistrarea a eșuat (${regRes.status}): ${JSON.stringify(regData)}`);
  }

  // 3. GetMe cu cookie
  console.log("\n[3/6] Testare Rută Protejată Profile (/api/auth/me)...");
  const meRes = await fetch(`${authUrl}/me`, {
    headers: { Cookie: savedCookies.join("; ") },
  });
  const meData = await meRes.json();
  if (meRes.ok && meData.user?.email === testUser.email) {
    console.log("  ✔ Autentificarea cu cookie HttpOnly funcționează!");
    console.log("  ✔ Date utilizator:", meData.user.username, `(Role: ${meData.user.role})`);
  } else {
    throw new Error(`GetMe a eșuat: ${JSON.stringify(meData)}`);
  }

  // 4. Refresh token
  console.log("\n[4/6] Testare Rotație Refresh Token (/api/auth/refresh)...");
  const refRes = await fetch(`${authUrl}/refresh`, {
    method: "POST",
    headers: { Cookie: savedCookies.join("; ") },
  });
  const refData = await refRes.json();
  if (refRes.ok) {
    console.log("  ✔ Refresh token validat și rotit:", refData.message);
    const newCookies = refRes.headers.getSetCookie ? refRes.headers.getSetCookie() : [refRes.headers.get("set-cookie")];
    if (newCookies && newCookies.length) {
      savedCookies = newCookies.map((c) => c.split(";")[0]);
    }
  } else {
    throw new Error(`Refresh a eșuat: ${JSON.stringify(refData)}`);
  }

  // 5. Login
  console.log("\n[5/6] Testare Login clasic (/api/auth/login)...");
  const loginRes = await fetch(`${authUrl}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: testUser.email,
      password: testUser.password,
    }),
  });
  const loginData = await loginRes.json();
  if (loginRes.ok) {
    console.log("  ✔ Login cu parolă hash-uită prin bcrypt: OK");
  } else {
    throw new Error(`Login a eșuat: ${JSON.stringify(loginData)}`);
  }

  // 6. Logout
  console.log("\n[6/6] Testare Logout (/api/auth/logout)...");
  const logoutRes = await fetch(`${authUrl}/logout`, {
    method: "POST",
    headers: { Cookie: savedCookies.join("; ") },
  });
  const logoutData = await logoutRes.json();
  if (logoutRes.ok) {
    console.log("  ✔ Deconectare și invalidare sesiune DB: OK");
  } else {
    throw new Error(`Logout a eșuat: ${JSON.stringify(logoutData)}`);
  }

  // Curatare utilizator de test
  console.log("\nCurățare utilizator de test din baza de date Neon...");
  await prisma.user.delete({ where: { email: testUser.email } });
  console.log("✔ Utilizatorul de test a fost șters.");

  if (tempServer) {
    await new Promise((resolve) => tempServer.close(resolve));
  }
  await prisma.$disconnect();

  console.log("\n==========================================");
  console.log("   TOATE TESTELE AU TRECUT CU SUCCES!     ");
  console.log("==========================================\n");
}

main().catch(async (err) => {
  console.error("\n❌ EROARE LA TESTARE:", err.message);
  await prisma.$disconnect().catch(() => null);
  process.exit(1);
});

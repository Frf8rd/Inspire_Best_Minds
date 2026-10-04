/**
 * Creează (sau promovează) un utilizator ADMIN direct în baza de date.
 *
 * Folosire (din folderul server/, cu DATABASE_URL setat în .env):
 *   npx tsx scripts/create-admin.js
 *   npx tsx scripts/create-admin.js --email admin@exemplu.md --name "Ion Admin"
 *
 * Ce lipsește se cere interactiv (parola nu apare pe ecran și nu rămâne în istoricul shell-ului).
 * Neinteractiv (CI / server): ADMIN_EMAIL, ADMIN_NAME, ADMIN_PASSWORD ca variabile de mediu.
 *
 * Dacă emailul există deja, contul este promovat la ADMIN și reactivat; parola se schimbă
 * doar dacă introduci una nouă (Enter = o păstrezi pe cea actuală).
 */
import "dotenv/config";
import readline from "node:readline";
import bcrypt from "bcryptjs";
import validator from "validator"; // dependență a lui express-validator, aceeași normalizare ca la login
import { prisma } from "../src/config/database.js";

const MIN_PASSWORD = 8;

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const [k, inline] = a.slice(2).split("=");
      out[k] = inline ?? argv[++i];
    }
  }
  return out;
}

function ask(question, { hidden = false } = {}) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    let muted = false;
    const write = rl._writeToOutput?.bind(rl);
    if (hidden && write) {
      rl._writeToOutput = (s) => {
        if (!muted) write(s);
      };
    }
    rl.question(question, (answer) => {
      rl.close();
      if (hidden) process.stdout.write("\n");
      resolve(answer.trim());
    });
    muted = hidden;
  });
}

// Aceeași normalizare ca la login (loginRules: .normalizeEmail()), apoi lowercase ca în controller.
const normalizeEmail = (email) => {
  const trimmed = String(email).trim();
  return String(validator.normalizeEmail(trimmed) || trimmed).toLowerCase();
};

function checkPassword(pw) {
  if (pw.length < MIN_PASSWORD) return `Parola trebuie să aibă cel puțin ${MIN_PASSWORD} caractere.`;
  if (!/\d/.test(pw)) return "Parola trebuie să conțină cel puțin o cifră.";
  return null;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const interactive = process.stdin.isTTY;

  let email = args.email || process.env.ADMIN_EMAIL || "";
  if (!email && interactive) email = await ask("Email admin: ");
  if (!email || !validator.isEmail(email)) throw new Error("Email invalid sau lipsă.");
  email = normalizeEmail(email);

  const existing = await prisma.user.findUnique({ where: { email } });

  let name = args.name || process.env.ADMIN_NAME || "";
  if (!name && !existing && interactive) name = await ask("Nume: ");
  if (!existing && (name.length < 2 || name.length > 50)) {
    throw new Error("Numele trebuie să aibă între 2 și 50 de caractere.");
  }

  let password = args.password || process.env.ADMIN_PASSWORD || "";
  if (!password && interactive) {
    const label = existing ? "Parolă nouă (Enter = păstrează parola actuală): " : "Parolă: ";
    password = await ask(label, { hidden: true });
    if (password) {
      const confirm = await ask("Confirmă parola: ", { hidden: true });
      if (confirm !== password) throw new Error("Parolele nu coincid.");
    }
  }
  if (!existing && !password) throw new Error("Parola este obligatorie pentru un cont nou.");
  if (password) {
    const problem = checkPassword(password);
    if (problem) throw new Error(problem);
  }

  const passwordHash = password ? await bcrypt.hash(password, 12) : undefined; // același cost ca în auth.controller

  if (existing) {
    const user = await prisma.user.update({
      where: { email },
      data: { role: "ADMIN", isActive: true, ...(passwordHash && { passwordHash }) },
    });
    console.log(`✔ Utilizatorul existent ${user.email} este acum ADMIN${passwordHash ? " (parolă schimbată)" : ""}.`);
  } else {
    const user = await prisma.user.create({
      data: { name, email, passwordHash, role: "ADMIN" },
    });
    console.log(`✔ Admin creat: ${user.email} (id: ${user.id})`);
  }
}

main()
  .catch((err) => {
    console.error(`✖ ${err.message}`);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
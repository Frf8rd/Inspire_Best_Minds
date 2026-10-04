# 🏙️ UrbanAlert — Platformă de Sesizări Urbane & Transparență Instituțională

**UrbanAlert** este o platformă web de ultimă generație concepută pentru remedierea rapidă a problemelor urbane prin implicare cetățenească, rutare inteligentă automată și transparență administrativă în timp real.

---

## 🚀 Funcționalități Implementate Cap-Coadă

### 👤 1. Cetățean (Citizen Flow)
- **Autentificare & Profil**: Înregistrare, Autentificare cu rotație de Refresh Tokens, profil utilizator cu modificare nume/telefon și schimbare securizată de parolă.
- **Creare Sesizare cu Upload & Harta**:
  - Titlu, descriere, selecție categorie, fotografii (maxim 5 imagini, max. 5MB per fișier, validare tip MIME/magic bytes).
  - Selectare interactivă a punctului GPS pe hartă sau preluare automată a geolocației GPS.
- **Inteligență Urbană & Detectare Duplicate**:
  - Preluare automată dinamică a departamentului responsabil (Motor de Reguli de Rutare Automată).
  - Detectare automată a tichetelor similare în rază de 30m și 14 zile. Când o problemă este identificată ca duplicat, se adaugă automat un vot **+1** la tichetul principal.
  - Calculare dinamică a **Scorului de Prioritate (0–100)** și clasificarea în `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` pe baza susținerilor, vechimii și tipului categoriei.
  - Recalculare orară automată a priorităților prin background cron job.
- **Implicare & Confirmare Rezolvare**:
  - Vot de susținere (+1) pe orice tichet existent.
  - Comentarii publice.
  - **Confirmare de către Cetățean**: Când un tichet este marcat ca `RESOLVED_PENDING_CONFIRMATION` de către personal, autorul sau susținătorii săi pot confirma (`RESOLVED`) sau infirma rezolvarea (`REOPENED`).
- **Sesizări Formale & Notificări**:
  - Expediere sesizare formală oficială către instituție cu termen legal de răspuns.
  - Centru de notificări în-app și prin email.

### 🏢 2. Personal Instituție (STAFF Workspace)
- **Panou de Comandă Staff**:
  - Vizualizare și filtrare sesizări alocate departamentului instituției după status și prioritate.
  - Schimbare status sesizare conform fluxului legal de tranziții.
  - Înregistrarea răspunsurilor oficiale la sesizările formale cu indicator al termenului legal.

### 🛡️ 3. Administrare Sistem (ADMIN Workspace)
- **Tablou de Bord Analytics (Recharts)**: Grafice interactive cu distribuția sesizărilor după status, categorii și prioritate.
- **Gestionare Utilizatori**: Schimbare roluri (`CITIZEN`, `STAFF`, `ADMIN`), activare/dezactivare conturi cu protecția ultimului administrator.
- **CRUD Categorii**: Adăugare, editare și dezactivare categorii de probleme.
- **Instituții & Departamente**: Creare instituții, departamente și atribuire membri staff.
- **Harta Responsabilității (Routing Rules)**: Configurare reguli automate de mapare Categorie ➔ Departament cu precedență.

---

## 🛠️ Tehnologii Utilizate

- **Backend**: Node.js, Express 5, Prisma 7, PostgreSQL (Neon DB), JWT (httpOnly cookie), Multer, Resend Email API.
- **Frontend**: React 19, Vite, React Router DOM, Leaflet & OpenStreetMap, Recharts, Lucide Icons.

---

## 💻 Instrucțiuni de Pornire Locală

### 1. Clonare & Configurare Mediu
```bash
# În directorul server:
cd server
cp .env.example .env
npm install
npx prisma db push
```

### 2. Pornire Server Backend
```bash
cd server
npm run dev
# Serverul va rula la http://localhost:5000
```

### 3. Pornire Client Frontend
```bash
cd client
npm install
npm run dev
# Clientul va rula la http://localhost:5173
```

---

## 🔑 Conturi Demo pentru Hackathon

Puteți folosi butoanele de **Acces Rapid Demo** din pagina de login (`/login`):

| Rol | Email | Parolă |
| :--- | :--- | :--- |
| **Cetățean** | `citizen@urbanpulse.md` | `Test1234` |
| **Staff** | `staff@urbanpulse.md` | `Test1234` |
| **Admin** | `admin@urbanpulse.md` | `Test1234` |
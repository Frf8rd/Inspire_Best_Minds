# UrbanPulse client

The React/Vite client uses the dashboard, map, reporting, authentication, and profile design in `src/design`. Its service adapter calls the existing server API through the shared API client in `src/api`; it does not use local mock data.

## Run locally

```sh
npm install
npm run dev
```

The Vite development server proxies `/api` and `/uploads` to `http://localhost:5000`. Start the server from `../server` and configure its database and environment variables before using authenticated or data-backed features.

For a deployed client, set `VITE_API_URL` to the server API base URL, such as `https://api.example.md/api`. The server must allow the client origin and credentials.

## Other routes

The design navigation includes the public report list and the protected citizen, staff, notification, and admin pages. Detailed report pages retain comment, status history, support, and formal complaint workflows from the server-integrated client.

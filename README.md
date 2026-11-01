# DashBasket

DashBasket is a local grocery-store demo with a customer storefront and an admin dashboard. It runs on Node.js without third-party packages and keeps its product and order data in a local JSON file.

> **Demo and security notice:** This project is intended for local use or a trusted private network, not public production deployment. Customer sign-in is not verified authentication, checkout is a demo flow, and no payment is collected.

## Features

- Browse products, manage a basket, and submit a demo order.
- Manage products, stock, and orders from the admin dashboard.
- Store data locally between server restarts.
- Use the storefront and dashboard from another device on the same Wi-Fi network.

## Requirements

- Node.js installed on your computer.
- No npm packages or build step are required.

## Run locally

1. Open a terminal in this project folder.
2. Create your private environment file:

   ```powershell
   Copy-Item .env.example .env
   ```

3. Open `.env` and set a private `ADMIN_PASSWORD`. You can also change `ADMIN_USER`; it defaults to `admin`.
4. Start the server:

   ```powershell
   node server.js
   ```

5. Open the app:
   - Storefront: <http://127.0.0.1:8000/>
   - Admin dashboard: <http://127.0.0.1:8000/admin.html>

The server uses port `8000` by default. Set `PORT` in the environment to use a different port.

## Use on a phone

Connect the phone and computer to the same Wi-Fi network, then open the computer's local IPv4 address on the phone, for example `http://10.0.0.5:8000/`. Use the same address with `/admin.html` for the dashboard. If Windows Firewall prompts you, allow Node.js on private networks only.

## Local data and privacy

The server creates `data/store-db.json` when it first starts and updates it with store and order information. This file may contain private customer details, so it is intentionally excluded from Git along with `.env` and local screenshots. Do not publish the database or add real customer data to this repository.

Keep the server on a trusted network. Do not expose it directly to the public internet. SMS one-time-password verification is disabled, and customer names and mobile numbers are not independently verified.

## Troubleshooting

- **The server will not start:** Confirm Node.js is installed and that `.env` contains a non-empty `ADMIN_PASSWORD`.
- **A phone cannot reach the store:** Use the computer's current Wi-Fi IPv4 address rather than `127.0.0.1`, make sure both devices are on the same Wi-Fi, and confirm the server is still running.
- **A checkout request appears to fail:** Check the admin dashboard before retrying; the order may already have been saved.

# DashBasket local store dashboard

The customer storefront is available at `http://127.0.0.1:8000/`. The store dashboard is at `http://127.0.0.1:8000/admin.html`.

Before starting the server, copy `.env.example` to `.env`, set a private `ADMIN_PASSWORD`, and optionally change `ADMIN_USER`. On Windows PowerShell, run `Copy-Item .env.example .env`. Keep `.env` private; it is excluded from Git.

Run `node server.js` from this folder. The server uses only Node.js built-ins and stores product and order data in `data/store-db.json`. The database file is created on first start and survives restarts. To open it from a phone, connect the phone and computer to the same Wi-Fi and use the computer's local IPv4 address, for example `http://10.0.0.5:8000/` and `http://10.0.0.5:8000/admin.html`. Allow Node.js through Windows Firewall for private networks if asked.

## Customer sign-in

SMS OTP verification is currently disabled. For this local demo, customers can continue with their name and a valid Indian mobile number. This is not verified authentication and is not suitable for public production use. OTP sending and verification routes have been removed until SMS setup is ready.

The dashboard has no default password: the server will not start until `ADMIN_PASSWORD` is configured. Keep the server on your trusted local network; this demo is not intended for public internet deployment.

Orders placed through the storefront are saved in the local database, reduce stock, and appear in the dashboard. Customer records are derived from completed checkout details; login passwords and OTPs are not stored. Live delivery-partner GPS sharing is not included yet.

If checkout says it cannot reach the store, make sure the phone is using the computer's current Wi-Fi IPv4 address (not `127.0.0.1`), both devices are on the same Wi-Fi, and `node server.js` is still running. Check the dashboard before submitting again so an order is not accidentally duplicated after a dropped connection.

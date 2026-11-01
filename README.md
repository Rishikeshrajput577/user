# DashBasket storefront

DashBasket is a demo grocery storefront powered by a small Node.js server. It displays products and saves demo checkout orders locally.

> **Demo only:** No payment is collected and no real order is sent to a store. Customer sign-in is not verified authentication. Use test information only; do not enter real customer details.

## Run locally

1. Install Node.js.
2. Copy .env.example to .env and set a private ADMIN_PASSWORD with at least 16 characters.
3. Run node server.js in this folder.
4. Open <http://127.0.0.1:8000/>.

The ADMIN_PASSWORD setting is required by the server; do not share it. The .env file and local order database are excluded from Git.

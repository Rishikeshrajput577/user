const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const ROOT = __dirname;
const DB_DIR = path.join(ROOT, "data");
const DB_FILE = path.join(DB_DIR, "store-db.json");
const PORT = Number(process.env.PORT || 8000);
const sessions = new Map();
const statuses = ["New", "Confirmed", "Packing", "Out for delivery", "Delivered", "Cancelled"];

function loadLocalEnv() {
  const envFile = path.join(ROOT, ".env");
  if (!fs.existsSync(envFile)) return;
  for (const line of fs.readFileSync(envFile, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!match || match[1] in process.env) continue;
    const value = match[2].replace(/^(["'])(.*)\1$/, "$2");
    process.env[match[1]] = value;
  }
}

loadLocalEnv();
const ADMIN_USER = process.env.ADMIN_USER || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
if (!ADMIN_PASSWORD) throw new Error("ADMIN_PASSWORD must be set in the private .env file or environment.");

const products = [
  { id: 1, name: "Amul Taaza Toned Milk", category: "Dairy", emoji: "🥛", weight: "500 ml", price: 29, oldPrice: 32, rating: "4.8", origin: "Amul", tag: "Bestseller", tint: "#f1f6fc", image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=480&q=80", stock: 28, active: true },
  { id: 2, name: "Harvest Gold Brown Bread", category: "Bakery", emoji: "🍞", weight: "400 g", price: 45, oldPrice: 0, rating: "4.6", origin: "Harvest Gold", tag: "Fresh", tint: "#fbf0df", image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=480&q=80", stock: 16, active: true },
  { id: 3, name: "Farm Fresh Eggs", category: "Dairy", emoji: "🥚", weight: "6 pieces", price: 72, oldPrice: 0, rating: "4.7", origin: "Eggoz", tag: "", tint: "#fbf5e8", image: "https://images.unsplash.com/photo-1506976785307-8732e854ad03?auto=format&fit=crop&w=480&q=80", stock: 20, active: true },
  { id: 4, name: "Royal Gala Apples", category: "Fruits", emoji: "🍎", weight: "4 pieces", price: 119, oldPrice: 149, rating: "4.5", origin: "Himachal Pradesh", tag: "20% OFF", tint: "#f9ecea", image: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=480&q=80", stock: 12, active: true },
  { id: 5, name: "Robusta Banana", category: "Fruits", emoji: "🍌", weight: "6 pieces", price: 42, oldPrice: 0, rating: "4.8", origin: "Tamil Nadu", tag: "", tint: "#f8f5db", image: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=480&q=80", stock: 24, active: true },
  { id: 6, name: "Hass Avocado", category: "Fruits", emoji: "🥑", weight: "1 piece", price: 89, oldPrice: 0, rating: "4.4", origin: "Imported", tag: "New", tint: "#eff5e4", image: "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&w=480&q=80", stock: 8, active: true },
  { id: 7, name: "Lay's Classic Salted", category: "Snacks", emoji: "🍟", weight: "52 g", price: 20, oldPrice: 0, rating: "4.7", origin: "Lay's", tag: "", tint: "#f8eddd", image: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=480&q=80", stock: 35, active: true },
  { id: 8, name: "Real Orange Juice", category: "Drinks", emoji: "🧃", weight: "1 litre", price: 110, oldPrice: 0, rating: "4.6", origin: "Dabur", tag: "", tint: "#f9f1df", image: "https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&w=480&q=80", stock: 14, active: true },
  { id: 9, name: "Local Red Tomatoes", category: "Vegetables", emoji: "🍅", weight: "500 g", price: 34, oldPrice: 0, rating: "4.3", origin: "Locally sourced", tag: "Fresh", tint: "#f8e9e5", image: "https://images.unsplash.com/photo-1546094096-0df4bcaaa337?auto=format&fit=crop&w=480&q=80", stock: 30, active: true },
  { id: 10, name: "Dairy Milk Silk", category: "Snacks", emoji: "🍫", weight: "60 g", price: 99, oldPrice: 0, rating: "4.8", origin: "Cadbury", tag: "", tint: "#f4ece7", image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=480&q=80", stock: 18, active: true },
  { id: 11, name: "Amul Masti Dahi", category: "Dairy", emoji: "🥣", weight: "400 g", price: 49, oldPrice: 0, rating: "4.6", origin: "Amul", tag: "", tint: "#f4f3ea", image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=480&q=80", stock: 15, active: true },
  { id: 12, name: "Fresh Potatoes", category: "Vegetables", emoji: "🥔", weight: "1 kg", price: 38, oldPrice: 0, rating: "4.5", origin: "Locally sourced", tag: "", tint: "#f3eee4", image: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=480&q=80", stock: 40, active: true },
  { id: 13, name: "Green Capsicum", category: "Vegetables", emoji: "🫑", weight: "2 pieces", price: 32, oldPrice: 0, rating: "4.4", origin: "Locally sourced", tag: "", tint: "#eef4e6", image: "https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?auto=format&fit=crop&w=480&q=80", stock: 17, active: true },
  { id: 14, name: "Cavins Chocolate Milkshake", category: "Drinks", emoji: "🥤", weight: "200 ml", price: 35, oldPrice: 0, rating: "4.5", origin: "Cavins", tag: "", tint: "#f2e9e3", image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=480&q=80", stock: 21, active: true },
  { id: 15, name: "Aashirvaad Atta", category: "Staples", emoji: "🌾", weight: "5 kg", price: 269, oldPrice: 0, rating: "4.8", origin: "Aashirvaad", tag: "Popular", tint: "#f5f0e5", image: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=480&q=80", stock: 10, active: true },
  { id: 16, name: "Tata Salt", category: "Staples", emoji: "🧂", weight: "1 kg", price: 28, oldPrice: 0, rating: "4.7", origin: "Tata", tag: "", tint: "#edf2f6", image: "https://images.unsplash.com/photo-1518110925495-5fe2fda0442c?auto=format&fit=crop&w=480&q=80", stock: 26, active: true },
  { id: 17, name: "Britannia Good Day", category: "Snacks", emoji: "🍪", weight: "200 g", price: 40, oldPrice: 0, rating: "4.6", origin: "Britannia", tag: "", tint: "#f5eddf", image: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=480&q=80", stock: 22, active: true },
  { id: 18, name: "Fresh Coriander", category: "Vegetables", emoji: "🌿", weight: "1 bunch", price: 15, oldPrice: 0, rating: "4.2", origin: "Locally sourced", tag: "Fresh", tint: "#edf4e9", image: "https://images.unsplash.com/photo-1600326145552-327f74b9c189?auto=format&fit=crop&w=480&q=80", stock: 19, active: true }
];

fs.mkdirSync(DB_DIR, { recursive: true });
let db;
if (fs.existsSync(DB_FILE)) {
  db = JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
  if (!db || !Array.isArray(db.products) || !Array.isArray(db.orders)) throw new Error("Store database is invalid.");
} else {
  db = { products, orders: [], categories: [] };
  saveDb();
}
if (!Array.isArray(db.categories) || !db.categories.length) {
  db.categories = [...new Set(db.products.map(product => product.category).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  saveDb();
}

function saveDb() {
  const temporary = `${DB_FILE}.tmp`;
  fs.writeFileSync(temporary, JSON.stringify(db, null, 2));
  fs.renameSync(temporary, DB_FILE);
}

function sendJson(res, status, value, headers = {}) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "no-referrer",
    ...headers
  });
  res.end(JSON.stringify(value));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", chunk => {
      body += chunk;
      if (body.length > 256_000) {
        reject(Object.assign(new Error("Request is too large."), { status: 413 }));
        req.destroy();
      }
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(body || "{}"));
      } catch {
        reject(Object.assign(new Error("Request body must be valid JSON."), { status: 400 }));
      }
    });
    req.on("error", reject);
  });
}

function isAdmin(req) {
  const token = (req.headers.cookie || "").split(";").map(item => item.trim()).find(item => item.startsWith("dashbasket-session="))?.split("=")[1];
  const createdAt = token && sessions.get(token);
  if (!createdAt) return false;
  if (Date.now() - createdAt > 8 * 60 * 60 * 1000) {
    sessions.delete(token);
    return false;
  }
  return true;
}

function customerList() {
  const customers = new Map();
  for (const order of db.orders) {
    const customer = customers.get(order.customerPhone) || {
      name: order.customerName,
      phone: order.customerPhone,
      orderCount: 0,
      totalSpent: 0,
      lastOrderAt: 0,
      products: {},
      orders: []
    };
    customer.orderCount += 1;
    customer.totalSpent += order.total;
    customer.lastOrderAt = Math.max(customer.lastOrderAt, order.createdAt);
    for (const item of order.items) customer.products[item.name] = (customer.products[item.name] || 0) + item.quantity;
    customer.orders.push({ id: order.id, createdAt: order.createdAt, total: order.total, status: order.status });
    customers.set(order.customerPhone, customer);
  }
  return [...customers.values()].sort((a, b) => b.lastOrderAt - a.lastOrderAt);
}

async function handleApi(req, res, url) {
  const route = url.pathname;
  if (req.method === "GET" && route === "/api/products") {
    return sendJson(res, 200, db.products.filter(product => product.active));
  }
  if (req.method === "GET" && route === "/api/session") {
    return sendJson(res, 200, { authenticated: isAdmin(req), username: process.env.ADMIN_USER || "admin" });
  }
  if (req.method === "POST" && route === "/api/orders") {
    const input = await readBody(req);
    if (typeof input.customerName !== "string" || !input.customerName.trim() || !/^\d{10}$/.test(String(input.customerPhone || "")) || !Array.isArray(input.items) || input.items.length < 1) {
      return sendJson(res, 400, { error: "Customer name, a 10-digit phone number, and order items are required." });
    }
    const quantities = new Map();
    for (const requested of input.items) {
      const product = db.products.find(item => item.id === Number(requested.id) && item.active);
      const quantity = Number(requested.quantity);
      if (!product || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) return sendJson(res, 400, { error: "An order item is invalid or unavailable." });
      quantities.set(product.id, (quantities.get(product.id) || 0) + quantity);
    }
    const items = [];
    for (const [productId, quantity] of quantities) {
      const product = db.products.find(item => item.id === productId);
      if (quantity > 99) return sendJson(res, 400, { error: "An order cannot contain more than 99 units of one product." });
      if (product.stock < quantity) return sendJson(res, 409, { error: `${product.name} has only ${product.stock} left in stock.` });
      items.push({ id: product.id, name: product.name, quantity, price: product.price, weight: product.weight, emoji: product.emoji });
    }
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const deliveryFee = subtotal >= 299 ? 0 : 25;
    const order = {
      id: `DB${Date.now().toString().slice(-8)}${crypto.randomInt(100, 999)}`,
      createdAt: Date.now(),
      customerName: input.customerName.trim().slice(0, 100),
      customerPhone: String(input.customerPhone),
      items,
      address: input.address && typeof input.address === "object" ? input.address : {},
      subtotal,
      deliveryFee,
      total: subtotal + deliveryFee,
      paymentMethod: input.paymentMethod === "upi" ? "upi" : "cod",
      status: "New",
      partnerLocation: ""
    };
    for (const item of items) db.products.find(product => product.id === item.id).stock -= item.quantity;
    db.orders.unshift(order);
    saveDb();
    return sendJson(res, 201, order);
  }
  if (!isAdmin(req)) return sendJson(res, 401, { error: "Please sign in to the store dashboard." });

  if (req.method === "GET" && route === "/api/orders") return sendJson(res, 200, db.orders);
  if (req.method === "GET" && route === "/api/customers") return sendJson(res, 200, customerList());
  if (req.method === "GET" && route === "/api/admin/products") return sendJson(res, 200, db.products);
  if (req.method === "GET" && route === "/api/categories") return sendJson(res, 200, db.categories);

  if (req.method === "POST" && route === "/api/categories") {
    const input = await readBody(req);
    const category = String(input.name || "").trim();
    if (!category) return sendJson(res, 400, { error: "Category name is required." });
    if (db.categories.some(item => item.toLowerCase() === category.toLowerCase())) return sendJson(res, 200, db.categories);
    db.categories.push(category.slice(0, 40));
    db.categories.sort((a, b) => a.localeCompare(b));
    saveDb();
    return sendJson(res, 201, db.categories);
  }

  const categoryMatch = route.match(/^\/api\/categories\/(.+)$/);
  if (req.method === "DELETE" && categoryMatch) {
    const category = decodeURIComponent(categoryMatch[1]);
    const trimmed = category.trim();
    if (!trimmed) return sendJson(res, 400, { error: "Category name is required." });
    const index = db.categories.findIndex(item => item.toLowerCase() === trimmed.toLowerCase());
    if (index === -1) return sendJson(res, 404, { error: "Category not found." });
    const inUse = db.products.some(product => product.category && product.category.toLowerCase() === trimmed.toLowerCase());
    if (inUse) return sendJson(res, 409, { error: "This category is still in use by one or more products." });
    db.categories.splice(index, 1);
    saveDb();
    return sendJson(res, 200, db.categories);
  }

  if (req.method === "POST" && route === "/api/products") {
    const input = await readBody(req);
    if (typeof input.name !== "string" || !input.name.trim() || typeof input.category !== "string" || !input.category.trim() || !Number.isFinite(Number(input.price)) || Number(input.price) < 0 || !Number.isInteger(Number(input.stock)) || Number(input.stock) < 0) {
      return sendJson(res, 400, { error: "Name, category, a valid price, and whole-number stock are required." });
    }
    const categoryName = input.category.trim().slice(0, 40);
    if (!db.categories.some(item => item.toLowerCase() === categoryName.toLowerCase())) {
      db.categories.push(categoryName);
      db.categories.sort((a, b) => a.localeCompare(b));
    }
    const product = {
      id: Math.max(0, ...db.products.map(item => item.id)) + 1,
      name: input.name.trim().slice(0, 100),
      category: categoryName,
      emoji: String(input.emoji || "🛍️").slice(0, 8),
      weight: String(input.weight || "1 piece").slice(0, 40),
      price: Number(input.price),
      oldPrice: 0,
      rating: "New",
      origin: String(input.origin || "Local store").slice(0, 50),
      tag: "",
      tint: "#eff5e4",
      image: "",
      stock: Number(input.stock),
      active: input.active !== false
    };
    db.products.push(product);
    saveDb();
    return sendJson(res, 201, product);
  }

  const productMatch = route.match(/^\/api\/products\/(\d+)$/);
  if (req.method === "PATCH" && productMatch) {
    const product = db.products.find(item => item.id === Number(productMatch[1]));
    if (!product) return sendJson(res, 404, { error: "Product not found." });
    const input = await readBody(req);
    if (input.name !== undefined) {
      if (typeof input.name !== "string" || !input.name.trim()) return sendJson(res, 400, { error: "Product name cannot be empty." });
      product.name = input.name.trim().slice(0, 100);
    }
    if (input.category !== undefined) {
      if (typeof input.category !== "string" || !input.category.trim()) return sendJson(res, 400, { error: "Category cannot be empty." });
      const categoryName = input.category.trim().slice(0, 40);
      if (!db.categories.some(item => item.toLowerCase() === categoryName.toLowerCase())) {
        db.categories.push(categoryName);
        db.categories.sort((a, b) => a.localeCompare(b));
      }
      product.category = categoryName;
    }
    if (input.price !== undefined) {
      if (!Number.isFinite(Number(input.price)) || Number(input.price) < 0) return sendJson(res, 400, { error: "Price must be a non-negative number." });
      product.price = Number(input.price);
    }
    if (input.stock !== undefined) {
      if (!Number.isInteger(Number(input.stock)) || Number(input.stock) < 0) return sendJson(res, 400, { error: "Stock must be a non-negative whole number." });
      product.stock = Number(input.stock);
    }
    if (input.active !== undefined) product.active = Boolean(input.active);
    saveDb();
    return sendJson(res, 200, product);
  }

  const orderMatch = route.match(/^\/api\/orders\/([^/]+)$/);
  if (req.method === "PATCH" && orderMatch) {
    const order = db.orders.find(item => item.id === decodeURIComponent(orderMatch[1]));
    if (!order) return sendJson(res, 404, { error: "Order not found." });
    const input = await readBody(req);
    if (input.status !== undefined) {
      if (!statuses.includes(input.status)) return sendJson(res, 400, { error: "Choose a valid order status." });
      if (["Cancelled", "Delivered"].includes(order.status) && input.status !== order.status) {
        return sendJson(res, 409, { error: `A ${order.status.toLowerCase()} order cannot be changed.` });
      }
      if (order.status !== "Cancelled" && order.status !== "Delivered" && input.status === "Cancelled") {
        for (const line of order.items) {
          const product = db.products.find(item => item.id === line.id);
          if (product) product.stock += line.quantity;
        }
      }
      order.status = input.status;
    }
    if (input.partnerLocation !== undefined) order.partnerLocation = String(input.partnerLocation).trim().slice(0, 300);
    saveDb();
    return sendJson(res, 200, order);
  }

  return sendJson(res, 404, { error: "API endpoint not found." });
}

const contentTypes = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".json": "application/json; charset=utf-8", ".svg": "image/svg+xml" };
const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    if (req.method === "POST" && url.pathname === "/api/login") {
      const input = await readBody(req);
      if (input.username !== ADMIN_USER || input.password !== ADMIN_PASSWORD) return sendJson(res, 401, { error: "Username or password is incorrect." });
      const token = crypto.randomBytes(32).toString("hex");
      sessions.set(token, Date.now());
      return sendJson(res, 200, { username: ADMIN_USER }, { "Set-Cookie": `dashbasket-session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800` });
    }
    if (req.method === "POST" && url.pathname === "/api/logout") {
      const token = (req.headers.cookie || "").split(";").map(item => item.trim()).find(item => item.startsWith("dashbasket-session="))?.split("=")[1];
      if (token) sessions.delete(token);
      return sendJson(res, 200, { ok: true }, { "Set-Cookie": "dashbasket-session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0" });
    }
    if (url.pathname.startsWith("/api/")) return await handleApi(req, res, url);
    if (req.method !== "GET" && req.method !== "HEAD") {
      res.writeHead(405, { Allow: "GET, HEAD" });
      return res.end("Method not allowed");
    }
    const requested = url.pathname === "/" ? "index.html" : decodeURIComponent(url.pathname.slice(1));
    if (!["index.html", "admin.html"].includes(requested)) {
      res.writeHead(404);
      return res.end("Not found");
    }
    const file = path.resolve(ROOT, requested);
    if (!file.startsWith(`${ROOT}${path.sep}`) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
      res.writeHead(404);
      return res.end("Not found");
    }
    res.writeHead(200, { "Content-Type": contentTypes[path.extname(file)] || "application/octet-stream" });
    if (req.method === "HEAD") return res.end();
    fs.createReadStream(file).pipe(res);
  } catch (error) {
    if (!res.headersSent) sendJson(res, error.status || 500, { error: error.status ? error.message : "The request could not be completed." });
    else res.destroy(error);
    if (!error.status) console.error(error);
  }
});

const HOST = process.env.HOST || "0.0.0.0";
server.listen(PORT, HOST, () => {
  console.log(`DashBasket store and admin dashboard listening on port ${PORT}`);
  console.log("Admin credentials are configured via environment variables.");
});

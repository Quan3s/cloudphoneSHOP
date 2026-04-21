require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const Redis = require('ioredis');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const validator = require('email-validator');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Để chạy giao diện HTML

// --- CẤU HÌNH KẾT NỐI (Chỉ khai báo 1 lần duy nhất) ---
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const redis = new Redis(process.env.REDIS_URL);
const JWT_SECRET = process.env.JWT_SECRET || 'secret_123';
const ADMIN_KEY = process.env.ADMIN_KEY;

// --- TỰ ĐỘNG KHỞI TẠO CƠ SỞ DỮ LIỆU ---
const initDB = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS products (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                category VARCHAR(100),
                price_coin INT DEFAULT 0,
                stock INT DEFAULT 0,
                content TEXT
            );
        `);
        console.log("✅ Database initialized successfully");
    } catch (err) {
        console.error("❌ SQL Init Error:", err);
    }
};
initDB();

// --- MIDDLEWARES ---
const auth = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Vui lòng đăng nhập' });
    try {
        req.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch (e) { res.status(403).json({ error: 'Token không hợp lệ' }); }
};

const adminAuth = (req, res, next) => {
    if (req.headers['x-admin-key'] !== ADMIN_KEY) 
        return res.status(403).json({ error: 'Quyền Admin bị từ chối' });
    next();
};

// --- ROUTES API ---

// 1. Đăng ký & Đăng nhập
app.post('/api/signup', async (req, res) => {
    const { username, password } = req.body;
    try {
        const hash = await bcrypt.hash(password, 10);
        const result = await pool.query('INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id', [username, hash]);
        await redis.set(`balance:${result.rows[0].id}`, 0);
        res.json({ message: "Thành công" });
    } catch (e) { res.status(400).json({ error: "Tên tài khoản đã tồn tại" }); }
});

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (user.rows[0] && await bcrypt.compare(password, user.rows[0].password)) {
        const token = jwt.sign({ id: user.rows[0].id }, JWT_SECRET);
        res.json({ token, userId: user.rows[0].id });
    } else { res.status(401).json({ error: "Sai tài khoản hoặc mật khẩu" }); }
});

// 2. Shop & User
app.get('/api/shop', async (req, res) => {
    const result = await pool.query('SELECT * FROM products WHERE stock > 0');
    res.json(result.rows);
});

app.get('/api/user/me', auth, async (req, res) => {
    const balance = await redis.get(`balance:${req.user.id}`) || 0;
    res.json({ id: req.user.id, balance: parseInt(balance) });
});

app.post('/api/sell-gmail', auth, async (req, res) => {
    const { email } = req.body;
    if (!validator.validate(email)) return res.status(400).json({ error: "Email sai" });
    const newBal = await redis.incrby(`balance:${req.user.id}`, 15);
    res.json({ message: "Gmail xác thực thành công", balance: newBal });
});

// 3. Nhiệm vụ & Callback
app.get('/api/tasks', auth, async (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    const done = await redis.get(`task:${req.user.id}:${today}`) || 0;
    res.json({
        completedToday: parseInt(done),
        links: [
            { name: "Nhiệm vụ Link4M", url: `https://link4m.co/st?token=${process.env.LINK4M_TOKEN}&uid=${req.user.id}` },
            { name: "Nhiệm vụ YeuMoney", url: `https://yeumoney.com/st?token=${process.env.YEUMONEY_TOKEN}&uid=${req.user.id}` }
        ]
    });
});

app.get('/htnv', async (req, res) => {
    const { uid } = req.query;
    if(!uid) return res.send("Lỗi: Không tìm thấy UID");
    const today = new Date().toISOString().split('T')[0];
    const key = `task:${uid}:${today}`;
    const count = await redis.get(key) || 0;
    if (parseInt(count) >= 4) return res.send("Đã hết lượt hôm nay");
    
    await redis.incr(key);
    await redis.incrby(`balance:${uid}`, 30);
    res.redirect(`https://cloudphoneshop.onrender.com/?status=task_done`);
});

// 4. Admin
app.post('/api/admin/product', adminAuth, async (req, res) => {
    const { name, price, stock, content } = req.body;
    await pool.query('INSERT INTO products (name, price_coin, stock, content) VALUES ($1, $2, $3, $4)', [name, price, stock, content]);
    res.json({ success: true });
});

app.post('/api/admin/coin', adminAuth, async (req, res) => {
    const { userId, amount } = req.body;
    const bal = await redis.incrby(`balance:${userId}`, amount);
    res.json({ balance: bal });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server on ${PORT}`));

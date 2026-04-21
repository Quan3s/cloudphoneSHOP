require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { pool } = require('./src/config/db');
const apiRoutes = require('./src/routes/api');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Thêm dòng này sau khi khai báo app

// Tự động khởi tạo bảng SQL - Không cần chạy lệnh ngoài
const initDB = async () => {
    const query = `
        CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, username VARCHAR(50) UNIQUE, password TEXT);
        CREATE TABLE IF NOT EXISTS products (id SERIAL PRIMARY KEY, name TEXT, category TEXT, price_coin INT, stock INT, content TEXT);
        CREATE TABLE IF NOT EXISTS transactions (id SERIAL PRIMARY KEY, user_id INT, p_name TEXT, amount INT, date TIMESTAMP DEFAULT NOW());
    `;
    try {
        await pool.query(query);
        console.log("✅ SQL Tables Ready");
    } catch (e) { console.error("❌ SQL Init Error:", e); }
};
initDB();

app.use('/api', apiRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
src/config/db.js
code
JavaScript

download

content_copy

expand_less
const { Pool } = require('pg');
const Redis = require('ioredis');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// Render Redis yêu cầu chuỗi rediss:// (có s cho SSL)
const redis = new Redis(process.env.REDIS_URL);

module.exports = { pool, redis };

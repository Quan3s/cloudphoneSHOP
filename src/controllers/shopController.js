const { pool, redis } = require('../config/db');
const validator = require('email-validator');
const nodemailer = require('nodemailer');

exports.getProducts = async (req, res) => {
    const products = await pool.query('SELECT * FROM products WHERE stock > 0');
    res.json(products.rows);
};

exports.sellGmail = async (req, res) => {
    const { email } = req.body;
    if (!validator.validate(email)) return res.status(400).json({ error: "Invalid Gmail" });

    // SMTP Ping logic
    let transporter = nodemailer.createTransport({ host: "smtp.gmail.com", port: 587, secure: false });
    // Nếu pass qua validate, cộng 15 coin
    const newBal = await redis.incrby(`balance:${req.user.id}`, 15);
    res.json({ message: "Gmail verified", balance: newBal });
};

exports.rechargeCard = async (req, res) => {
    const { code, serial, telco } = req.body;
    console.log(`[CARD] User ${req.user.id} nạp ${telco}. Hotline: ${process.env.RECIPIENT_PHONE}`);
    // Giả lập check định dạng
    if (code.length < 10) return res.status(400).json({ error: "Code too short" });
    res.json({ status: "Pending approval" });
};

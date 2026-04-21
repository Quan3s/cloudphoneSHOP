const { pool, redis } = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.signup = async (req, res) => {
    const { username, password } = req.body;
    const hash = await bcrypt.hash(password, 10);
    try {
        const result = await pool.query('INSERT INTO users(username, password) VALUES($1, $2) RETURNING id', [username, hash]);
        await redis.set(`balance:${result.rows[0].id}`, 0);
        res.json({ success: true });
    } catch (e) { res.status(400).json({ error: "Username exists" }); }
};

exports.login = async (req, res) => {
    const { username, password } = req.body;
    const user = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (user.rows[0] && await bcrypt.compare(password, user.rows[0].password)) {
        const token = jwt.sign({ id: user.rows[0].id }, process.env.JWT_SECRET);
        res.json({ token, userId: user.rows[0].id });
    } else { res.status(401).json({ error: "Wrong credentials" }); }
};

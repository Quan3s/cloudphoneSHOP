const { pool, redis } = require('../config/db');

exports.updateStock = async (req, res) => {
    const { name, category, price, stock, content } = req.body;
    await pool.query('INSERT INTO products(name, category, price_coin, stock, content) VALUES($1, $2, $3, $4, $5)', 
    [name, category, price, stock, content]);
    res.json({ success: true });
};

exports.adjustCoin = async (req, res) => {
    const { uid, amount } = req.body;
    const newBal = await redis.incrby(`balance:${uid}`, amount);
    res.json({ balance: newBal });
};

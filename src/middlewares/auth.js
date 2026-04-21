const jwt = require('jsonwebtoken');

exports.verifyToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch (e) { res.status(401).json({ error: "Token expired" }); }
};

exports.adminOnly = (req, res, next) => {
    if (req.headers['x-admin-key'] !== process.env.ADMIN_KEY) {
        return res.status(403).json({ error: "Admin Key Invalid" });
    }
    next();
};

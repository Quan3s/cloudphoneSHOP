const router = require('express').Router();
const { verifyToken, adminOnly } = require('../middlewares/auth');
const auth = require('../controllers/authController');
const shop = require('../controllers/shopController');
const task = require('../controllers/taskController');
const admin = require('../controllers/adminController');

router.post('/signup', auth.signup);
router.post('/login', auth.login);
router.get('/shop', shop.getProducts);
router.post('/sell-gmail', verifyToken, shop.sellGmail);
router.post('/wallet/card', verifyToken, shop.rechargeCard);
router.get('/tasks', verifyToken, task.getTasks);
router.get('/htnv', task.callbackHTNV);

// Admin Routes
router.post('/admin/stock', adminOnly, admin.updateStock);
router.post('/admin/coin', adminOnly, admin.adjustCoin);

module.exports = router;

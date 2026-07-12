const express = require('express');
const router = express.Router();

const { addExpense, getExpenses } = require('../controllers/expense.controller');
const { verifyToken, authorizeRoles } = require('../middlewares/auth.middleware');

router.post('/', verifyToken, authorizeRoles('driver', 'fleet_manager'), addExpense);
router.get('/', verifyToken, getExpenses);

module.exports = router;

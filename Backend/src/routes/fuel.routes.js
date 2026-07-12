const express = require('express');
const router = express.Router();

const { addFuelLog, getFuelLogs } = require('../controllers/fuel.controller');
const { verifyToken, authorizeRoles } = require('../middlewares/auth.middleware');

router.post('/', verifyToken, authorizeRoles('driver', 'fleet_manager'), addFuelLog);
router.get('/', verifyToken, getFuelLogs);

module.exports = router;

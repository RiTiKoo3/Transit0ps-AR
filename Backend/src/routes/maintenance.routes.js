const express = require('express');
const router = express.Router();

const {
  addMaintenanceLog,
  closeMaintenanceLog,
  getMaintenanceLogs,
} = require('../controllers/maintenance.controller');

const { verifyToken, authorizeRoles } = require('../middlewares/auth.middleware');

// Fleet Manager oversees maintenance and vehicle lifecycle (PDF section 2)
router.post('/', verifyToken, authorizeRoles('fleet_manager'), addMaintenanceLog);

router.patch('/:id/close', verifyToken, authorizeRoles('fleet_manager'), closeMaintenanceLog);

router.get('/', verifyToken, getMaintenanceLogs);

module.exports = router;

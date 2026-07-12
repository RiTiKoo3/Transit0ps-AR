const express = require('express');
const router = express.Router();

const {
  createDriver,
  getAllDrivers,
  getDispatchableDrivers,
  updateDriver,
  suspendDriver,
  deleteDriver,
} = require('../controllers/driver.controller');

const { verifyToken, authorizeRoles } = require('../middlewares/auth.middleware');

// Safety Officer ensures driver compliance (PDF section 2)
router.post('/', verifyToken, authorizeRoles('safety_officer', 'fleet_manager'), createDriver);

router.get('/', verifyToken, getAllDrivers);

router.get('/dispatchable', verifyToken, getDispatchableDrivers);

router.put('/:id', verifyToken, authorizeRoles('safety_officer', 'fleet_manager'), updateDriver);

router.patch('/:id/suspend', verifyToken, authorizeRoles('safety_officer'), suspendDriver);

router.delete('/:id', verifyToken, authorizeRoles('safety_officer', 'fleet_manager'), deleteDriver);

module.exports = router;

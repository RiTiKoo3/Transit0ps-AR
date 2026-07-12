const express = require('express');
const router = express.Router();

const {
  createVehicle,
  getAllVehicles,
  getDispatchableVehicles,
  updateVehicle,
  retireVehicle,
  deleteVehicle,
  getVehicleCostSummary,
} = require('../controllers/vehicle.controller');

const { verifyToken, authorizeRoles } = require('../middlewares/auth.middleware');

// Fleet Manager owns vehicle lifecycle (PDF section 2)
router.post('/', verifyToken, authorizeRoles('fleet_manager'), createVehicle);

// All authenticated roles can view the fleet
router.get('/', verifyToken, getAllVehicles);

// Only vehicles eligible for dispatch (excludes retired/in_shop/on_trip)
router.get('/dispatchable', verifyToken, getDispatchableVehicles);

router.get('/:id/cost-summary', verifyToken, getVehicleCostSummary);

router.put('/:id', verifyToken, authorizeRoles('fleet_manager'), updateVehicle);

router.patch('/:id/retire', verifyToken, authorizeRoles('fleet_manager'), retireVehicle);

router.delete('/:id', verifyToken, authorizeRoles('fleet_manager'), deleteVehicle);

module.exports = router;

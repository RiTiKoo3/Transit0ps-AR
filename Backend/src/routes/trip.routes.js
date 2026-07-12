const express = require('express');
const router = express.Router();

const {
  createTrip,
  dispatchTrip,
  completeTrip,
  cancelTrip,
  getAllTrips,
} = require('../controllers/trip.controller');

const { verifyToken, authorizeRoles } = require('../middlewares/auth.middleware');

// Driver role "creates trips, assigns vehicles and drivers, monitors active deliveries" (PDF section 2)
router.post('/', verifyToken, authorizeRoles('driver', 'fleet_manager'), createTrip);

router.patch('/:id/dispatch', verifyToken, authorizeRoles('driver', 'fleet_manager'), dispatchTrip);

router.patch('/:id/complete', verifyToken, authorizeRoles('driver', 'fleet_manager'), completeTrip);

router.patch('/:id/cancel', verifyToken, authorizeRoles('driver', 'fleet_manager'), cancelTrip);

router.get('/', verifyToken, getAllTrips);

module.exports = router;

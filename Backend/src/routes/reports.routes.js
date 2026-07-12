const express = require('express');
const router = express.Router();

const {
  getFleetReport,
  getFleetUtilization,
  exportFleetReportCSV,
} = require('../controllers/reports.controller');

const { verifyToken, authorizeRoles } = require('../middlewares/auth.middleware');

// Financial Analyst reviews costs and profitability (PDF section 2); Fleet Manager also needs visibility.
router.get('/fleet', verifyToken, authorizeRoles('financial_analyst', 'fleet_manager'), getFleetReport);

router.get('/utilization', verifyToken, getFleetUtilization);

router.get('/fleet/export', verifyToken, authorizeRoles('financial_analyst', 'fleet_manager'), exportFleetReportCSV);

module.exports = router;

const express = require("express");
const router = express.Router();
const { getDashboardData } = require("../controllers/dashboard.controller");
const { verifyToken } = require("../middlewares/auth.middleware");

// Previously this route had NO auth check at all - fixed here.
router.get("/", verifyToken, getDashboardData);

module.exports = router;

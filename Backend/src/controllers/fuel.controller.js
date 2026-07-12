const pool = require('../config/db');

// ================= ADD FUEL LOG =================
const addFuelLog = async (req, res) => {
  try {
    const { vehicle_id, trip_id, liters, cost, log_date } = req.body;

    if (!vehicle_id || !liters || !cost) {
      return res.status(400).json({ message: "vehicle_id, liters and cost are required" });
    }

    const vehicleResult = await pool.query(`SELECT * FROM vehicles WHERE id = $1`, [vehicle_id]);

    if (vehicleResult.rows.length === 0) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    if (vehicleResult.rows[0].status === 'retired') {
      return res.status(400).json({ message: "Cannot log fuel for a retired vehicle" });
    }

    const result = await pool.query(
      `INSERT INTO fuel_logs (vehicle_id, trip_id, liters, cost, log_date)
       VALUES ($1, $2, $3, $4, COALESCE($5, CURRENT_DATE))
       RETURNING *`,
      [vehicle_id, trip_id || null, liters, cost, log_date || null],
    );

    res.status(201).json({
      message: "Fuel log added",
      fuel: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= GET ALL FUEL LOGS =================
const getFuelLogs = async (req, res) => {
  try {
    const { vehicle_id } = req.query;

    const values = [];
    let whereClause = "";
    if (vehicle_id) {
      values.push(vehicle_id);
      whereClause = `WHERE vehicle_id = $1`;
    }

    const result = await pool.query(
      `SELECT * FROM fuel_logs ${whereClause} ORDER BY id DESC`,
      values,
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  addFuelLog,
  getFuelLogs,
};

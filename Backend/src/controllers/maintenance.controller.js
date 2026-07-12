const pool = require('../config/db');

// ================= CREATE MAINTENANCE LOG =================
const addMaintenanceLog = async (req, res) => {
  try {
    const { vehicle_id, service_type, cost, notes } = req.body;

    if (!vehicle_id || !service_type || !cost) {
      return res.status(400).json({ message: "vehicle_id, service_type and cost are required" });
    }

    const vehicleResult = await pool.query(`SELECT * FROM vehicles WHERE id = $1`, [vehicle_id]);
    if (vehicleResult.rows.length === 0) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    const vehicle = vehicleResult.rows[0];

    if (vehicle.status === 'on_trip') {
      return res.status(400).json({ message: "Cannot send vehicle to maintenance while on trip" });
    }

    const logResult = await pool.query(
      `INSERT INTO maintenance_logs (vehicle_id, service_type, cost, notes, status)
       VALUES ($1, $2, $3, $4, 'open')
       RETURNING *`,
      [vehicle_id, service_type, cost, notes || null],
    );

    // Adding a vehicle to a maintenance log automatically switches its status to In Shop (Mandatory Rule)
    await pool.query(`UPDATE vehicles SET status = 'in_shop' WHERE id = $1`, [vehicle_id]);

    res.status(201).json({
      message: "Maintenance logged, vehicle moved to in_shop",
      log: logResult.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= CLOSE MAINTENANCE LOG =================
// Closing maintenance restores the vehicle to Available, unless retired (Mandatory Rule)
const closeMaintenanceLog = async (req, res) => {
  try {
    const { id } = req.params;

    const logResult = await pool.query(`SELECT * FROM maintenance_logs WHERE id = $1`, [id]);
    if (logResult.rows.length === 0) {
      return res.status(404).json({ message: "Maintenance log not found" });
    }

    const log = logResult.rows[0];

    if (log.status === 'closed') {
      return res.status(400).json({ message: "Maintenance log is already closed" });
    }

    const updatedLog = await pool.query(
      `UPDATE maintenance_logs SET status = 'closed', closed_at = NOW() WHERE id = $1 RETURNING *`,
      [id],
    );

    const vehicleResult = await pool.query(`SELECT * FROM vehicles WHERE id = $1`, [log.vehicle_id]);
    const vehicle = vehicleResult.rows[0];

    if (vehicle.status !== 'retired') {
      await pool.query(`UPDATE vehicles SET status = 'available' WHERE id = $1`, [log.vehicle_id]);
    }

    res.status(200).json({
      message: "Maintenance closed" + (vehicle.status !== 'retired' ? ", vehicle restored to available" : " (vehicle remains retired)"),
      log: updatedLog.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= GET ALL MAINTENANCE LOGS =================
const getMaintenanceLogs = async (req, res) => {
  try {
    const { status, vehicle_id } = req.query;

    let conditions = [];
    let values = [];

    if (status) {
      values.push(status);
      conditions.push(`status = $${values.length}`);
    }
    if (vehicle_id) {
      values.push(vehicle_id);
      conditions.push(`vehicle_id = $${values.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const result = await pool.query(
      `SELECT * FROM maintenance_logs ${whereClause} ORDER BY id DESC`,
      values,
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  addMaintenanceLog,
  closeMaintenanceLog,
  getMaintenanceLogs,
};

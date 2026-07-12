const pool = require("../config/db");

// ================= CREATE DRIVER =================
const createDriver = async (req, res) => {
  try {
    const { name, license_number, license_category, license_expiry, contact_number, safety_score } = req.body;

    if (!name || !license_number || !license_category || !license_expiry) {
      return res.status(400).json({
        message: "name, license_number, license_category and license_expiry are required",
      });
    }

    const existing = await pool.query(
      `SELECT id FROM drivers WHERE license_number = $1`,
      [license_number],
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({
        message: "A driver with this license number already exists",
      });
    }

    const result = await pool.query(
      `INSERT INTO drivers
       (name, license_number, license_category, license_expiry, contact_number, safety_score)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        name,
        license_number,
        license_category,
        license_expiry,
        contact_number || null,
        safety_score !== undefined ? safety_score : 100,
      ],
    );

    res.status(201).json({
      message: "Driver created successfully",
      driver: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= GET ALL DRIVERS (with license compliance flag + filters) =================
const getAllDrivers = async (req, res) => {
  try {
    const { status, search } = req.query;

    let conditions = [];
    let values = [];

    if (status) {
      values.push(status);
      conditions.push(`status = $${values.length}`);
    }

    if (search) {
      values.push(`%${search}%`);
      conditions.push(`(name ILIKE $${values.length} OR license_number ILIKE $${values.length})`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const result = await pool.query(
      `SELECT * FROM drivers ${whereClause} ORDER BY id DESC`,
      values,
    );

    const today = new Date();

    const driversWithCompliance = result.rows.map((driver) => {
      const isExpired = new Date(driver.license_expiry) < today;
      return {
        ...driver,
        license_status: isExpired ? "expired" : "valid",
      };
    });

    res.status(200).json(driversWithCompliance);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= GET DRIVERS AVAILABLE FOR DISPATCH =================
// Drivers with expired licenses or Suspended status cannot be assigned to trips (Mandatory Rule).
const getDispatchableDrivers = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM drivers WHERE status = 'available' AND license_expiry >= CURRENT_DATE ORDER BY id DESC`,
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= UPDATE DRIVER =================
const updateDriver = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, license_category, license_expiry, contact_number, safety_score, status } = req.body;

    const existing = await pool.query(`SELECT * FROM drivers WHERE id = $1`, [id]);

    if (existing.rows.length === 0) {
      return res.status(404).json({
        message: "Driver not found",
      });
    }

    const driver = existing.rows[0];

    const today = new Date();
    const isExpired = new Date(license_expiry || driver.license_expiry) < today;

    if (isExpired && status === "available") {
      return res.status(400).json({
        message: "Cannot set a driver with an expired license to available",
      });
    }

    const updated = await pool.query(
      `UPDATE drivers
       SET name = $1,
           license_category = $2,
           license_expiry = $3,
           contact_number = $4,
           safety_score = $5,
           status = $6
       WHERE id = $7
       RETURNING *`,
      [
        name || driver.name,
        license_category || driver.license_category,
        license_expiry || driver.license_expiry,
        contact_number || driver.contact_number,
        safety_score !== undefined ? safety_score : driver.safety_score,
        status || driver.status,
        id,
      ],
    );

    res.status(200).json({
      message: "Driver updated successfully",
      driver: updated.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= SUSPEND DRIVER =================
const suspendDriver = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE drivers
       SET status = 'suspended'
       WHERE id = $1
       RETURNING *`,
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Driver not found",
      });
    }

    res.status(200).json({
      message: "Driver suspended",
      driver: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= DELETE DRIVER =================
// Hard delete - only allowed if the driver has no trip history.
const deleteDriver = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await pool.query(`SELECT * FROM drivers WHERE id = $1`, [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ message: "Driver not found" });
    }

    if (existing.rows[0].status === "on_trip") {
      return res.status(400).json({ message: "Cannot delete a driver that is currently on a trip" });
    }

    const tripCheck = await pool.query(`SELECT id FROM trips WHERE driver_id = $1 LIMIT 1`, [id]);
    if (tripCheck.rows.length > 0) {
      return res.status(400).json({
        message: "Driver has trip history and cannot be deleted; use suspend instead",
      });
    }

    await pool.query(`DELETE FROM drivers WHERE id = $1`, [id]);

    res.status(200).json({ message: "Driver deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  createDriver,
  getAllDrivers,
  getDispatchableDrivers,
  updateDriver,
  suspendDriver,
  deleteDriver,
};

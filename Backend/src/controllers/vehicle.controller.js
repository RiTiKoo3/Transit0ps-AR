const pool = require("../config/db");

// ================= CREATE VEHICLE =================
const createVehicle = async (req, res) => {
  try {
    const {
      registration_number,
      name,
      model,
      type,
      max_load_capacity,
      odometer,
      acquisition_cost,
      region,
    } = req.body;

    if (!registration_number || !name || !type || !max_load_capacity || !acquisition_cost) {
      return res.status(400).json({
        message: "registration_number, name, type, max_load_capacity and acquisition_cost are required",
      });
    }

    const existing = await pool.query(
      `SELECT id FROM vehicles WHERE registration_number = $1`,
      [registration_number],
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({
        message: "A vehicle with this registration number already exists",
      });
    }

    const result = await pool.query(
      `INSERT INTO vehicles
       (registration_number, name, model, type, max_load_capacity, odometer, acquisition_cost, region)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        registration_number,
        name,
        model || null,
        type,
        max_load_capacity,
        odometer || 0,
        acquisition_cost,
        region || null,
      ],
    );

    res.status(201).json({
      message: "Vehicle created successfully",
      vehicle: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= GET ALL VEHICLES (with filters + search) =================
const getAllVehicles = async (req, res) => {
  try {
    const { type, status, search, region } = req.query;

    let conditions = [];
    let values = [];

    if (type) {
      values.push(type);
      conditions.push(`type = $${values.length}`);
    }

    if (status) {
      values.push(status);
      conditions.push(`status = $${values.length}`);
    }

    if (region) {
      values.push(region);
      conditions.push(`region = $${values.length}`);
    }

    if (search) {
      values.push(`%${search}%`);
      conditions.push(`(name ILIKE $${values.length} OR registration_number ILIKE $${values.length})`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const result = await pool.query(
      `SELECT * FROM vehicles ${whereClause} ORDER BY id DESC`,
      values,
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= GET VEHICLES AVAILABLE FOR DISPATCH =================
// Retired or In Shop vehicles must never appear in the dispatch selection (Mandatory Rule).
const getDispatchableVehicles = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM vehicles WHERE status = 'available' ORDER BY id DESC`,
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= UPDATE VEHICLE =================
const updateVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, model, type, max_load_capacity, odometer, acquisition_cost, status, region } = req.body;

    const existing = await pool.query(`SELECT * FROM vehicles WHERE id = $1`, [id]);

    if (existing.rows.length === 0) {
      return res.status(404).json({
        message: "Vehicle not found",
      });
    }

    const v = existing.rows[0];

    const updated = await pool.query(
      `UPDATE vehicles
       SET name = $1,
           model = $2,
           type = $3,
           max_load_capacity = $4,
           odometer = $5,
           acquisition_cost = $6,
           status = $7,
           region = $8
       WHERE id = $9
       RETURNING *`,
      [
        name || v.name,
        model || v.model,
        type || v.type,
        max_load_capacity || v.max_load_capacity,
        odometer !== undefined ? odometer : v.odometer,
        acquisition_cost || v.acquisition_cost,
        status || v.status,
        region !== undefined ? region : v.region,
        id,
      ],
    );

    res.status(200).json({
      message: "Vehicle updated successfully",
      vehicle: updated.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= RETIRE VEHICLE =================
const retireVehicle = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await pool.query(`SELECT * FROM vehicles WHERE id = $1`, [id]);

    if (existing.rows.length === 0) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    if (existing.rows[0].status === "on_trip") {
      return res.status(400).json({
        message: "Cannot retire a vehicle that is currently on a trip",
      });
    }

    const result = await pool.query(
      `UPDATE vehicles
       SET status = 'retired'
       WHERE id = $1
       RETURNING *`,
      [id],
    );

    res.status(200).json({
      message: "Vehicle retired successfully",
      vehicle: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= COST SUMMARY (fuel + maintenance) per vehicle =================
// Feeds PDF 3.7: "Automatically compute total operational cost (Fuel + Maintenance) per vehicle"
const getVehicleCostSummary = async (req, res) => {
  try {
    const { id } = req.params;

    const vehicleResult = await pool.query(`SELECT * FROM vehicles WHERE id = $1`, [id]);
    if (vehicleResult.rows.length === 0) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    const fuelResult = await pool.query(
      `SELECT COALESCE(SUM(cost), 0) AS total_fuel_cost, COALESCE(SUM(liters), 0) AS total_liters
       FROM fuel_logs WHERE vehicle_id = $1`,
      [id],
    );

    const maintenanceResult = await pool.query(
      `SELECT COALESCE(SUM(cost), 0) AS total_maintenance_cost
       FROM maintenance_logs WHERE vehicle_id = $1`,
      [id],
    );

    const totalFuelCost = parseFloat(fuelResult.rows[0].total_fuel_cost);
    const totalMaintenanceCost = parseFloat(maintenanceResult.rows[0].total_maintenance_cost);

    res.status(200).json({
      vehicle_id: parseInt(id),
      total_fuel_cost: totalFuelCost,
      total_liters: parseFloat(fuelResult.rows[0].total_liters),
      total_maintenance_cost: totalMaintenanceCost,
      total_operational_cost: totalFuelCost + totalMaintenanceCost,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= DELETE VEHICLE =================
// Hard delete - only allowed if the vehicle has no trip/maintenance/fuel history,
// to avoid orphaning records. Use retire() instead for vehicles with history.
const deleteVehicle = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await pool.query(`SELECT * FROM vehicles WHERE id = $1`, [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    if (existing.rows[0].status === "on_trip") {
      return res.status(400).json({ message: "Cannot delete a vehicle that is currently on a trip" });
    }

    const tripCheck = await pool.query(`SELECT id FROM trips WHERE vehicle_id = $1 LIMIT 1`, [id]);
    if (tripCheck.rows.length > 0) {
      return res.status(400).json({
        message: "Vehicle has trip history and cannot be deleted; use retire instead",
      });
    }

    await pool.query(`DELETE FROM vehicles WHERE id = $1`, [id]);

    res.status(200).json({ message: "Vehicle deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  createVehicle,
  getAllVehicles,
  getDispatchableVehicles,
  updateVehicle,
  retireVehicle,
  deleteVehicle,
  getVehicleCostSummary,
};

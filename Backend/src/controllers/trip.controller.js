const pool = require("../config/db");

// ================= CREATE TRIP (status = draft) =================
const createTrip = async (req, res) => {
  try {
    const { source, destination, vehicle_id, driver_id, cargo_weight, planned_distance } = req.body;

    if (!source || !destination || !vehicle_id || !driver_id || !cargo_weight || !planned_distance) {
      return res.status(400).json({
        message: "source, destination, vehicle_id, driver_id, cargo_weight and planned_distance are required",
      });
    }

    const vehicleResult = await pool.query(`SELECT * FROM vehicles WHERE id = $1`, [vehicle_id]);
    if (vehicleResult.rows.length === 0) {
      return res.status(404).json({ message: "Vehicle not found" });
    }
    const vehicle = vehicleResult.rows[0];

    if (vehicle.status === "retired") {
      return res.status(400).json({ message: "Cannot create a trip for a retired vehicle" });
    }

    // Cargo Weight must not exceed the vehicle's maximum load capacity (Mandatory Rule)
    if (Number(cargo_weight) > Number(vehicle.max_load_capacity)) {
      return res.status(400).json({
        message: `Cargo weight (${cargo_weight}) exceeds vehicle max load capacity (${vehicle.max_load_capacity})`,
      });
    }

    const driverResult = await pool.query(`SELECT * FROM drivers WHERE id = $1`, [driver_id]);
    if (driverResult.rows.length === 0) {
      return res.status(404).json({ message: "Driver not found" });
    }
    const driver = driverResult.rows[0];

    if (driver.status === "suspended") {
      return res.status(400).json({ message: "Cannot assign a suspended driver to a trip" });
    }

    if (new Date(driver.license_expiry) < new Date()) {
      return res.status(400).json({ message: "Driver's license has expired" });
    }

    // NOTE: vehicle/driver being currently "on_trip" is intentionally NOT blocked here.
    // A draft trip is a plan, not a commitment - dispatchers should be able to queue a
    // future trip for a vehicle that's out right now but will be free later. The actual
    // "cannot be assigned while On Trip" rule (mandatory spec rule) is enforced at
    // dispatch time below, which is when the vehicle/driver are truly committed.

    const tripResult = await pool.query(
      `INSERT INTO trips
       (source, destination, vehicle_id, driver_id, cargo_weight, planned_distance, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'draft')
       RETURNING *`,
      [source, destination, vehicle_id, driver_id, cargo_weight, planned_distance],
    );

    res.status(201).json({
      message: "Trip created as draft",
      trip: tripResult.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= DISPATCH TRIP (draft -> dispatched) =================
const dispatchTrip = async (req, res) => {
  try {
    const { id } = req.params;

    const tripResult = await pool.query(`SELECT * FROM trips WHERE id = $1`, [id]);
    if (tripResult.rows.length === 0) {
      return res.status(404).json({ message: "Trip not found" });
    }
    const trip = tripResult.rows[0];

    if (trip.status !== "draft") {
      return res.status(400).json({ message: "Only draft trips can be dispatched" });
    }

    // Re-check current availability - state may have changed since the trip was drafted.
    const vehicleResult = await pool.query(`SELECT * FROM vehicles WHERE id = $1`, [trip.vehicle_id]);
    const vehicle = vehicleResult.rows[0];
    if (vehicle.status !== "available") {
      return res.status(400).json({ message: `Vehicle is not available (current status: ${vehicle.status})` });
    }

    const driverResult = await pool.query(`SELECT * FROM drivers WHERE id = $1`, [trip.driver_id]);
    const driver = driverResult.rows[0];

    if (driver.status !== "available") {
      return res.status(400).json({ message: `Driver is not available (current status: ${driver.status})` });
    }

    if (new Date(driver.license_expiry) < new Date()) {
      return res.status(400).json({ message: "Driver's license has expired" });
    }

    await pool.query(
      `UPDATE trips SET status = 'dispatched', start_time = NOW() WHERE id = $1`,
      [id],
    );
    await pool.query(`UPDATE vehicles SET status = 'on_trip' WHERE id = $1`, [trip.vehicle_id]);
    await pool.query(`UPDATE drivers SET status = 'on_trip' WHERE id = $1`, [trip.driver_id]);

    res.status(200).json({ message: "Trip dispatched successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= COMPLETE TRIP (dispatched -> completed) =================
// PDF example workflow step 6: "Complete the trip by entering the final odometer and fuel consumed."
const completeTrip = async (req, res) => {
  try {
    const { id } = req.params;
    const { final_odometer, actual_distance, fuel_liters, fuel_cost, revenue } = req.body;

    const tripResult = await pool.query(`SELECT * FROM trips WHERE id = $1`, [id]);
    if (tripResult.rows.length === 0) {
      return res.status(404).json({ message: "Trip not found" });
    }
    const trip = tripResult.rows[0];

    if (trip.status !== "dispatched") {
      return res.status(400).json({ message: "Only dispatched trips can be completed" });
    }

    await pool.query(
      `UPDATE trips
       SET status = 'completed', end_time = NOW(), actual_distance = $1, revenue = $2
       WHERE id = $3`,
      [actual_distance || trip.planned_distance, revenue || 0, id],
    );

    if (final_odometer !== undefined) {
      await pool.query(`UPDATE vehicles SET odometer = $1 WHERE id = $2`, [final_odometer, trip.vehicle_id]);
    }

    // Vehicle and driver reset to Available (Mandatory Rule)
    await pool.query(`UPDATE vehicles SET status = 'available' WHERE id = $1`, [trip.vehicle_id]);
    await pool.query(`UPDATE drivers SET status = 'available' WHERE id = $1`, [trip.driver_id]);

    // Optional: log fuel consumed for this trip directly, if provided
    if (fuel_liters && fuel_cost) {
      await pool.query(
        `INSERT INTO fuel_logs (vehicle_id, trip_id, liters, cost) VALUES ($1, $2, $3, $4)`,
        [trip.vehicle_id, id, fuel_liters, fuel_cost],
      );
    }

    res.status(200).json({ message: "Trip completed successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= CANCEL TRIP (draft or dispatched -> cancelled) =================
// Cancelling a dispatched trip restores the vehicle and driver to Available (Mandatory Rule)
const cancelTrip = async (req, res) => {
  try {
    const { id } = req.params;

    const tripResult = await pool.query(`SELECT * FROM trips WHERE id = $1`, [id]);
    if (tripResult.rows.length === 0) {
      return res.status(404).json({ message: "Trip not found" });
    }
    const trip = tripResult.rows[0];

    if (!["draft", "dispatched"].includes(trip.status)) {
      return res.status(400).json({ message: "Only draft or dispatched trips can be cancelled" });
    }

    await pool.query(`UPDATE trips SET status = 'cancelled', end_time = NOW() WHERE id = $1`, [id]);

    if (trip.status === "dispatched") {
      await pool.query(`UPDATE vehicles SET status = 'available' WHERE id = $1`, [trip.vehicle_id]);
      await pool.query(`UPDATE drivers SET status = 'available' WHERE id = $1`, [trip.driver_id]);
    }

    res.status(200).json({ message: "Trip cancelled successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= GET ALL TRIPS (with status filter) =================
const getAllTrips = async (req, res) => {
  try {
    const { status } = req.query;

    const values = [];
    let whereClause = "";
    if (status) {
      values.push(status);
      whereClause = `WHERE status = $1`;
    }

    const result = await pool.query(
      `SELECT t.*, v.name AS vehicle_name, v.registration_number, d.name AS driver_name
       FROM trips t
       JOIN vehicles v ON t.vehicle_id = v.id
       JOIN drivers d ON t.driver_id = d.id
       ${whereClause}
       ORDER BY t.id DESC`,
      values,
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  createTrip,
  dispatchTrip,
  completeTrip,
  cancelTrip,
  getAllTrips,
};
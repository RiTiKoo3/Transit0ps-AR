const pool = require("../config/db");

// ================= DASHBOARD SUMMARY =================
// PDF 3.2 requires: Active Vehicles, Available Vehicles, Vehicles in Maintenance,
// Active Trips, Pending Trips, Drivers On Duty, Fleet Utilization (%)
const getDashboardData = async (req, res) => {
  try {
    const { type, status, region } = req.query;

    // ---- Vehicle KPIs ----
    // "Active Vehicles" = everything still in service (not retired).
    const activeVehiclesResult = await pool.query(
      `SELECT COUNT(*) FROM vehicles WHERE status != 'retired'`,
    );
    const activeVehicles = parseInt(activeVehiclesResult.rows[0].count);

    const availableVehiclesResult = await pool.query(
      `SELECT COUNT(*) FROM vehicles WHERE status = 'available'`,
    );
    const availableVehicles = parseInt(availableVehiclesResult.rows[0].count);

    const inMaintenanceResult = await pool.query(
      `SELECT COUNT(*) FROM vehicles WHERE status = 'in_shop'`,
    );
    const vehiclesInMaintenance = parseInt(inMaintenanceResult.rows[0].count);

    const onTripVehiclesResult = await pool.query(
      `SELECT COUNT(*) FROM vehicles WHERE status = 'on_trip'`,
    );
    const onTripVehicles = parseInt(onTripVehiclesResult.rows[0].count);

    // ---- Trip KPIs ----
    const activeTripsResult = await pool.query(
      `SELECT COUNT(*) FROM trips WHERE status = 'dispatched'`,
    );
    const activeTrips = parseInt(activeTripsResult.rows[0].count);

    const pendingTripsResult = await pool.query(
      `SELECT COUNT(*) FROM trips WHERE status = 'draft'`,
    );
    const pendingTrips = parseInt(pendingTripsResult.rows[0].count);

    // ---- Driver KPI ----
    // "On Duty" = not off_duty and not suspended (i.e. available or currently on a trip).
    const driversOnDutyResult = await pool.query(
      `SELECT COUNT(*) FROM drivers WHERE status IN ('available', 'on_trip')`,
    );
    const driversOnDuty = parseInt(driversOnDutyResult.rows[0].count);

    // ---- Fleet Utilization % ----
    const utilizationRate =
      activeVehicles === 0 ? 0 : ((onTripVehicles / activeVehicles) * 100).toFixed(2);

    // ---- Filtered trip table for the dashboard view ----
    let conditions = [];
    let values = [];

    if (type) {
      values.push(type);
      conditions.push(`v.type = $${values.length}`);
    }

    if (status) {
      values.push(status);
      conditions.push(`t.status = $${values.length}`);
    }

    if (region) {
      values.push(region);
      conditions.push(`v.region = $${values.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const tripsQuery = `
      SELECT
        t.id AS trip_id,
        v.name AS vehicle_name,
        v.registration_number,
        v.type,
        d.name AS driver_name,
        t.status AS trip_status
      FROM trips t
      JOIN vehicles v ON t.vehicle_id = v.id
      JOIN drivers d ON t.driver_id = d.id
      ${whereClause}
      ORDER BY t.id DESC
      LIMIT 50
    `;

    const tripsResult = await pool.query(tripsQuery, values);

    res.status(200).json({
      kpis: {
        activeVehicles,
        availableVehicles,
        vehiclesInMaintenance,
        activeTrips,
        pendingTrips,
        driversOnDuty,
        fleetUtilization: utilizationRate,
      },
      trips: tripsResult.rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server error while fetching dashboard data",
    });
  }
};

module.exports = {
  getDashboardData,
};

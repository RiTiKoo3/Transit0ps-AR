const pool = require("../config/db");

// Builds the core per-vehicle metrics row used by both the JSON and CSV report endpoints.
const buildFleetReportRows = async () => {
  const result = await pool.query(`
    SELECT
      v.id,
      v.registration_number,
      v.name,
      v.type,
      v.acquisition_cost,
      v.status,
      COALESCE(trip_agg.total_distance, 0) AS total_distance,
      COALESCE(trip_agg.total_revenue, 0) AS total_revenue,
      COALESCE(fuel_agg.total_liters, 0) AS total_liters,
      COALESCE(fuel_agg.total_fuel_cost, 0) AS total_fuel_cost,
      COALESCE(maint_agg.total_maintenance_cost, 0) AS total_maintenance_cost
    FROM vehicles v
    LEFT JOIN (
      SELECT vehicle_id,
             SUM(actual_distance) AS total_distance,
             SUM(revenue) AS total_revenue
      FROM trips
      WHERE status = 'completed'
      GROUP BY vehicle_id
    ) trip_agg ON trip_agg.vehicle_id = v.id
    LEFT JOIN (
      SELECT vehicle_id, SUM(liters) AS total_liters, SUM(cost) AS total_fuel_cost
      FROM fuel_logs
      GROUP BY vehicle_id
    ) fuel_agg ON fuel_agg.vehicle_id = v.id
    LEFT JOIN (
      SELECT vehicle_id, SUM(cost) AS total_maintenance_cost
      FROM maintenance_logs
      GROUP BY vehicle_id
    ) maint_agg ON maint_agg.vehicle_id = v.id
    ORDER BY v.id
  `);

  return result.rows.map((row) => {
    const totalDistance = parseFloat(row.total_distance);
    const totalLiters = parseFloat(row.total_liters);
    const totalFuelCost = parseFloat(row.total_fuel_cost);
    const totalMaintenanceCost = parseFloat(row.total_maintenance_cost);
    const acquisitionCost = parseFloat(row.acquisition_cost);
    const totalRevenue = parseFloat(row.total_revenue);

    const operationalCost = totalFuelCost + totalMaintenanceCost;

    // Fuel Efficiency = Distance / Fuel (PDF 3.8)
    const fuelEfficiency = totalLiters > 0 ? (totalDistance / totalLiters) : 0;

    // Vehicle ROI = (Revenue - (Maintenance + Fuel)) / Acquisition Cost (PDF 3.8)
    const roi = acquisitionCost > 0 ? ((totalRevenue - operationalCost) / acquisitionCost) : 0;

    return {
      vehicle_id: row.id,
      registration_number: row.registration_number,
      name: row.name,
      type: row.type,
      status: row.status,
      acquisition_cost: acquisitionCost,
      total_distance: totalDistance,
      total_fuel_liters: totalLiters,
      fuel_efficiency: Number(fuelEfficiency.toFixed(2)),
      total_fuel_cost: totalFuelCost,
      total_maintenance_cost: totalMaintenanceCost,
      operational_cost: operationalCost,
      total_revenue: totalRevenue,
      roi: Number(roi.toFixed(4)),
    };
  });
};

// ================= FLEET REPORT (JSON) =================
const getFleetReport = async (req, res) => {
  try {
    const rows = await buildFleetReportRows();
    res.status(200).json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= FLEET UTILIZATION =================
const getFleetUtilization = async (req, res) => {
  try {
    const activeResult = await pool.query(`SELECT COUNT(*) FROM vehicles WHERE status != 'retired'`);
    const onTripResult = await pool.query(`SELECT COUNT(*) FROM vehicles WHERE status = 'on_trip'`);

    const active = parseInt(activeResult.rows[0].count);
    const onTrip = parseInt(onTripResult.rows[0].count);
    const utilization = active === 0 ? 0 : Number(((onTrip / active) * 100).toFixed(2));

    res.status(200).json({ active_vehicles: active, on_trip_vehicles: onTrip, fleet_utilization_percent: utilization });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= CSV EXPORT =================
// PDF 3.8: "Support CSV export; PDF export is optional." - only CSV is implemented.
const exportFleetReportCSV = async (req, res) => {
  try {
    const rows = await buildFleetReportRows();

    if (rows.length === 0) {
      return res.status(404).json({ message: "No data to export" });
    }

    const headers = Object.keys(rows[0]);
    const csvLines = [headers.join(",")];

    for (const row of rows) {
      const line = headers
        .map((h) => {
          const val = row[h] === null || row[h] === undefined ? "" : row[h];
          // Wrap in quotes and escape any embedded quotes/commas
          return `"${String(val).replace(/"/g, '""')}"`;
        })
        .join(",");
      csvLines.push(line);
    }

    const csv = csvLines.join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=transitops_fleet_report.csv");
    res.status(200).send(csv);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getFleetReport,
  getFleetUtilization,
  exportFleetReportCSV,
};

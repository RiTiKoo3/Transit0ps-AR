const pool = require('../config/db');

// ================= ADD EXPENSE =================
const addExpense = async (req, res) => {
  try {
    const { vehicle_id, trip_id, type, amount, expense_date } = req.body;

    if (!vehicle_id || !type || !amount) {
      return res.status(400).json({ message: "vehicle_id, type and amount are required" });
    }

    const result = await pool.query(
      `INSERT INTO expenses (vehicle_id, trip_id, type, amount, expense_date)
       VALUES ($1, $2, $3, $4, COALESCE($5, CURRENT_DATE))
       RETURNING *`,
      [vehicle_id, trip_id || null, type, amount, expense_date || null],
    );

    res.status(201).json({
      message: "Expense recorded",
      expense: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= GET ALL EXPENSES =================
const getExpenses = async (req, res) => {
  try {
    const { vehicle_id } = req.query;

    const values = [];
    let whereClause = "";
    if (vehicle_id) {
      values.push(vehicle_id);
      whereClause = `WHERE vehicle_id = $1`;
    }

    const result = await pool.query(
      `SELECT * FROM expenses ${whereClause} ORDER BY id DESC`,
      values,
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  addExpense,
  getExpenses,
};

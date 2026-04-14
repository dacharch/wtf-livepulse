const pool = require("../db/pool");

let interval = null;

function startAnomalyDetection() {
  if (interval) return;

  console.log("🔍 Anomaly detection started");

  interval = setInterval(async () => {
    try {
      console.log("🔍 Running anomaly detection...");

      // 🔥 GET ALL GYMS
      const gyms = await pool.query(`SELECT id, capacity FROM gyms`);

      for (let gym of gyms.rows) {

        // 🔥 OCCUPANCY
        const occRes = await pool.query(`
          SELECT COUNT(*) FROM checkins 
          WHERE gym_id = $1 AND checked_out IS NULL
        `, [gym.id]);

        const occupancy = Number(occRes.rows[0].count);
        const pct = (occupancy / gym.capacity) * 100;

        // 🚨 CAPACITY BREACH
        if (pct > 95) {
          await insertAnomaly(gym.id, "capacity_breach", "critical", "Gym almost full");
        }

        // 🚨 ZERO CHECKINS (today)
        const todayRes = await pool.query(`
          SELECT COUNT(*) FROM checkins 
          WHERE gym_id = $1 AND checked_in >= CURRENT_DATE
        `, [gym.id]);

        if (Number(todayRes.rows[0].count) === 0) {
          await insertAnomaly(gym.id, "zero_checkins", "warning", "No activity today");
        }

        // 🚨 REVENUE DROP
        const revToday = await pool.query(`
          SELECT COALESCE(SUM(amount),0) as total
          FROM payments
          WHERE gym_id = $1 AND paid_at >= CURRENT_DATE
        `, [gym.id]);

        const revYesterday = await pool.query(`
          SELECT COALESCE(SUM(amount),0) as total
          FROM payments
          WHERE gym_id = $1 
          AND paid_at >= CURRENT_DATE - INTERVAL '1 day'
          AND paid_at < CURRENT_DATE
        `, [gym.id]);

        const today = Number(revToday.rows[0].total);
        const yesterday = Number(revYesterday.rows[0].total);

        if (yesterday > 0 && today < yesterday * 0.7) {
          await insertAnomaly(gym.id, "revenue_drop", "warning", "Revenue dropped >30%");
        }
      }

    } catch (err) {
      console.error("❌ Anomaly error:", err);
    }
  }, 10000);
}


// 🔥 INSERT FUNCTION (avoid duplicates)
async function insertAnomaly(gym_id, type, severity, message) {
  await pool.query(`
    INSERT INTO anomalies (gym_id, type, severity, message)
    VALUES ($1, $2, $3, $4)
  `, [gym_id, type, severity, message]);
}


module.exports = { startAnomalyDetection };
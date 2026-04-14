const pool = require("../db/pool");

let interval = null;

function startSimulator(broadcast) {
  if (interval) return;

  console.log("▶ Simulator started");

  interval = setInterval(async () => {
    try {
      // 🎯 pick random gym
      const gymRes = await pool.query(
        `SELECT id, capacity FROM gyms ORDER BY random() LIMIT 1`
      );

      const gym = gymRes.rows[0];

      // 🎯 random member check-in
      const memberRes = await pool.query(
        `SELECT id FROM members WHERE gym_id = $1 ORDER BY random() LIMIT 1`,
        [gym.id]
      );

      const member = memberRes.rows[0];

      // 🎯 insert checkin
      await pool.query(
        `INSERT INTO checkins (member_id, gym_id, checked_in)
         VALUES ($1, $2, NOW())`,
        [member.id, gym.id]
      );

      // 🎯 calculate occupancy
      const occ = await pool.query(
        `SELECT COUNT(*) FROM checkins 
         WHERE gym_id = $1 AND checked_out IS NULL`,
        [gym.id]
      );

      const occupancy = Number(occ.rows[0].count);
      const pct = Math.floor((occupancy / gym.capacity) * 100);

      // 🔥 BROADCAST LIVE EVENT
      broadcast({
        type: "CHECKIN_EVENT",
        gym_id: gym.id,
        member_name: `User ${member.id}`,
        timestamp: new Date(),
        current_occupancy: occupancy,
        capacity_pct: pct
      });

    } catch (err) {
      console.error("Simulator error:", err);
    }
  }, 2000);
}

function stopSimulator() {
  if (interval) {
    clearInterval(interval);
    interval = null;
    console.log("⏸ Simulator stopped");
  }
}

module.exports = { startSimulator, stopSimulator };

const express = require('express')
const WebSocket = require("ws");
const cors = require("cors");
const { startAnomalyDetection } = require("./jobs/anomalyDetector");
const { startSimulator, stopSimulator } = require("./jobs/simulator");
const pool = require("./db/pool");


const app = express();
app.use(cors());
app.use(express.json());



// 🔥 RETRY DB CONNECTION (IMPORTANT)
async function connectWithRetry() {
  let retries = 10;

  while (retries) {
    try {
      await pool.connect();
      console.log("✅ Connected to DB");
      return;
    } catch (err) {
      console.log("❌ DB not ready, retrying in 3s...");
      retries--;
      await new Promise(res => setTimeout(res, 3000));
    }
  }

  console.error("❌ Could not connect to DB after retries");
  process.exit(1);
}


// 🚀 START SERVER
async function startServer() {
  await connectWithRetry();

  // ✅ ROOT
  app.get("/", (req, res) => {
    res.send("Backend working 🚀");
  });

  // ✅ GET ALL GYMS
  app.get("/api/gyms", async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT 
          g.id,
          g.name,
          g.city,
          g.capacity,

          (SELECT COUNT(*) 
           FROM checkins c 
           WHERE c.gym_id = g.id 
           AND c.checked_out IS NULL) AS occupancy,

          (SELECT COALESCE(SUM(amount),0)
           FROM payments p
           WHERE p.gym_id = g.id
           AND p.paid_at >= CURRENT_DATE) AS today_revenue

        FROM gyms g
      `);

      res.json(result.rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch gyms" });
    }
  });

  // ✅ GET ANOMALIES
  app.get("/api/anomalies", async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT * FROM anomalies 
        WHERE resolved = false 
        ORDER BY detected_at DESC
      `);

      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch anomalies" });
    }
  });

  // ✅ START SERVER
  const server = app.listen(3001, () => {
    console.log("Server running on 3001 🚀");
  });

  // ✅ WEBSOCKET
  const wss = new WebSocket.Server({ server });

  wss.on("connection", (ws) => {
    console.log("Client connected");

    ws.send(JSON.stringify({
      type: "CONNECTED",
      message: "WebSocket connected"
    }));
  });

  // ✅ BROADCAST FUNCTION
  function broadcast(data) {
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  }

  app.post("/api/simulator/start", (req, res) => {
    startSimulator(broadcast);
    res.json({ status: "started" });
  });
  
  app.post("/api/simulator/stop", (req, res) => {
    stopSimulator();
    res.json({ status: "stopped" });
  });

  
  // ✅ TEST EVENT
  app.get("/test-event", (req, res) => {
    broadcast({
      type: "CHECKIN_EVENT",
      gym_id: "demo",
      member_name: "Rahul Sharma",
      timestamp: new Date(),
      current_occupancy: Math.floor(Math.random() * 100),
      capacity_pct: Math.floor(Math.random() * 100)
    });

    res.send("Event sent 🚀");
  });

  app.get("/api/analytics/revenue-by-plan", async (req, res) => {
    const result = await pool.query(`
      SELECT plan_type, SUM(amount) as revenue
      FROM payments
      GROUP BY plan_type
    `);
  
    res.json(result.rows);
  });
  
  
  // 📊 DAILY REVENUE
  app.get("/api/analytics/daily-revenue", async (req, res) => {
    const result = await pool.query(`
      SELECT DATE(paid_at) as date, SUM(amount) as revenue
      FROM payments
      GROUP BY DATE(paid_at)
      ORDER BY date
    `);
  
    res.json(result.rows);
  });
  
  
  // 🚨 CHURN RISK
  app.get("/api/analytics/churn", async (req, res) => {
    const result = await pool.query(`
      SELECT name, plan_expires_at
      FROM members
      WHERE plan_expires_at < NOW() + INTERVAL '7 days'
    `);
  
    res.json(result.rows);
  });
}


// 🚀 START EVERYTHING
startServer();
startAnomalyDetection();
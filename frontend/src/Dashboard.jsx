import { useEffect, useState } from "react";

export default function Dashboard() {
  const [gyms, setGyms] = useState([]);
  const [selectedGymId, setSelectedGymId] = useState(null);
  const [events, setEvents] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [connected, setConnected] = useState(false);

  // 🔥 Fetch gyms
  useEffect(() => {
    fetch("http://localhost:3001/api/gyms")
      .then(res => res.json())
      .then(data => {
        setGyms(data);
        setSelectedGymId(data[0]?.id);
      });
  }, []);

  // 🔥 Fetch anomalies
  useEffect(() => {
    const fetchAnomalies = () => {
      fetch("http://localhost:3001/api/anomalies")
        .then(res => res.json())
        .then(setAnomalies);
    };

    fetchAnomalies();
    const interval = setInterval(fetchAnomalies, 10000);
    return () => clearInterval(interval);
  }, []);

  // 🔥 WebSocket
  useEffect(() => {
    const ws = new WebSocket("ws://localhost:3001");

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);

    ws.onmessage = (msg) => {
      const data = JSON.parse(msg.data);

      if (data.type === "CHECKIN_EVENT") {
        setEvents(prev => [data, ...prev.slice(0, 19)]);

        setGyms(prev =>
          prev.map(g =>
            g.id === data.gym_id
              ? { ...g, occupancy: data.current_occupancy }
              : g
          )
        );
      }
    };

    return () => ws.close();
  }, []);

  const selectedGym = gyms.find(g => g.id === selectedGymId);
  if (!selectedGym) return <p style={{ color: "white" }}>Loading...</p>;

  const occupancy = Number(selectedGym.occupancy || 0);
  const capacity = Number(selectedGym.capacity || 1);
  const percent = Math.round((occupancy / capacity) * 100);

  const totalOccupancy = gyms.reduce((s, g) => s + Number(g.occupancy || 0), 0);
  const totalRevenue = gyms.reduce((s, g) => s + Number(g.today_revenue || 0), 0);

  const getColor = () => {
    if (percent < 60) return "#22c55e";
    if (percent < 85) return "#facc15";
    return "#ef4444";
  };

  const getSeverityColor = (severity) => {
    if (severity === "critical") return "red";
    if (severity === "warning") return "orange";
    return "gray";
  };

  return (
    <div style={{ background: "#0B0F19", minHeight: "100vh", color: "#fff", padding: "30px" }}>

      {/* HEADER */}
      <div style={{ marginBottom: "25px" }}>
        <h1 style={{ fontSize: "28px" }}>Dashboard Overview</h1>
        <p style={{ color: "#9CA3AF" }}>Real-time gym monitoring</p>
      </div>

      {/* STATUS + CONTROLS */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
        <div>{connected ? "🟢 Live Connected" : "🔴 Disconnected"}</div>

        <div>
          <button onClick={() => fetch("http://localhost:3001/api/simulator/start", { method: "POST" })} style={btnGreen}>
            ▶ Start
          </button>

          <button onClick={() => fetch("http://localhost:3001/api/simulator/stop", { method: "POST" })} style={btnRed}>
            ⏸ Stop
          </button>
        </div>
      </div>

      {/* SELECT */}
      <select value={selectedGymId || ""} onChange={(e) => setSelectedGymId(e.target.value)} style={selectStyle}>
        {gyms.map(g => (
          <option key={g.id} value={g.id}>{g.name}</option>
        ))}
      </select>

      {/* TOP CARDS */}
      <div style={grid3}>
        <Card title="Total Occupancy" value={totalOccupancy} />
        <Card title="Total Revenue" value={`₹${totalRevenue.toLocaleString()}`} />
        <Card title="Anomalies" value={anomalies.length} color={anomalies.length ? "red" : "green"} />
      </div>

      {/* MAIN */}
      <div style={grid2}>
        <Card title={selectedGym.name} value={`${occupancy} / ${capacity}`} sub={`${percent}% full`} color={getColor()} />
        <Card title="Revenue" value={`₹${Number(selectedGym.today_revenue).toLocaleString()}`} />
      </div>

      {/* LOWER */}
      <div style={grid2}>

        {/* ACTIVITY */}
        <div style={glassCard}>
          <h3>⚡ Live Activity</h3>
          {events.map((e, i) => (
            <div key={i} style={activityItem}>
              <strong>{e.member_name}</strong>
              <span>{new Date(e.timestamp).toLocaleTimeString()}</span>
            </div>
          ))}
        </div>

        {/* ANOMALIES */}
        <div style={glassCard}>
          <h3>🚨 Anomalies</h3>
          {anomalies.map((a, i) => (
            <div key={i} style={{ ...activityItem, borderLeft: `4px solid ${getSeverityColor(a.severity)}` }}>
              <div>
                <strong>{a.type}</strong> ({a.severity})
                <p style={{ fontSize: "12px", color: "#aaa" }}>{a.message}</p>
              </div>
            </div>
          ))}
        </div>

      </div>

    </div>
  );
}

/* 🔥 COMPONENT */
function Card({ title, value, sub, color }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.05)",
      padding: "20px",
      borderRadius: "16px",
      border: "1px solid rgba(255,255,255,0.1)"
    }}>
      <p style={{ color: "#9CA3AF" }}>{title}</p>
      <h2 style={{ color: color || "#fff" }}>{value}</h2>
      {sub && <p style={{ color: "#aaa" }}>{sub}</p>}
    </div>
  );
}

/* 🔥 STYLES */
const grid3 = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: "20px",
  marginTop: "20px"
};

const grid2 = {
  display: "grid",
  gridTemplateColumns: "repeat(2, 1fr)",
  gap: "20px",
  marginTop: "20px"
};

const glassCard = {
  background: "rgba(255,255,255,0.05)",
  padding: "20px",
  borderRadius: "16px",
  border: "1px solid rgba(255,255,255,0.1)"
};

const activityItem = {
  background: "#111",
  padding: "10px",
  borderRadius: "8px",
  marginTop: "10px",
  display: "flex",
  justifyContent: "space-between"
};

const btnGreen = {
  padding: "10px 15px",
  background: "#22c55e",
  border: "none",
  borderRadius: "8px",
  color: "white",
  marginRight: "10px",
  cursor: "pointer"
};

const btnRed = {
  padding: "10px 15px",
  background: "#ef4444",
  border: "none",
  borderRadius: "8px",
  color: "white",
  cursor: "pointer"
};

const selectStyle = {
  padding: "10px",
  background: "#111827",
  color: "#fff",
  borderRadius: "8px",
  border: "1px solid #333",
  marginTop: "15px"
};
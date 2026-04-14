import { useState } from "react";
import Dashboard from "./Dashboard";
import Analytics from "./Analytics";

function App() {
  const [page, setPage] = useState("dashboard");

  return (
    <div style={{ display: "flex", height: "100vh", background: "#0B0F19" }}>
      
      {/* 🔥 SIDEBAR */}
      <div style={{
        width: "220px",
        background: "#111827",
        padding: "20px",
        borderRight: "1px solid #1f2937",
        color: "#fff" // ✅ force white text
      }}>
        <h2 style={{ marginBottom: "30px" }}>🔥 LivePulse</h2>

        {/* Dashboard */}
        <div
          onClick={() => setPage("dashboard")}
          style={{
            padding: "12px",
            marginBottom: "10px",
            borderRadius: "8px",
            cursor: "pointer",
            color: "#fff", // ✅ text white
            background: page === "dashboard" ? "#1f2937" : "transparent",
            fontWeight: page === "dashboard" ? "600" : "400"
          }}
        >
          📊 Dashboard
        </div>

        {/* Analytics */}
        <div
          onClick={() => setPage("analytics")}
          style={{
            padding: "12px",
            borderRadius: "8px",
            cursor: "pointer",
            color: "#fff", // ✅ text white
            background: page === "analytics" ? "#1f2937" : "transparent",
            fontWeight: page === "analytics" ? "600" : "400"
          }}
        >
          📈 Analytics
        </div>
      </div>

      {/* 🔥 MAIN CONTENT */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {page === "dashboard" && <Dashboard />}
        {page === "analytics" && <Analytics />}
      </div>
    </div>
  );
}

export default App;
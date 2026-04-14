import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  LineChart, Line, CartesianGrid
} from "recharts";

export default function Analytics() {
  const [planData, setPlanData] = useState([]);
  const [dailyData, setDailyData] = useState([]);
  const [churn, setChurn] = useState([]);

  useEffect(() => {
    // 🔥 revenue by plan
    fetch("http://localhost:3001/api/analytics/revenue-by-plan")
      .then(res => res.json())
      .then(data =>
        setPlanData(
          data.map(d => ({
            ...d,
            revenue: Number(d.revenue)
          }))
        )
      );

    // 🔥 daily revenue
    fetch("http://localhost:3001/api/analytics/daily-revenue")
      .then(res => res.json())
      .then(data =>
        setDailyData(
          data.map(d => ({
            ...d,
            revenue: Number(d.revenue)
          }))
        )
      );

    // 🔥 churn
    fetch("http://localhost:3001/api/analytics/churn")
      .then(res => res.json())
      .then(setChurn);
  }, []);

  return (
    <div style={{
      padding: "20px",
      background: "#0D0D1A",
      color: "white"
    }}>
      <h1>📊 Analytics Dashboard</h1>

      {/* 🔥 Revenue by Plan */}
      <div style={{ marginTop: "30px" }}>
        <h3>Revenue by Plan</h3>

        <BarChart width={500} height={300} data={planData}>
          <XAxis dataKey="plan_type" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="revenue" />
        </BarChart>
      </div>

      {/* 🔥 Daily Revenue */}
      <div style={{ marginTop: "30px" }}>
        <h3>Daily Revenue Trend</h3>

        <LineChart width={600} height={300} data={dailyData}>
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <CartesianGrid stroke="#444" />
          <Line type="monotone" dataKey="revenue" />
        </LineChart>
      </div>

      {/* 🚨 Churn */}
      <div style={{ marginTop: "30px" }}>
        <h3>⚠️ Members at Risk</h3>

        {churn.length === 0 && <p>No risk members</p>}

        {churn.map((m, i) => (
          <div key={i} style={{
            background: "#111",
            padding: "10px",
            marginBottom: "10px",
            borderRadius: "8px"
          }}>
            {m.name} — expires on{" "}
            {new Date(m.plan_expires_at).toDateString()}
          </div>
        ))}
      </div>
    </div>
  );
}
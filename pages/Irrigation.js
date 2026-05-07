import React, { useContext, useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import "../styles/irrigation.css";
import { FieldContext } from "../context/FieldContext";
import Layout from "../styles/layout.css";

export default function Irrigation() {

  const { fields } = useContext(FieldContext);

  const [irrigationData, setIrrigationData] = useState([]);

  // ✅ Initialize irrigation state from fields
  useEffect(() => {
    const enriched = fields.map(f => ({
      ...f,
      target: f.water || 50,
      progress: f.water || 0,
      isIrrigating: false
    }));

    setIrrigationData(enriched);
  }, [fields]);

  // ✅ Simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setIrrigationData(prev =>
        prev.map(field => {

          if (field.isIrrigating && field.progress < field.target) {
            return {
              ...field,
              progress: field.progress + 1
            };
          }

          if (field.progress >= field.target && field.isIrrigating) {
            return { ...field, isIrrigating: false };
          }

          return field;
        })
      );
    }, 200);

    return () => clearInterval(interval);
  }, []);

  // ✅ Toggle irrigation
  const toggle = (id) => {
    setIrrigationData(prev =>
      prev.map(f =>
        f.id === id
          ? { ...f, isIrrigating: !f.isIrrigating }
          : f
      )
    );
  };

  // ✅ Set target
  const setTarget = (id, value) => {
    setIrrigationData(prev =>
      prev.map(f =>
        f.id === id
          ? { ...f, target: Number(value) }
          : f
      )
    );
  };

  return (
    <div className="layout">
      <Sidebar />

      <div className="main">
        <Navbar />

        <h2>💧 Smart Irrigation</h2>

        <div className="irrigation-grid">
          {irrigationData.map(f => (
            <div key={f.id} className="irrigation-card">

              <h3>{f.name}</h3>
              <p>Crop: {f.crop}</p>
              <p>Soil: {f.soil}</p>

              <p>Current: {f.progress}%</p>
              <p>Target: {f.target}%</p>

              {/* TARGET */}
              <input
                type="range"
                min="0"
                max="100"
                value={f.target}
                onChange={(e) => setTarget(f.id, e.target.value)}
              />

              {/* PROGRESS */}
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${f.progress}%` }}
                ></div>
              </div>

              {/* STATUS */}
              <p>
                {f.isIrrigating ? "🌊 Irrigating..." : "⏸ Stopped"}
              </p>

              {/* CONTROL */}
              <button
                className={f.isIrrigating ? "on" : "off"}
                onClick={() => toggle(f.id)}
              >
                {f.isIrrigating ? "Stop" : "Start"}
              </button>

            </div>
          ))}
        </div>

        <div className="ai-box">
          💡 AI Suggestion: Use drip irrigation for better efficiency.
        </div>

      </div>
    </div>
  );
}
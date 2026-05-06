import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import "../styles/soil.css";

// ── Shared field data (consistent with Dashboard.js) ──────────────────────────
const FIELDS = [
  { id: 1, name: "Field 1", crop: "Sugarcane", area: "3.2 ac", ph: 6.8, moisture: 38, temp: 24, health: 91, icon: "🌾" },
  { id: 2, name: "Field 2", crop: "Wheat",     area: "1.8 ac", ph: 5.9, moisture: 22, temp: 26, health: 63, icon: "🌿" },
  { id: 3, name: "Field 3", crop: "Cotton",    area: "2.5 ac", ph: 7.1, moisture: 45, temp: 23, health: 82, icon: "🌱" },
];

const NUTRIENTS = [
  { key: "n",  label: "Nitrogen (N)",   value: 58, max: 100, unit: "kg/ha", status: "medium", color: "#3b82f6", ideal: "60–80" },
  { key: "p",  label: "Phosphorus (P)", value: 62, max: 100, unit: "kg/ha", status: "medium", color: "#8b5cf6", ideal: "60–80" },
  { key: "k",  label: "Potassium (K)",  value: 84, max: 100, unit: "kg/ha", status: "high",   color: "#10b981", ideal: "70–90" },
  { key: "om", label: "Organic Matter", value: 24, max: 100, unit: "%",     status: "low",    color: "#f59e0b", ideal: "40–60" },
  { key: "s",  label: "Sulfur (S)",     value: 41, max: 100, unit: "ppm",   status: "medium", color: "#ec4899", ideal: "40–60" },
  { key: "zn", label: "Zinc (Zn)",      value: 33, max: 100, unit: "ppm",   status: "low",    color: "#ef4444", ideal: "50–70" },
];

// Cross-page: fertilizer names match products in Marketplace (DAP Fertilizer card)
const FERTILIZERS = [
  { name: "Urea",  dose: "50 kg/acre", purpose: "Fixes Nitrogen deficiency",     icon: "🧪", urgency: "high",   applyBy: "Within 3 days", price: "₹320/bag" },
  { name: "DAP",   dose: "25 kg/acre", purpose: "Boosts Phosphorus & Nitrogen",  icon: "💊", urgency: "medium", applyBy: "This week",     price: "₹1450/bag" },
  { name: "MOP",   dose: "25 kg/acre", purpose: "Potassium supplement",          icon: "⚗️",  urgency: "low",    applyBy: "Next week",     price: "₹680/bag" },
  { name: "ZnSO₄", dose: "10 kg/acre", purpose: "Corrects Zinc deficiency",     icon: "🔬", urgency: "high",   applyBy: "Within 3 days", price: "₹540/bag" },
];

const IRRIGATION = {
  time: "Tomorrow, 6:00 AM",
  amount: "12 mm",
  method: "Drip Irrigation",
  duration: "45 mins",
  field: "Field 2 — Wheat",
  reason: "Soil moisture at 22% — below 30% threshold",
};

const TIMELINE = [
  { date: "Today",      text: "Soil test completed — Field 1",       type: "test"      },
  { date: "2 days ago", text: "DAP applied — Field 3",               type: "fertilize" },
  { date: "4 days ago", text: "Drip irrigation completed — Field 2", type: "water"     },
  { date: "6 days ago", text: "Zinc deficiency flagged — Field 2",   type: "alert"     },
  { date: "1 week ago", text: "Monthly soil report generated",       type: "report"    },
];

const T_ICON  = { test: "🧪", fertilize: "🌱", water: "💧", alert: "⚠️", report: "📋" };
const T_COLOR = { test: "blue", fertilize: "green", water: "blue", alert: "amber", report: "gray" };

// ── Sub-components ─────────────────────────────────────────────────────────────

function NutrientBar({ nutrient, animate }) {
  const statusMap = {
    high:   { label: "High",    bg: "#dcfce7", color: "#15803d" },
    medium: { label: "Optimal", bg: "#dbeafe", color: "#1d4ed8" },
    low:    { label: "Low",     bg: "#fee2e2", color: "#dc2626" },
  };
  const s = statusMap[nutrient.status];
  return (
    <div className="sr-nutrient-row">
      <div className="sr-nutrient-meta">
        <span className="sr-nutrient-name">{nutrient.label}</span>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span className="sr-nutrient-ideal">Ideal: {nutrient.ideal} {nutrient.unit}</span>
          <span className="sr-status-chip" style={{ background: s.bg, color: s.color }}>{s.label}</span>
        </div>
      </div>
      <div className="sr-bar-track">
        <div className="sr-bar-fill" style={{
          width: animate ? `${nutrient.value}%` : "0%",
          background: nutrient.color,
          transition: "width 1.1s cubic-bezier(.4,0,.2,1)",
        }} />
        <span className="sr-bar-val" style={{ color: nutrient.color }}>
          {nutrient.value} {nutrient.unit}
        </span>
      </div>
    </div>
  );
}

function PhGauge({ value }) {
  const pct = ((value - 4) / (9 - 4)) * 100;
  const label = value < 6 ? "Acidic" : value > 7.5 ? "Alkaline" : "Optimal";
  const labelColor = value < 6 ? "#ef4444" : value > 7.5 ? "#8b5cf6" : "#10b981";
  return (
    <div className="sr-ph-gauge">
      <div className="sr-ph-track">
        <div className="sr-ph-gradient" />
        <div className="sr-ph-pointer" style={{ left: `calc(${pct}% - 8px)` }} />
      </div>
      <div className="sr-ph-labels">
        {["4", "5", "6", "7", "8", "9"].map(n => <span key={n}>{n}</span>)}
      </div>
      <div className="sr-ph-reading">
        <span className="sr-ph-value">{value}</span>
        <span className="sr-ph-label" style={{ color: labelColor }}>{label}</span>
      </div>
    </div>
  );
}

function MoistureRing({ value, size = 72, stroke = 7 }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  const color = value < 30 ? "#ef4444" : value > 60 ? "#8b5cf6" : "#10b981";
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1.2s ease" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: "14px", fontWeight: 700, color: "#111", lineHeight: 1 }}>{value}%</span>
        <span style={{ fontSize: "9px", color: "#9ca3af", marginTop: "2px" }}>moist</span>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function SoilReport() {
  const navigate = useNavigate();
  const [selectedField, setSelectedField] = useState(FIELDS[0]);
  const [animated, setAnimated] = useState(false);
  const [activeTab, setActiveTab] = useState("nutrients");

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 200);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    setAnimated(false);
    const t = setTimeout(() => setAnimated(true), 120);
    return () => clearTimeout(t);
  }, [selectedField]);

  return (
    <div className="sr-container">
      <Sidebar />

      <div className="sr-main">

        {/* Header */}
        <div className="sr-header">
          <div>
            <span className="sr-page-badge">🧪 Lab Report</span>
            <h1 className="sr-title">Soil & Field Insights</h1>
            <p className="sr-subtitle">Last updated: Today, 8:30 AM · Erode, Tamil Nadu</p>
          </div>
          <div className="sr-header-actions">
            <button className="sr-outline-btn" onClick={() => navigate("/")}>← Dashboard</button>
            <button className="sr-primary-btn" onClick={() => window.print()}>📋 Export Report</button>
          </div>
        </div>

        {/* Field Selector */}
        <div className="sr-field-selector">
          {FIELDS.map(f => (
            <button
              key={f.id}
              className={`sr-field-btn ${selectedField.id === f.id ? "sr-field-btn-active" : ""}`}
              onClick={() => setSelectedField(f)}
            >
              <span className="sr-field-btn-icon">{f.icon}</span>
              <div className="sr-field-btn-text">
                <span className="sr-field-btn-name">{f.name}</span>
                <span className="sr-field-btn-crop">{f.crop}</span>
              </div>
              <span className={`sr-health-dot ${f.health >= 80 ? "sr-dot-green" : f.health >= 60 ? "sr-dot-amber" : "sr-dot-red"}`} />
            </button>
          ))}
        </div>

        {/* Summary Stats */}
        <div className="sr-stats-row">
          {[
            { label: "Soil pH",      value: selectedField.ph,           icon: "⚗️", sub: selectedField.ph < 6 ? "Acidic" : selectedField.ph > 7.5 ? "Alkaline" : "Optimal" },
            { label: "Moisture",     value: `${selectedField.moisture}%`, icon: "💧", sub: selectedField.moisture < 30 ? "Below threshold" : "Adequate" },
            { label: "Soil Temp",    value: `${selectedField.temp}°C`,   icon: "🌡", sub: "Normal range" },
            { label: "Field Health", value: `${selectedField.health}%`,  icon: "💚", sub: selectedField.health >= 80 ? "Good condition" : "Needs attention" },
          ].map((s, i) => (
            <div className="sr-stat-card" key={i} style={{ animationDelay: `${i * 70}ms` }}>
              <div className="sr-stat-icon">{s.icon}</div>
              <div>
                <div className="sr-stat-value">{s.value}</div>
                <div className="sr-stat-label">{s.label}</div>
                <div className="sr-stat-sub">{s.sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Tab Nav */}
        <div className="sr-tabs">
          {[
            { key: "nutrients",  label: "🌿 Nutrients"  },
            { key: "irrigation", label: "💧 Irrigation" },
            { key: "history",    label: "📋 History"    },
          ].map(t => (
            <button key={t.key} className={`sr-tab ${activeTab === t.key ? "sr-tab-active" : ""}`}
              onClick={() => setActiveTab(t.key)}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="sr-body">

          {/* LEFT */}
          <div className="sr-col-left">

            {activeTab === "nutrients" && <>
              {/* pH */}
              <div className="sr-card">
                <p className="sr-card-label">Soil pH Analysis — {selectedField.name}</p>
                <PhGauge value={selectedField.ph} />
                <p className="sr-ph-note">
                  {selectedField.ph < 6
                    ? "⚠️ Acidic soil — apply lime to raise pH for better nutrient uptake."
                    : selectedField.ph > 7.5
                    ? "⚠️ Alkaline soil — add sulfur or organic compost to lower pH."
                    : "✅ pH is in the optimal range. Most nutrients are freely available."}
                </p>
              </div>

              {/* Nutrients */}
              <div className="sr-card">
                <div className="sr-card-header">
                  <p className="sr-card-label">Nutrient Levels — {selectedField.crop}</p>
                  <span className="sr-updated-badge">Updated today</span>
                </div>
                <div className="sr-nutrients-list">
                  {NUTRIENTS.map(n => <NutrientBar key={n.key} nutrient={n} animate={animated} />)}
                </div>
              </div>

              {/* Organic Matter tip — links to Marketplace */}
              <div className="sr-card sr-card-amber">
                <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                  <span style={{ fontSize: "28px" }}>🪱</span>
                  <div>
                    <p className="sr-card-label" style={{ color: "#92400e" }}>Organic Matter is Low (1.2%)</p>
                    <p className="sr-tip-text">
                      Add vermicompost or farmyard manure to improve soil structure,
                      water retention and microbial activity. Target: 3–5%.
                    </p>
                    {/* ← Cross-page link to Marketplace */}
                    <button className="sr-link-btn" onClick={() => navigate("/marketplace")}>
                      Buy Vermicompost in Marketplace →
                    </button>
                  </div>
                </div>
              </div>
            </>}

            {activeTab === "irrigation" && <>
              {/* Irrigation alert card */}
              <div className="sr-card sr-card-blue">
                <p className="sr-card-label" style={{ color: "#1d4ed8" }}>💧 Irrigation Recommendation</p>
                <div className="sr-irrigation-hero">
                  <div>
                    <div className="sr-irr-time">{IRRIGATION.time}</div>
                    <div className="sr-irr-field">{IRRIGATION.field}</div>
                    <p className="sr-irr-reason">{IRRIGATION.reason}</p>
                  </div>
                  <div className="sr-irr-badge">!</div>
                </div>
                <div className="sr-irr-stats">
                  <div className="sr-irr-stat"><span>Method</span><b>{IRRIGATION.method}</b></div>
                  <div className="sr-irr-stat"><span>Amount</span><b>{IRRIGATION.amount}</b></div>
                  <div className="sr-irr-stat"><span>Duration</span><b>{IRRIGATION.duration}</b></div>
                </div>
                {/* ← Cross-page: navigates back to Dashboard irrigation card */}
                <button className="sr-primary-btn" style={{ width: "100%", marginTop: "12px" }}
                  onClick={() => navigate("/")}>
                  ✓ Schedule on Dashboard
                </button>
              </div>

              {/* Moisture rings per field */}
              <div className="sr-card">
                <p className="sr-card-label">Moisture by Field</p>
                <div className="sr-moisture-list">
                  {FIELDS.map(f => (
                    <div key={f.id} className="sr-moisture-row">
                      <MoistureRing value={f.moisture} />
                      <div>
                        <div className="sr-moisture-name">{f.name} — {f.crop}</div>
                        <div className="sr-moisture-status"
                          style={{ color: f.moisture < 30 ? "#ef4444" : "#10b981" }}>
                          {f.moisture < 30 ? "⚠️ Needs irrigation" : "✅ Adequate"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>}

            {activeTab === "history" && (
              <div className="sr-card">
                <p className="sr-card-label">Field Activity Log</p>
                <div className="sr-timeline">
                  {TIMELINE.map((item, i) => (
                    <div key={i} className="sr-timeline-item">
                      <div className={`sr-timeline-dot sr-tdot-${T_COLOR[item.type]}`}>
                        {T_ICON[item.type]}
                      </div>
                      <div className="sr-timeline-content">
                        <div className="sr-timeline-text">{item.text}</div>
                        <div className="sr-timeline-date">{item.date}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT */}
          <div className="sr-col-right">

            {/* Fertilizer Plan — with Buy buttons linking to Marketplace */}
            <div className="sr-card">
              <div className="sr-card-header">
                <p className="sr-card-label">Fertilizer Plan</p>
                {/* ← Cross-page */}
                <button className="sr-link-btn" onClick={() => navigate("/marketplace")}>
                  Marketplace →
                </button>
              </div>
              <div className="sr-fert-list">
                {FERTILIZERS.map((f, i) => (
                  <div key={i} className={`sr-fert-card sr-fert-${f.urgency}`}>
                    <div className="sr-fert-top">
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span className="sr-fert-icon">{f.icon}</span>
                        <div>
                          <div className="sr-fert-name">{f.name}</div>
                          <div className="sr-fert-dose">{f.dose}</div>
                        </div>
                      </div>
                      <span className={`sr-urgency-badge sr-urgency-${f.urgency}`}>
                        {f.urgency === "high" ? "Urgent" : f.urgency === "medium" ? "Soon" : "Later"}
                      </span>
                    </div>
                    <div className="sr-fert-purpose">{f.purpose}</div>
                    <div className="sr-fert-footer">
                      <span className="sr-fert-apply">📅 {f.applyBy}</span>
                      <span className="sr-fert-price">{f.price}</span>
                    </div>
                    {/* ← Cross-page: buy this fertilizer */}
                    <button className="sr-buy-btn" onClick={() => navigate("/marketplace")}>
                      🛒 Buy {f.name} in Marketplace →
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Insight */}
            <div className="sr-card sr-card-green">
              <p className="sr-card-label" style={{ color: "#166534" }}>🤖 AI Crop Insight</p>
              <p className="sr-insight-text">
                Your <b>{selectedField.crop}</b> field has pH <b>{selectedField.ph}</b> and
                moisture <b>{selectedField.moisture}%</b> —
                {selectedField.health >= 80
                  ? " in good health overall. "
                  : " under mild stress. "}
                Prioritise zinc supplementation and organic matter addition
                for the best yield this season.
              </p>
              <div className="sr-insight-chips">
                <span className="sr-insight-chip">🌾 Yield est. +8% with corrections</span>
                <span className="sr-insight-chip">📅 Next test: 14 days</span>
              </div>
            </div>

            {/* Quick Actions nav hub — cross-page */}
            <div className="sr-card">
              <p className="sr-card-label">Quick Navigation</p>
              <div className="sr-quick-actions">
                <button className="sr-qa-btn" onClick={() => navigate("/")}>
                  <span>🏠</span><span>Dashboard</span>
                </button>
                <button className="sr-qa-btn" onClick={() => navigate("/marketplace")}>
                  <span>🛒</span><span>Marketplace</span>
                </button>
                <button className="sr-qa-btn" onClick={() => navigate("/irrigation")}>
                  <span>💧</span><span>Irrigation</span>
                </button>
                <button className="sr-qa-btn" onClick={() => navigate("/fields")}>
                  <span>🗺</span><span>My Fields</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
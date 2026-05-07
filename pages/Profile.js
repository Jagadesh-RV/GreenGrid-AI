import { useContext, useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Navbar  from "../components/Navbar";
import { FieldContext } from "../context/FieldContext";
import "../styles/layout.css";
import "../styles/profile.css";

/* ─── Helpers ───────────────────────────────────────────────── */
const CROP_OPTIONS    = ["Rice","Wheat","Cotton","Sugarcane","Maize","Groundnut","Tomato","Onion","Banana","Coconut","Soybean","Turmeric"];
const SOIL_OPTIONS    = ["Clay","Loam","Sandy","Silt","Black","Red","Mixed"];
const IRRIG_OPTIONS   = ["Drip","Sprinkler","Flood","Rainfed","Canal","Borewell"];
const SEASON_OPTIONS  = ["Kharif","Rabi","Zaid","Year-round"];

const CROP_ICONS = {
  Rice:"🌾",Wheat:"🌿",Cotton:"🪴",Sugarcane:"🎋",Maize:"🌽",
  Groundnut:"🥜",Tomato:"🍅",Onion:"🧅",Banana:"🍌",Coconut:"🥥",
  Soybean:"🫘",Turmeric:"🟡",default:"🌱"
};
const IRRIG_ICONS = { Drip:"💧",Sprinkler:"🚿",Flood:"🌊",Rainfed:"🌧️",Canal:"〰️",Borewell:"⛽",default:"💦" };
const SOIL_COLORS = {
  Clay:"#b45309",Loam:"#65a30d",Sandy:"#d97706",Silt:"#0891b2",
  Black:"#1e293b",Red:"#dc2626",Mixed:"#6b7280"
};

function calcHealth(f) {
  let s = 0;
  if (f.crop)           s += 25;
  if (f.soil)           s += 25;
  if (f.irrigation)     s += 25;
  if (parseFloat(f.acres) > 0) s += 25;
  return s;
}

/* ─── Activity log (stored in localStorage) ─────────────────── */
function useActivityLog() {
  const [log, setLog] = useState(() => {
    try { return JSON.parse(localStorage.getItem("fs_activity") || "[]"); }
    catch { return []; }
  });

  const addLog = (entry) => {
    const next = [{ ...entry, id: Date.now(), time: new Date().toISOString() }, ...log].slice(0, 20);
    setLog(next);
    localStorage.setItem("fs_activity", JSON.stringify(next));
  };

  return { log, addLog };
}

/* ─── Toast ─────────────────────────────────────────────────── */
function useToast() {
  const [toasts, setToasts] = useState([]);
  const show = (msg, type = "success") => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3000);
  };
  return { toasts, show };
}

/* ─── Health ring ───────────────────────────────────────────── */
function HealthRing({ score, size = 56 }) {
  const stroke = 5;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 75 ? "#16a34a" : score >= 50 ? "#e8a020" : "#dc2626";
  return (
    <div style={{ position:"relative", width:size, height:size, flexShrink:0 }}>
      <svg width={size} height={size} style={{ transform:"rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={stroke}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition:"stroke-dashoffset .8s cubic-bezier(.4,0,.2,1)" }}/>
      </svg>
      <div style={{
        position:"absolute", inset:0,
        display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center"
      }}>
        <span style={{ fontSize:13, fontWeight:700, color, lineHeight:1 }}>{score}%</span>
      </div>
    </div>
  );
}

/* ─── Stats Panel ───────────────────────────────────────────── */
function StatsPanel({ fields, farmer }) {
  const totalAcres = fields.reduce((a, f) => a + (parseFloat(f.acres) || 0), 0);
  const crops  = [...new Set(fields.map(f => f.crop).filter(Boolean))];
  const avgHealth = fields.length
    ? Math.round(fields.reduce((a, f) => a + calcHealth(f), 0) / fields.length) : 0;

  const stats = [
    { icon:"🌾", value: fields.length,           label:"Total Fields"   },
    { icon:"📐", value: totalAcres.toFixed(1)+"ac",label:"Acres Tracked" },
    { icon:"🌿", value: crops.length,             label:"Crop Varieties"  },
    { icon:"💚", value: avgHealth+"%",            label:"Avg Health"      },
  ];

  return (
    <div className="prof-stats-row">
      {stats.map((s, i) => (
        <div key={i} className="prof-stat-card" style={{ animationDelay:`${i*70}ms` }}>
          <span className="prof-stat-icon">{s.icon}</span>
          <p className="prof-stat-value">{s.value}</p>
          <p className="prof-stat-label">{s.label}</p>
        </div>
      ))}
    </div>
  );
}

/* ─── Weather widget (live-look) ────────────────────────────── */
function MiniWeather({ location }) {
  const [temp] = useState(34);
  return (
    <div className="prof-weather">
      <span className="prof-weather-icon">⛅</span>
      <div>
        <p className="prof-weather-temp">{temp}°C · Partly Cloudy</p>
        <p className="prof-weather-loc">📍 {location}</p>
      </div>
      <div className="prof-weather-tip">🌱 Good irrigation day</div>
    </div>
  );
}

/* ─── Field Card ─────────────────────────────────────────────── */
function FieldCard({ field, onEdit, onDelete, isEditing, onChange, onSave, onCancel }) {
  const health = calcHealth(field);
  const cropIcon = CROP_ICONS[field.crop] || CROP_ICONS.default;
  const irrigIcon = IRRIG_ICONS[field.irrigation] || IRRIG_ICONS.default;
  const soilColor = SOIL_COLORS[field.soil] || SOIL_COLORS.Mixed;

  if (isEditing) {
    return (
      <div className="prof-field-card prof-field-card--editing">
        <div className="prof-field-edit-header">
          <span>✏️</span>
          <p>Editing: {field.name}</p>
        </div>
        <div className="prof-field-form">
          <div className="input-group">
            <label className="input-label">Field Name</label>
            <input className="input" name="name" value={field.name} onChange={onChange}/>
          </div>
          <div className="input-group">
            <label className="input-label">Area (acres)</label>
            <input className="input" type="number" name="acres" value={field.acres} onChange={onChange} min="0" step="0.1"/>
          </div>
          <div className="input-group">
            <label className="input-label">Crop</label>
            <select className="select" name="crop" value={field.crop} onChange={onChange}>
              <option value="">Select crop</option>
              {CROP_OPTIONS.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="input-group">
            <label className="input-label">Soil Type</label>
            <select className="select" name="soil" value={field.soil} onChange={onChange}>
              <option value="">Select soil</option>
              {SOIL_OPTIONS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="input-group">
            <label className="input-label">Irrigation</label>
            <select className="select" name="irrigation" value={field.irrigation} onChange={onChange}>
              <option value="">Select method</option>
              {IRRIG_OPTIONS.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div className="input-group">
            <label className="input-label">Season</label>
            <select className="select" name="season" value={field.season || ""} onChange={onChange}>
              <option value="">Select season</option>
              {SEASON_OPTIONS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div className="prof-field-edit-actions">
          <button className="btn btn-secondary btn-sm" onClick={onCancel}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={onSave}>Save Field</button>
        </div>
      </div>
    );
  }

  return (
    <div className="prof-field-card">
      <div className="prof-field-top">
        <div className="prof-field-crop-icon">{cropIcon}</div>
        <div className="prof-field-info">
          <p className="prof-field-name">{field.name}</p>
          <p className="prof-field-meta">
            {field.crop || "No crop"} · {field.acres || "—"} ac
          </p>
        </div>
        <HealthRing score={health} />
      </div>

      <div className="prof-field-tags">
        {field.soil && (
          <span className="prof-field-tag" style={{ background: soilColor+"22", color: soilColor, border:`1px solid ${soilColor}44` }}>
            🪨 {field.soil}
          </span>
        )}
        {field.irrigation && (
          <span className="prof-field-tag prof-field-tag--blue">
            {irrigIcon} {field.irrigation}
          </span>
        )}
        {field.season && (
          <span className="prof-field-tag prof-field-tag--amber">
            📅 {field.season}
          </span>
        )}
      </div>

      {/* Health bar */}
      <div className="prof-health-wrap">
        <div className="progress-track">
          <div className="progress-fill" style={{
            width:`${health}%`,
            background: health >= 75 ? "var(--green)" : health >= 50 ? "var(--amber)" : "var(--red)"
          }}/>
        </div>
        <span className="prof-health-label">
          {health >= 75 ? "✅ Healthy" : health >= 50 ? "⚠️ Fair" : "🔴 Needs attention"}
        </span>
      </div>

      <div className="prof-field-actions">
        <button className="btn btn-ghost btn-sm" onClick={onEdit}>✏️ Edit</button>
        <button className="btn btn-danger btn-sm" onClick={onDelete}>🗑</button>
      </div>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────── */
export default function Profile() {
  const navigate = useNavigate();
  const { fields, setFields } = useContext(FieldContext);
  const { log, addLog } = useActivityLog();
  const { toasts, show: showToast } = useToast();
  const [collapsed, setCollapsed]     = useState(false);
  const [editFarmer, setEditFarmer]   = useState(false);
  const [editingFieldId, setEditingFieldId] = useState(null);
  const [activeTab, setActiveTab]     = useState("fields");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [showAddModal, setShowAddModal]   = useState(false);

  const [farmer, setFarmer] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("fs_farmer") || "null") || {
        name: "Ramesh Kumar", location: "Erode, Tamil Nadu", phone: "9876543210",
        totalLand: 12, experience: "8 years", farmType: "Mixed Farming",
        bankLinked: true, aadhaar: "XXXX-XXXX-4521"
      };
    } catch {
      return {
        name: "Ramesh Kumar", location: "Erode, Tamil Nadu", phone: "9876543210",
        totalLand: 12, experience: "8 years", farmType: "Mixed Farming",
        bankLinked: true, aadhaar: "XXXX-XXXX-4521"
      };
    }
  });

  const [farmerDraft, setFarmerDraft] = useState({ ...farmer });

  const saveFarmer = () => {
    setFarmer(farmerDraft);
    localStorage.setItem("fs_farmer", JSON.stringify(farmerDraft));
    setEditFarmer(false);
    addLog({ icon:"👤", action:"Profile Updated", detail:`Name: ${farmerDraft.name}` });
    showToast("Profile saved successfully!", "success");
  };

  const handleFieldChange = (id, e) => {
    setFields(fields.map(f => f.id === id ? { ...f, [e.target.name]: e.target.value } : f));
  };

  const saveField = (id) => {
    const field = fields.find(f => f.id === id);
    setEditingFieldId(null);
    addLog({ icon:"🌾", action:"Field Updated", detail:`${field.name} — ${field.crop || "No crop"}` });
    showToast("Field saved!", "success");
    localStorage.setItem("fs_fields", JSON.stringify(fields));
  };

  const addField = () => setShowAddModal(true);

  const confirmAddField = (draft) => {
    const newField = { id: Date.now(), ...draft, health: calcHealth(draft) };
    const next = [...fields, newField];
    setFields(next);
    setEditingFieldId(newField.id);
    setShowAddModal(false);
    addLog({ icon:"➕", action:"Field Added", detail:draft.name });
    showToast("New field added!", "success");
    localStorage.setItem("fs_fields", JSON.stringify(next));
  };

  const deleteField = (id) => {
    const field = fields.find(f => f.id === id);
    const next = fields.filter(f => f.id !== id);
    setFields(next);
    setDeleteConfirm(null);
    addLog({ icon:"🗑", action:"Field Deleted", detail:field?.name });
    showToast("Field deleted.", "warning");
    localStorage.setItem("fs_fields", JSON.stringify(next));
  };

  const totalAcres = fields.reduce((a, f) => a + (parseFloat(f.acres) || 0), 0);

  return (
    <div className="app-shell">
      <Sidebar collapsed={collapsed}/>

      <div className={`page-main${collapsed ? " sidebar-collapsed" : ""}`}>
        <Navbar onToggle={() => setCollapsed(c => !c)} sidebarCollapsed={collapsed}/>

        <div className="page-content">

          {/* ── Page header ── */}
          <div className="page-header">
            <div className="page-title-group">
              <p className="page-eyebrow">Account</p>
              <h1 className="page-title">Farmer Profile</h1>
              <p className="page-subtitle">Manage your identity, fields, and farm activity</p>
            </div>
            <div className="page-actions">
              <button className="btn btn-secondary btn-sm" onClick={() => navigate("/marketplace")}>
                🛒 Marketplace
              </button>
              <button className="btn btn-primary btn-sm" onClick={addField}>
                + Add Field
              </button>
            </div>
          </div>

          {/* ── Stats ── */}
          <StatsPanel fields={fields} farmer={farmer}/>

          {/* ── Profile banner ── */}
          <div className="prof-banner">
            <div className="prof-banner-bg"/>
            <div className="prof-avatar-wrap">
              <div className="prof-avatar">👨‍🌾</div>
              <div className="prof-avatar-badge">✓</div>
            </div>
            <div className="prof-banner-info">
              {editFarmer ? (
                <div className="prof-edit-form">
                  <div className="prof-edit-grid">
                    <div className="input-group">
                      <label className="input-label">Full Name</label>
                      <input className="input" name="name" value={farmerDraft.name}
                        onChange={e => setFarmerDraft(d => ({...d,[e.target.name]:e.target.value}))}/>
                    </div>
                    <div className="input-group">
                      <label className="input-label">Location</label>
                      <input className="input" name="location" value={farmerDraft.location}
                        onChange={e => setFarmerDraft(d => ({...d,[e.target.name]:e.target.value}))}/>
                    </div>
                    <div className="input-group">
                      <label className="input-label">Phone</label>
                      <input className="input" name="phone" value={farmerDraft.phone}
                        onChange={e => setFarmerDraft(d => ({...d,[e.target.name]:e.target.value}))}/>
                    </div>
                    <div className="input-group">
                      <label className="input-label">Total Land (acres)</label>
                      <input className="input" type="number" name="totalLand" value={farmerDraft.totalLand}
                        onChange={e => setFarmerDraft(d => ({...d,[e.target.name]:e.target.value}))}/>
                    </div>
                    <div className="input-group">
                      <label className="input-label">Experience</label>
                      <input className="input" name="experience" value={farmerDraft.experience}
                        onChange={e => setFarmerDraft(d => ({...d,[e.target.name]:e.target.value}))}/>
                    </div>
                    <div className="input-group">
                      <label className="input-label">Farm Type</label>
                      <input className="input" name="farmType" value={farmerDraft.farmType}
                        onChange={e => setFarmerDraft(d => ({...d,[e.target.name]:e.target.value}))}/>
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:10, marginTop:12 }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => { setEditFarmer(false); setFarmerDraft({...farmer}); }}>Cancel</button>
                    <button className="btn btn-primary btn-sm" onClick={saveFarmer}>Save Profile</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="prof-name-row">
                    <h2 className="prof-name">{farmer.name}</h2>
                    <span className="badge badge-green">✓ Verified</span>
                  </div>
                  <p className="prof-location">📍 {farmer.location}</p>
                  <div className="prof-meta-chips">
                    <span className="prof-chip">📞 {farmer.phone}</span>
                    <span className="prof-chip">🌾 {totalAcres.toFixed(1)} Acres</span>
                    <span className="prof-chip">🧑‍🌾 {farmer.experience}</span>
                    <span className="prof-chip">🏡 {farmer.farmType}</span>
                  </div>
                  <MiniWeather location={farmer.location}/>
                  <button className="btn btn-secondary btn-sm" style={{ marginTop:14 }}
                    onClick={() => { setEditFarmer(true); setFarmerDraft({...farmer}); }}>
                    ✏️ Edit Profile
                  </button>
                </>
              )}
            </div>

            {/* Compliance info panel */}
            <div className="prof-compliance">
              <p className="prof-compliance-title">📋 Farmer ID</p>
              <div className="prof-compliance-row">
                <span>Aadhaar</span><b>{farmer.aadhaar}</b>
              </div>
              <div className="prof-compliance-row">
                <span>Bank Linked</span>
                <span className={`badge ${farmer.bankLinked ? "badge-green" : "badge-red"}`}>
                  {farmer.bankLinked ? "✓ Yes" : "✗ No"}
                </span>
              </div>
              <div className="prof-compliance-row">
                <span>KCC Status</span>
                <span className="badge badge-green">Active</span>
              </div>
              <div className="prof-compliance-row">
                <span>PM-KISAN</span>
                <span className="badge badge-sky">Enrolled</span>
              </div>
              <button className="btn btn-ghost btn-sm" style={{ width:"100%", marginTop:8, justifyContent:"center" }}>
                View Documents →
              </button>
            </div>
          </div>

          {/* ── Tabs ── */}
          <div className="prof-tabs">
            {[
              { key:"fields",   label:"🌾 My Fields",     count: fields.length  },
              { key:"activity", label:"📋 Activity Log",  count: log.length     },
              { key:"insights", label:"🤖 AI Insights"                          },
            ].map(tab => (
              <button
                key={tab.key}
                className={`prof-tab${activeTab === tab.key ? " prof-tab--active" : ""}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span className="prof-tab-count">{tab.count}</span>
                )}
              </button>
            ))}
          </div>

          {/* ── Tab: Fields ── */}
          {activeTab === "fields" && (
            <div className="prof-fields-section">
              {fields.length === 0 ? (
                <div className="prof-empty">
                  <span style={{ fontSize:48 }}>🌱</span>
                  <p>No fields added yet.</p>
                  <p style={{ fontSize:13, color:"var(--ink-soft)" }}>Add your first field to start tracking.</p>
                  <button className="btn btn-primary" onClick={addField}>+ Add Your First Field</button>
                </div>
              ) : (
                <div className="prof-field-grid">
                  {fields.map(field => (
                    <FieldCard
                      key={field.id}
                      field={field}
                      isEditing={editingFieldId === field.id}
                      onChange={e => handleFieldChange(field.id, e)}
                      onEdit={() => setEditingFieldId(field.id)}
                      onSave={() => saveField(field.id)}
                      onCancel={() => setEditingFieldId(null)}
                      onDelete={() => setDeleteConfirm(field.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Tab: Activity Log ── */}
          {activeTab === "activity" && (
            <div className="card">
              <div className="card-header">
                <p className="card-title">Recent Farm Activity</p>
                <button className="btn btn-ghost btn-sm" onClick={() => {
                  localStorage.removeItem("fs_activity");
                  window.location.reload();
                }}>Clear log</button>
              </div>
              {log.length === 0 ? (
                <div className="prof-empty">
                  <span>📋</span>
                  <p>No activity recorded yet.</p>
                </div>
              ) : (
                <div className="prof-activity-list">
                  {log.map(entry => (
                    <div key={entry.id} className="prof-activity-item">
                      <div className="prof-activity-icon">{entry.icon}</div>
                      <div className="prof-activity-body">
                        <p className="prof-activity-action">{entry.action}</p>
                        <p className="prof-activity-detail">{entry.detail}</p>
                      </div>
                      <span className="prof-activity-time">
                        {new Date(entry.time).toLocaleString("en-IN", {
                          day:"2-digit", month:"short", hour:"2-digit", minute:"2-digit"
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Tab: AI Insights ── */}
          {activeTab === "insights" && (
            <div className="prof-insights-grid">
              <div className="card">
                <p className="card-title" style={{ marginBottom:14 }}>🤖 AI Farm Summary</p>
                <div className="prof-insight-body">
                  <p>Based on your <b>{fields.length} fields</b> spanning <b>{totalAcres.toFixed(1)} acres</b>, here are personalized recommendations:</p>
                  <ul className="prof-insight-list">
                    <li>💧 <b>Irrigation:</b> {fields.some(f => f.irrigation === "Drip") ? "Drip irrigation detected — excellent water efficiency." : "Consider switching to drip irrigation for 40% water savings."}</li>
                    <li>🌱 <b>Crop diversity:</b> {[...new Set(fields.map(f => f.crop).filter(Boolean))].length > 2 ? "Good crop rotation detected. Continue diversifying." : "Increase crop diversity for better risk management."}</li>
                    <li>🧪 <b>Soil health:</b> Schedule quarterly soil tests to maintain nutrient balance.</li>
                    <li>📈 <b>Market timing:</b> Tomato and wheat prices are trending upward — favorable for selling.</li>
                  </ul>
                </div>
              </div>

              <div className="card">
                <p className="card-title" style={{ marginBottom:14 }}>🌾 Field Health Summary</p>
                {fields.length === 0 ? (
                  <p style={{ color:"var(--ink-soft)", fontSize:13 }}>Add fields to see health insights.</p>
                ) : (
                  <div className="prof-health-summary">
                    {fields.map(f => {
                      const h = calcHealth(f);
                      return (
                        <div key={f.id} className="prof-health-row">
                          <span>{CROP_ICONS[f.crop] || "🌾"}</span>
                          <span style={{ flex:1, fontWeight:600, fontSize:13 }}>{f.name}</span>
                          <div className="progress-track" style={{ flex:2 }}>
                            <div className="progress-fill" style={{
                              width:`${h}%`,
                              background: h >= 75 ? "var(--green)" : h >= 50 ? "var(--amber)" : "var(--red)"
                            }}/>
                          </div>
                          <span style={{ fontSize:12, fontWeight:700, color: h >= 75 ? "var(--green)" : "var(--amber)", minWidth:36, textAlign:"right" }}>{h}%</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="card">
                <p className="card-title" style={{ marginBottom:14 }}>📅 Upcoming Tasks</p>
                <div className="prof-tasks">
                  {[
                    { icon:"🧪", task:"Soil test due",        date:"In 3 days",  urgency:"high"   },
                    { icon:"💧", task:"Drip system check",    date:"This week",  urgency:"medium" },
                    { icon:"🌱", task:"Fertilizer application",date:"Next week", urgency:"low"    },
                    { icon:"📊", task:"Crop yield estimation", date:"Next week", urgency:"low"    },
                  ].map((t, i) => (
                    <div key={i} className={`prof-task prof-task--${t.urgency}`}>
                      <span>{t.icon}</span>
                      <div>
                        <p>{t.task}</p>
                        <span>{t.date}</span>
                      </div>
                      <span className={`badge badge-${t.urgency === "high" ? "red" : t.urgency === "medium" ? "yellow" : "green"}`}>
                        {t.urgency}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ── Delete confirm modal ── */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <p className="modal-title">🗑 Delete Field</p>
              <button className="modal-close" onClick={() => setDeleteConfirm(null)}>×</button>
            </div>
            <p style={{ color:"var(--ink-mid)", marginBottom:20, fontSize:14 }}>
              Are you sure you want to delete <b>{fields.find(f => f.id === deleteConfirm)?.name}</b>? This cannot be undone.
            </p>
            <div style={{ display:"flex", gap:10 }}>
              <button className="btn btn-secondary" style={{ flex:1 }} onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="btn btn-danger" style={{ flex:1 }} onClick={() => deleteField(deleteConfirm)}>Delete Field</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Field modal ── */}
      {showAddModal && <AddFieldModal onConfirm={confirmAddField} onClose={() => setShowAddModal(false)}/>}

      {/* ── Toasts ── */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            {t.type === "success" ? "✅" : t.type === "warning" ? "⚠️" : "❌"} {t.msg}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Add Field Modal ─────────────────────────────────────────── */
function AddFieldModal({ onConfirm, onClose }) {
  const [draft, setDraft] = useState({ name:"", acres:"", crop:"", soil:"", irrigation:"", season:"" });
  const change = e => setDraft(d => ({...d, [e.target.name]: e.target.value}));
  const valid  = draft.name.trim().length > 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth:520 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <p className="modal-title">🌾 Add New Field</p>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 14px" }}>
          <div className="input-group" style={{ gridColumn:"1/-1" }}>
            <label className="input-label">Field Name *</label>
            <input className="input" name="name" value={draft.name} onChange={change} placeholder="e.g. North Block"/>
          </div>
          <div className="input-group">
            <label className="input-label">Area (acres)</label>
            <input className="input" type="number" name="acres" value={draft.acres} onChange={change} min="0" step="0.1" placeholder="0.0"/>
          </div>
          <div className="input-group">
            <label className="input-label">Season</label>
            <select className="select" name="season" value={draft.season} onChange={change}>
              <option value="">Select</option>
              {SEASON_OPTIONS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="input-group">
            <label className="input-label">Crop</label>
            <select className="select" name="crop" value={draft.crop} onChange={change}>
              <option value="">Select crop</option>
              {CROP_OPTIONS.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="input-group">
            <label className="input-label">Soil Type</label>
            <select className="select" name="soil" value={draft.soil} onChange={change}>
              <option value="">Select soil</option>
              {SOIL_OPTIONS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="input-group" style={{ gridColumn:"1/-1" }}>
            <label className="input-label">Irrigation Method</label>
            <select className="select" name="irrigation" value={draft.irrigation} onChange={change}>
              <option value="">Select method</option>
              {IRRIG_OPTIONS.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display:"flex", gap:10, marginTop:8 }}>
          <button className="btn btn-secondary" style={{ flex:1 }} onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" style={{ flex:2 }} disabled={!valid} onClick={() => onConfirm(draft)}>
            Add Field
          </button>
        </div>
      </div>
    </div>
  );
}
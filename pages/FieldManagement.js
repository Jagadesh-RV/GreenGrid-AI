import { useContext, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";
import { FieldContext } from "../context/FieldContext";
import "../styles/layout.css";
import "../styles/fieldManagement.css";

const CROP_OPTIONS = [
  "Paddy", "Wheat", "Maize", "Cotton", "Sugarcane", "Groundnut",
  "Tomato", "Onion", "Banana", "Coconut", "Soybean", "Turmeric"
];

const SOIL_OPTIONS = [
  "Clay", "Loam", "Sandy", "Silt", "Black", "Red", "Mixed"
];

const IRRIG_OPTIONS = [
  "Drip", "Sprinkler", "Flood", "Rainfed", "Canal", "Borewell"
];

const CROP_ICONS = {
  Paddy: "🌾", Wheat: "🌿", Maize: "🌽", Cotton: "☁️", Sugarcane: "🎋",
  Groundnut: "🥜", Tomato: "🍅", Onion: "🧅", Banana: "🍌", Coconut: "🥥",
  Soybean: "🌱", Turmeric: "🟠", default: "🌾"
};

const SOIL_COLORS = {
  Clay: "#b45309", Loam: "#65a30d", Sandy: "#d97706", Silt: "#0891b2",
  Black: "#1e293b", Red: "#dc2626", Mixed: "#6b7280"
};

const calcFieldHealth = (field) => {
  let score = 0;
  if (field.name) score += 15;
  if (field.acres && parseFloat(field.acres) > 0) score += 25;
  if (field.crop) score += 20;
  if (field.soil) score += 20;
  if (field.irrigation) score += 20;
  return score;
};

const getHealthStatus = (score) => {
  if (score >= 80) return { label: "Excellent", color: "#16a34a", icon: "✅" };
  if (score >= 60) return { label: "Good", color: "#e8a020", icon: "✓" };
  if (score >= 40) return { label: "Fair", color: "#f97316", icon: "⚠️" };
  return { label: "Incomplete", color: "#dc2626", icon: "⚠️" };
};

const INITIAL_FORM = { name: "", acres: "", crop: "", soil: "", irrigation: "", water: 50 };

export default function FieldManagement() {
  const { fields, setFields } = useContext(FieldContext);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [editingId, setEditingId] = useState(null);
  const [toastMsg, setToastMsg] = useState("");

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddField = () => {
    if (!form.name.trim()) {
      showToast("Field name is required");
      return;
    }
    if (!form.acres || parseFloat(form.acres) <= 0) {
      showToast("Please enter valid acres");
      return;
    }

    const newField = {
      id: Math.max(...fields.map((f) => f.id), 0) + 1,
      ...form,
      acres: parseFloat(form.acres),
      water: parseInt(form.water),
    };

    setFields((prev) => [...prev, newField]);
    setForm(INITIAL_FORM);
    setShowForm(false);
    showToast("Field added successfully!");
  };

  const handleUpdateField = () => {
    if (!form.name.trim()) {
      showToast("Field name is required");
      return;
    }
    if (!form.acres || parseFloat(form.acres) <= 0) {
      showToast("Please enter valid acres");
      return;
    }

    setFields((prev) =>
      prev.map((field) =>
        field.id === editingId
          ? { ...field, ...form, acres: parseFloat(form.acres), water: parseInt(form.water) }
          : field
      )
    );

    setEditingId(null);
    setForm(INITIAL_FORM);
    showToast("Field updated successfully!");
  };

  const handleEditField = (field) => {
    setForm({
      name: field.name,
      acres: field.acres,
      crop: field.crop || "",
      soil: field.soil || "",
      irrigation: field.irrigation || "",
      water: field.water || 50,
    });
    setEditingId(field.id);
    setShowForm(true);
  };

  const handleDeleteField = (id) => {
    if (window.confirm("Are you sure you want to delete this field?")) {
      setFields((prev) => prev.filter((f) => f.id !== id));
      showToast("Field deleted successfully!");
    }
  };

  const handleCancel = () => {
    setForm(INITIAL_FORM);
    setEditingId(null);
    setShowForm(false);
  };

  const sortedFields = useMemo(() => {
    let items = [...fields];

    // Filter
    if (search) {
      const query = search.toLowerCase();
      items = items.filter((f) =>
        f.name.toLowerCase().includes(query) ||
        (f.crop || "").toLowerCase().includes(query) ||
        (f.soil || "").toLowerCase().includes(query)
      );
    }

    // Sort
    if (sortBy === "acres") {
      items.sort((a, b) => parseFloat(b.acres || 0) - parseFloat(a.acres || 0));
    } else if (sortBy === "health") {
      items.sort((a, b) => calcFieldHealth(b) - calcFieldHealth(a));
    } else {
      items.sort((a, b) => a.name.localeCompare(b.name));
    }

    return items;
  }, [fields, search, sortBy]);

  const stats = useMemo(() => {
    const totalAcres = fields.reduce((sum, f) => sum + parseFloat(f.acres || 0), 0);
    const avgHealth = fields.length
      ? Math.round(fields.reduce((sum, f) => sum + calcFieldHealth(f), 0) / fields.length)
      : 0;
    const cropsUsed = new Set(fields.filter((f) => f.crop).map((f) => f.crop)).size;

    return { totalAcres: totalAcres.toFixed(2), avgHealth, cropsUsed };
  }, [fields]);

  return (
    <div className="layout">
      <Sidebar />
      <div className="main">
        {/* Header */}
        <div className="page-head">
          <div>
            <h2>🗺️ Field Management</h2>
            <p className="subtitle">Create, organize, and manage your farm fields with complete details.</p>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => {
              setForm(INITIAL_FORM);
              setEditingId(null);
              setShowForm(true);
            }}
          >
            + Add Field
          </button>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-icon">🌾</span>
            <div>
              <p className="stat-label">Total Fields</p>
              <p className="stat-value">{fields.length}</p>
            </div>
          </div>
          <div className="stat-card">
            <span className="stat-icon">📐</span>
            <div>
              <p className="stat-label">Total Acres</p>
              <p className="stat-value">{stats.totalAcres}</p>
            </div>
          </div>
          <div className="stat-card">
            <span className="stat-icon">🌿</span>
            <div>
              <p className="stat-label">Crop Varieties</p>
              <p className="stat-value">{stats.cropsUsed}</p>
            </div>
          </div>
          <div className="stat-card">
            <span className="stat-icon">💚</span>
            <div>
              <p className="stat-label">Avg Health Score</p>
              <p className="stat-value">{stats.avgHealth}%</p>
            </div>
          </div>
        </div>

        {/* Toast */}
        {toastMsg && <div className="toast-notification">{toastMsg}</div>}

        {/* Form Modal */}
        {showForm && (
          <div className="modal-overlay" onClick={handleCancel}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <h3>{editingId ? "Edit Field" : "Create New Field"}</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Field Name *</label>
                  <input
                    className="input"
                    type="text"
                    name="name"
                    placeholder="e.g., North Plot A"
                    value={form.name}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Area (acres) *</label>
                  <input
                    className="input"
                    type="number"
                    name="acres"
                    placeholder="0.00"
                    value={form.acres}
                    onChange={handleInputChange}
                    min="0"
                    step="0.1"
                  />
                </div>
                <div className="form-group">
                  <label>Crop Type</label>
                  <select className="input" name="crop" value={form.crop} onChange={handleInputChange}>
                    <option value="">Select crop</option>
                    {CROP_OPTIONS.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Soil Type</label>
                  <select className="input" name="soil" value={form.soil} onChange={handleInputChange}>
                    <option value="">Select soil</option>
                    {SOIL_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Irrigation Method</label>
                  <select className="input" name="irrigation" value={form.irrigation} onChange={handleInputChange}>
                    <option value="">Select method</option>
                    {IRRIG_OPTIONS.map((i) => (
                      <option key={i} value={i}>{i}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Water Level (%)</label>
                  <input
                    className="input"
                    type="range"
                    name="water"
                    min="0"
                    max="100"
                    value={form.water}
                    onChange={handleInputChange}
                  />
                  <span className="range-value">{form.water}%</span>
                </div>
              </div>
              <div className="form-actions">
                <button className="btn btn-secondary" onClick={handleCancel}>Cancel</button>
                <button
                  className="btn btn-primary"
                  onClick={editingId ? handleUpdateField : handleAddField}
                >
                  {editingId ? "Update Field" : "Create Field"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="controls-row">
          <input
            className="search-input"
            type="search"
            placeholder="Search fields, crops, soil..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select className="select-input" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="name">Sort by name</option>
            <option value="acres">Sort by acres</option>
            <option value="health">Sort by health</option>
          </select>
        </div>

        {/* Fields Grid */}
        <div className="fields-container">
          {sortedFields.length > 0 ? (
            sortedFields.map((field) => {
              const health = calcFieldHealth(field);
              const healthStatus = getHealthStatus(health);
              const cropIcon = CROP_ICONS[field.crop] || CROP_ICONS.default;
              const soilColor = SOIL_COLORS[field.soil] || "#6b7280";

              return (
                <article key={field.id} className="field-item">
                  <div className="field-header">
                    <div className="field-title">
                      <span className="field-crop-icon">{cropIcon}</span>
                      <div>
                        <h4>{field.name}</h4>
                        <p className="field-meta">
                          {field.acres} ac · {field.crop || "No crop"} · {field.soil || "Unknown soil"}
                        </p>
                      </div>
                    </div>
                    <div className="field-health" style={{ color: healthStatus.color }}>
                      <span>{healthStatus.icon}</span>
                      <span>{health}%</span>
                    </div>
                  </div>

                  <div className="field-details">
                    <div className="detail-item">
                      <span className="detail-label">Irrigation</span>
                      <span className="detail-value">{field.irrigation || "—"}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Water</span>
                      <span className="detail-value">{field.water}%</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Status</span>
                      <span className="detail-badge" style={{ color: healthStatus.color }}>
                        {healthStatus.label}
                      </span>
                    </div>
                  </div>

                  <div className="health-bar">
                    <div className="health-track">
                      <div
                        className="health-fill"
                        style={{
                          width: `${health}%`,
                          background: healthStatus.color,
                        }}
                      />
                    </div>
                  </div>

                  <div className="field-actions">
                    <button
                      className="action-btn edit-btn"
                      onClick={() => handleEditField(field)}
                      title="Edit field"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      className="action-btn delete-btn"
                      onClick={() => handleDeleteField(field.id)}
                      title="Delete field"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </article>
              );
            })
          ) : (
            <div className="empty-state">
              <h4>No fields found</h4>
              <p>
                {search ? "Try adjusting your search filters." : "Create your first field to get started!"}
              </p>
              {!search && (
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setForm(INITIAL_FORM);
                    setShowForm(true);
                  }}
                >
                  + Create Field
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

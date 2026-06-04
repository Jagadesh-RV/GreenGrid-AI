import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Navbar  from "../components/Navbar";
import "../styles/layout.css";
import "../styles/marketplace.css";

const PRODUCTS = [
  { id:1, name:"Hybrid Maize Seeds",  price:850,  unit:"kg",  tag:"Seeds",      badge:"Best Seller", emoji:"🌽", stock:"In Stock",  rating:4.8, sold:1240, desc:"High-yield, drought-resistant variety" },
  { id:2, name:"Vermicompost",         price:320,  unit:"kg",  tag:"Organic",    badge:"Eco Pick",    emoji:"🪱", stock:"In Stock",  rating:4.9, sold:890,  desc:"100% organic, improves soil structure" },
  { id:3, name:"Bio Pesticide",        price:450,  unit:"L",   tag:"Protection", badge:"New",         emoji:"🌿", stock:"Limited",  rating:4.5, sold:320,  desc:"Neem-based, safe for pollinators" },
  { id:4, name:"Paddy Seeds (IR-36)",  price:1200, unit:"kg",  tag:"Seeds",      badge:null,          emoji:"🌾", stock:"In Stock",  rating:4.7, sold:650,  desc:"Short-duration, high-yield variety" },
  { id:5, name:"Neem Oil Concentrate", price:280,  unit:"L",   tag:"Organic",    badge:null,          emoji:"🍃", stock:"In Stock",  rating:4.6, sold:430,  desc:"Cold-pressed, 1500ppm azadirachtin" },
  { id:6, name:"DAP Fertilizer",       price:1450, unit:"bag", tag:"Fertilizer", badge:"Popular",     emoji:"💊", stock:"In Stock",  rating:4.7, sold:980,  desc:"18-46-0 NPK, boosts root development" },
  { id:7, name:"Potash (MOP)",         price:680,  unit:"bag", tag:"Fertilizer", badge:null,          emoji:"⚗️", stock:"In Stock",  rating:4.5, sold:560,  desc:"60% K₂O, improves fruit quality" },
  { id:8, name:"Micro-nutrient Mix",   price:390,  unit:"kg",  tag:"Fertilizer", badge:"New",         emoji:"🔬", stock:"Limited",  rating:4.4, sold:210,  desc:"Zn, Fe, Mn, B blend for deficiencies" },
];

const PRODUCE = [
  { id:1, name:"Wheat",     price:2100, unit:"quintal", trend:+3.2, demand:"High",   icon:"🌾", volume:"4.2L kg" },
  { id:2, name:"Onion",     price:1350, unit:"quintal", trend:-1.4, demand:"Medium", icon:"🧅", volume:"2.8L kg" },
  { id:3, name:"Tomato",    price:980,  unit:"quintal", trend:+7.1, demand:"High",   icon:"🍅", volume:"1.6L kg" },
  { id:4, name:"Sugarcane", price:3200, unit:"tonne",  trend:+0.8, demand:"Stable", icon:"🎋", volume:"8.1L kg" },
  { id:5, name:"Cotton",    price:6100, unit:"quintal", trend:+2.1, demand:"High",   icon:"🪴", volume:"3.4L kg" },
  { id:6, name:"Maize",     price:1800, unit:"quintal", trend:-0.5, demand:"Medium", icon:"🌽", volume:"5.7L kg" },
];

const TABS = ["All","Seeds","Organic","Fertilizer","Protection"];

export default function Marketplace() {
  const navigate = useNavigate();
  const [search, setSearch]   = useState("");
  const [tab, setTab]         = useState("All");
  const [cart, setCart]       = useState({});
  const [added, setAdded]     = useState({});
  const [sellModal, setSellModal] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const [sortBy, setSortBy]   = useState("popular");
  const [view, setView]       = useState("grid");

  const totalItems = Object.values(cart).reduce((a, b) => a + b, 0);
  const totalValue = PRODUCTS.reduce((sum, p) => sum + (cart[p.id] || 0) * p.price, 0);

  const filtered = PRODUCTS
    .filter(p => (tab === "All" || p.tag === tab) && p.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => sortBy === "popular" ? b.sold - a.sold : sortBy === "price-asc" ? a.price - b.price : b.price - a.price);

  const addToCart = (id) => {
    setCart(c => ({ ...c, [id]: (c[id] || 0) + 1 }));
    setAdded(a => ({ ...a, [id]: true }));
    setTimeout(() => setAdded(a => ({ ...a, [id]: false })), 1200);
  };

  return (
    <div className="app-shell">
      <Sidebar collapsed={collapsed}/>
      <div className={`page-main${collapsed ? " sidebar-collapsed" : ""}`}>
        <Navbar onToggle={() => setCollapsed(c => !c)} sidebarCollapsed={collapsed}/>
        <div className="page-content">

          <div className="page-header">
            <div className="page-title-group">
              <p className="page-eyebrow">Commerce</p>
              <h1 className="page-title">Marketplace</h1>
              <p className="page-subtitle">Buy inputs & sell your produce — all in one place</p>
            </div>
            <div className="page-actions">
              {totalItems > 0 && (
                <div className="mkt-cart-pill">
                  🛍 {totalItems} items · ₹{totalValue.toLocaleString("en-IN")}
                </div>
              )}
              <button className="btn btn-primary btn-sm" onClick={() => setSellModal(PRODUCE[0])}>
                + List Produce
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="mkt-stats">
            {[
              { icon:"📦", label:"Products Listed", value:"240+" },
              { icon:"👨‍🌾", label:"Active Sellers",  value:"1,840" },
              { icon:"📈", label:"Today's Trades",  value:"₹4.2L" },
              { icon:"🚚", label:"Avg. Delivery",   value:"2 Days" },
            ].map(s => (
              <div key={s.label} className="mkt-stat-card">
                <span>{s.icon}</span>
                <div>
                  <p className="mkt-stat-val">{s.value}</p>
                  <p className="mkt-stat-label">{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Controls */}
          <div className="mkt-controls">
            <div className="mkt-search">
              <span>🔍</span>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search seeds, fertilizers, products..."
                className="input"
                style={{ paddingLeft:36 }}
              />
              <span className="mkt-search-icon">🔍</span>
            </div>
            <div className="mkt-tabs">
              {TABS.map(t => (
                <button key={t} className={`mkt-tab${tab === t ? " mkt-tab--active" : ""}`} onClick={() => setTab(t)}>
                  {t}
                </button>
              ))}
            </div>
            <div className="mkt-sort">
              <select className="select" style={{ width:"auto" }} value={sortBy} onChange={e => setSortBy(e.target.value)}>
                <option value="popular">Most Popular</option>
                <option value="price-asc">Price: Low → High</option>
                <option value="price-desc">Price: High → Low</option>
              </select>
              <button className={`btn btn-ghost btn-icon${view === "grid" ? " mkt-view-active" : ""}`} onClick={() => setView("grid")}>▦</button>
              <button className={`btn btn-ghost btn-icon${view === "list" ? " mkt-view-active" : ""}`} onClick={() => setView("list")}>☰</button>
            </div>
          </div>

          {/* Products */}
          <section className="mkt-section">
            <div className="mkt-section-header">
              <h3>Featured Products</h3>
              <span className="mkt-count">{filtered.length} items</span>
            </div>
            {filtered.length === 0 ? (
              <div className="prof-empty">😕 No products found for "<b>{search}</b>"</div>
            ) : (
              <div className={view === "grid" ? "mkt-product-grid" : "mkt-product-list"}>
                {filtered.map(p => (
                  <div key={p.id} className="mkt-product-card">
                    {p.badge && <span className="mkt-badge">{p.badge}</span>}
                    <div className="mkt-product-emoji">{p.emoji}</div>
                    <span className={`badge badge-forest mkt-tag`}>{p.tag}</span>
                    <p className="mkt-product-name">{p.name}</p>
                    <p className="mkt-product-desc">{p.desc}</p>
                    <div className="mkt-product-rating">
                      {"★".repeat(Math.round(p.rating))} <span>{p.rating}</span> · {p.sold.toLocaleString()} sold
                    </div>
                    <div className="mkt-product-price">
                      <span className="mkt-price-val">₹{p.price.toLocaleString("en-IN")}</span>
                      <span className="mkt-price-unit">/ {p.unit}</span>
                    </div>
                    <div className="mkt-stock">
                      <span className={`mkt-stock-dot${p.stock === "Limited" ? " mkt-stock-dot--amber" : ""}`}/>
                      {p.stock} {cart[p.id] ? `· ${cart[p.id]} in cart` : ""}
                    </div>
                    <button
                      className={`btn ${added[p.id] ? "btn-amber" : "btn-primary"} btn-sm`}
                      style={{ width:"100%" }}
                      onClick={() => addToCart(p.id)}
                    >
                      {added[p.id] ? "✓ Added!" : "Add to Cart"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Mandi Prices */}
          <section className="mkt-section">
            <div className="mkt-section-header">
              <h3>Live Mandi Prices</h3>
              <span className="mkt-live-badge">🔴 Live</span>
            </div>
            <div className="mkt-produce-grid">
              {PRODUCE.map(p => (
                <div key={p.id} className="mkt-produce-card">
                  <div className="mkt-produce-top">
                    <span className="mkt-produce-icon">{p.icon}</span>
                    <div>
                      <p className="mkt-produce-name">{p.name}</p>
                      <p className="mkt-produce-vol">Vol: {p.volume}</p>
                    </div>
                    <span className={`badge ${p.trend > 0 ? "badge-green" : "badge-red"}`}>
                      {p.trend > 0 ? "▲" : "▼"} {Math.abs(p.trend)}%
                    </span>
                  </div>
                  <div className="mkt-produce-price">
                    ₹{p.price.toLocaleString("en-IN")} <span>/ {p.unit}</span>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:12 }}>
                    <span style={{ fontSize:12, color:"var(--ink-soft)" }}>Demand:</span>
                    <span className={`badge ${p.demand === "High" ? "badge-green" : p.demand === "Medium" ? "badge-yellow" : "badge-forest"}`}>
                      {p.demand}
                    </span>
                  </div>
                  <button className="btn btn-primary btn-sm" style={{ width:"100%" }}
                    onClick={() => setSellModal(p)}>
                    Sell Now →
                  </button>
                </div>
              ))}
            </div>
          </section>

        </div>
      </div>

      {/* Sell Modal */}
      {sellModal && (
        <SellModal produce={sellModal} onClose={() => setSellModal(null)}/>
      )}
    </div>
  );
}

function SellModal({ produce, onClose }) {
  const [qty, setQty]   = useState("");
  const [date, setDate] = useState("");
  const [done, setDone] = useState(false);
  const total = qty ? (parseFloat(qty) * produce.price).toLocaleString("en-IN") : "—";

  if (done) return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ textAlign:"center" }}>
        <div style={{ fontSize:56, marginBottom:12 }}>✅</div>
        <h3 style={{ fontFamily:"var(--font-display)", fontSize:20, marginBottom:8 }}>Listing Confirmed!</h3>
        <p style={{ color:"var(--ink-soft)", fontSize:14, marginBottom:20 }}>
          Your {produce.name} listing is live. Buyers will contact you shortly.
        </p>
        <button className="btn btn-primary" style={{ width:"100%" }} onClick={onClose}>Done</button>
      </div>
    </div>
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <p className="modal-title">{produce.icon} Sell {produce.name}</p>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="mkt-sell-rate">
          Current rate: <b>₹{produce.price.toLocaleString("en-IN")} / {produce.unit}</b>
          <span className={`badge ${produce.trend > 0 ? "badge-green" : "badge-red"}`} style={{ marginLeft:8 }}>
            {produce.trend > 0 ? "▲" : "▼"} {Math.abs(produce.trend)}%
          </span>
        </div>
        <div className="input-group">
          <label className="input-label">Quantity ({produce.unit})</label>
          <input className="input" type="number" value={qty} onChange={e => setQty(e.target.value)}
            placeholder={`Enter in ${produce.unit}`}/>
        </div>
        {qty && <p className="mkt-sell-total">Estimated earnings: <b>₹{total}</b></p>}
        <div className="input-group">
          <label className="input-label">Preferred Pickup Date</label>
          <input className="input" type="date" value={date} onChange={e => setDate(e.target.value)}/>
        </div>
        <div style={{ display:"flex", gap:10, marginTop:8 }}>
          <button className="btn btn-secondary" style={{ flex:1 }} onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" style={{ flex:2 }} disabled={!qty} onClick={() => setDone(true)}>
            Confirm Listing
          </button>
        </div>
      </div>
    </div>
  );
}
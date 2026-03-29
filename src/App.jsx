import { useState, useEffect } from "react";

const TABS = ["Inventory", "Sales", "Run Summary", "Monthly Summary", "Customers"];

const formatNaira = (n) => `₦${Number(n).toLocaleString()}`;
const formatRMB = (n) => `¥${Number(n).toLocaleString()}`;

function useLocalStorage(key, initialValue) {
  const [state, setState] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {
      console.error("Failed to save to localStorage");
    }
  }, [key, state]);

  return [state, setState];
}

export default function App() {
  const [activeTab, setActiveTab] = useState("Inventory");
  const [inventory, setInventory] = useLocalStorage("sw_inventory", []);
  const [sales, setSales] = useLocalStorage("sw_sales", []);
  const [customers, setCustomers] = useLocalStorage("sw_customers", []);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({});
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const totalStock = inventory.filter((i) => i.status === "In Stock").length;
  const totalSold = sales.length;
  const totalRevenue = sales.reduce((s, i) => s + Number(i.sellingPrice || 0), 0);
  const totalCosts = sales.reduce((s, i) => s + Number(i.landingCost || 0), 0);
  const totalProfit = totalRevenue - totalCosts;

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddInventory = () => {
    if (!formData.device || !formData.imei) {
      alert("Device name and IMEI are required.");
      return;
    }
    const newItem = {
      id: Date.now(),
      ...formData,
      totalLandingCost:
        Number(formData.purchaseNaira || 0) +
        Number(formData.shippingNaira || 0) +
        Number(formData.agentFeeNaira || 0) +
        Number(formData.otherCosts || 0),
      status: "In Stock",
    };
    setInventory([...inventory, newItem]);
    setFormData({});
    setShowForm(false);
  };

  const handleAddSale = () => {
    if (!formData.imei || !formData.sellingPrice) {
      alert("IMEI and selling price are required.");
      return;
    }
    const unit = inventory.find((i) => i.imei === formData.imei);
    if (!unit) {
      alert("No inventory unit found with that IMEI. Please check and try again.");
      return;
    }
    if (unit.status === "Sold") {
      alert("This unit has already been sold.");
      return;
    }
    const newSale = {
      id: Date.now(),
      ...formData,
      device: unit.device,
      storage: unit.storage,
      landingCost: unit.totalLandingCost,
      profit: Number(formData.sellingPrice || 0) - unit.totalLandingCost,
      runNumber: unit.runNumber,
    };
    setSales([...sales, newSale]);
    setInventory(inventory.map((i) => i.imei === formData.imei ? { ...i, status: "Sold" } : i));
    if (formData.customerName && formData.customerPhone) {
      const existing = customers.find((c) => c.phone === formData.customerPhone);
      if (!existing) {
        setCustomers([...customers, {
          id: Date.now(),
          date: formData.saleDate,
          name: formData.customerName,
          phone: formData.customerPhone,
          location: formData.customerLocation || "",
          device: unit.device,
          amount: formData.sellingPrice,
          totalValue: Number(formData.sellingPrice),
          purchases: 1,
        }]);
      } else {
        setCustomers(customers.map((c) => c.phone === formData.customerPhone ? {
          ...c,
          totalValue: Number(c.totalValue) + Number(formData.sellingPrice),
          purchases: c.purchases + 1,
        } : c));
      }
    }
    setFormData({});
    setShowForm(false);
  };

  const handleDeleteInventory = (id) => {
    setInventory(inventory.filter((i) => i.id !== id));
  };

  const handleDeleteSale = (id) => {
    const sale = sales.find((s) => s.id === id);
    if (sale) {
      setInventory(inventory.map((i) => i.imei === sale.imei ? { ...i, status: "In Stock" } : i));
    }
    setSales(sales.filter((s) => s.id !== id));
  };

  const getRuns = () => {
    const runs = [...new Set(inventory.map((i) => i.runNumber).filter(Boolean))];
    return runs.sort();
  };

  const getMonths = () => {
    const months = [...new Set(sales.map((s) => {
      if (!s.saleDate) return null;
      const d = new Date(s.saleDate);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    }).filter(Boolean))];
    return months.sort().reverse();
  };

  const inputStyle = {
    background: "#ffffff10",
    border: "1px solid #ffffff20",
    borderRadius: 6,
    padding: "8px 10px",
    color: "#e8e0d0",
    fontSize: 13,
    fontFamily: "inherit",
    width: "100%",
    boxSizing: "border-box",
  };

  const labelStyle = {
    fontSize: 10,
    color: "#8899aa",
    letterSpacing: 1,
    marginBottom: 4,
    display: "block",
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0a0f",
      fontFamily: "'Georgia', serif",
      color: "#e8e0d0",
    }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
        padding: "24px 20px 0",
        borderBottom: "1px solid #e8c96020",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 36, height: 36,
                background: "linear-gradient(135deg, #e8c960, #c8a940)",
                borderRadius: 8,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 18,
              }}>📱</div>
              <div>
                <div style={{ fontSize: 20, fontWeight: "bold", color: "#e8c960", letterSpacing: 1 }}>SKY WIRELESS</div>
                <div style={{ fontSize: 11, color: "#8899aa", letterSpacing: 2 }}>BUSINESS TRACKER</div>
              </div>
            </div>
            <button
              onClick={() => setShowClearConfirm(true)}
              style={{
                background: "none", border: "1px solid #e8606030",
                borderRadius: 6, padding: "6px 12px",
                color: "#e86060", fontSize: 10, cursor: "pointer",
                letterSpacing: 1,
              }}>CLEAR DATA</button>
          </div>

          {showClearConfirm && (
            <div style={{
              background: "#e8606015", border: "1px solid #e8606040",
              borderRadius: 8, padding: 12, marginBottom: 12,
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <span style={{ fontSize: 12, color: "#e86060" }}>Delete all data permanently?</span>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => {
                  setInventory([]);
                  setSales([]);
                  setCustomers([]);
                  setShowClearConfirm(false);
                }} style={{
                  background: "#e86060", border: "none", borderRadius: 4,
                  padding: "4px 12px", color: "#fff", fontSize: 11, cursor: "pointer",
                }}>YES DELETE</button>
                <button onClick={() => setShowClearConfirm(false)} style={{
                  background: "#ffffff10", border: "none", borderRadius: 4,
                  padding: "4px 12px", color: "#8899aa", fontSize: 11, cursor: "pointer",
                }}>CANCEL</button>
              </div>
            </div>
          )}

          {/* Stats Bar */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 1,
            margin: "16px 0 0",
          }}>
            {[
              { label: "In Stock", value: totalStock, color: "#60d4e8" },
              { label: "Total Sold", value: totalSold, color: "#e8c960" },
              { label: "Revenue", value: formatNaira(totalRevenue), color: "#60e8a0" },
              { label: "Net Profit", value: formatNaira(totalProfit), color: totalProfit >= 0 ? "#60e8a0" : "#e86060" },
            ].map((s) => (
              <div key={s.label} style={{
                padding: "10px 12px",
                background: "#ffffff08",
                textAlign: "center",
              }}>
                <div style={{ fontSize: 15, fontWeight: "bold", color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 9, color: "#8899aa", marginTop: 2, letterSpacing: 1 }}>{s.label.toUpperCase()}</div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 0, marginTop: 16, overflowX: "auto" }}>
            {TABS.map((tab) => (
              <button key={tab} onClick={() => { setActiveTab(tab); setShowForm(false); setFormData({}); }} style={{
                padding: "10px 14px",
                background: "none",
                border: "none",
                borderBottom: activeTab === tab ? "2px solid #e8c960" : "2px solid transparent",
                color: activeTab === tab ? "#e8c960" : "#8899aa",
                cursor: "pointer",
                fontSize: 11,
                letterSpacing: 1,
                whiteSpace: "nowrap",
                fontFamily: "inherit",
              }}>{tab.toUpperCase()}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "20px" }}>

        {/* INVENTORY TAB */}
        {activeTab === "Inventory" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 13, color: "#8899aa" }}>{inventory.length} units · {totalStock} in stock</div>
              <button onClick={() => { setShowForm(!showForm); setFormData({}); }} style={{
                padding: "8px 16px",
                background: "linear-gradient(135deg, #e8c960, #c8a940)",
                border: "none", borderRadius: 6, color: "#0a0a0f",
                cursor: "pointer", fontSize: 12, fontWeight: "bold", letterSpacing: 1,
              }}>+ ADD UNIT</button>
            </div>

            {showForm && (
              <div style={{
                background: "#ffffff08", border: "1px solid #e8c96030",
                borderRadius: 10, padding: 20, marginBottom: 20,
              }}>
                <div style={{ fontSize: 13, color: "#e8c960", marginBottom: 16, letterSpacing: 1 }}>NEW INVENTORY ENTRY</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  {[
                    { name: "entryDate", label: "Entry Date", type: "date" },
                    { name: "device", label: "Device Name *", type: "text", placeholder: "iPhone 11 Pro Max" },
                    { name: "model", label: "Model Number", type: "text", placeholder: "A2161" },
                    { name: "storage", label: "Storage", type: "text", placeholder: "256GB" },
                    { name: "color", label: "Color", type: "text", placeholder: "Space Grey" },
                    { name: "imei", label: "IMEI Number *", type: "text", placeholder: "15 digit IMEI" },
                    { name: "condition", label: "Condition", type: "select", options: ["New", "UK Used", "Refurbished"] },
                    { name: "runNumber", label: "Run Number", type: "text", placeholder: "Run 1" },
                    { name: "purchaseRMB", label: "Purchase Price (RMB)", type: "number" },
                    { name: "purchaseNaira", label: "Purchase Price (Naira)", type: "number" },
                    { name: "shippingNaira", label: "Shipping Cost (Naira)", type: "number" },
                    { name: "agentFeeNaira", label: "Agent Fee (Naira)", type: "number" },
                    { name: "otherCosts", label: "Other Costs (Naira)", type: "number" },
                  ].map((field) => (
                    <div key={field.name} style={{ display: "flex", flexDirection: "column" }}>
                      <label style={labelStyle}>{field.label.toUpperCase()}</label>
                      {field.type === "select" ? (
                        <select name={field.name} value={formData[field.name] || ""} onChange={handleFormChange} style={inputStyle}>
                          <option value="">Select...</option>
                          {field.options.map((o) => <option key={o} value={o}>{o}</option>)}
                        </select>
                      ) : (
                        <input type={field.type} name={field.name} placeholder={field.placeholder} value={formData[field.name] || ""} onChange={handleFormChange} style={inputStyle} />
                      )}
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 16, padding: 12, background: "#e8c96015", borderRadius: 6 }}>
                  <span style={{ fontSize: 12, color: "#8899aa" }}>Total Landing Cost: </span>
                  <span style={{ fontSize: 18, color: "#e8c960", fontWeight: "bold" }}>
                    {formatNaira(
                      Number(formData.purchaseNaira || 0) +
                      Number(formData.shippingNaira || 0) +
                      Number(formData.agentFeeNaira || 0) +
                      Number(formData.otherCosts || 0)
                    )}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                  <button onClick={handleAddInventory} style={{
                    padding: "10px 20px", background: "linear-gradient(135deg, #e8c960, #c8a940)",
                    border: "none", borderRadius: 6, color: "#0a0a0f",
                    cursor: "pointer", fontSize: 12, fontWeight: "bold", letterSpacing: 1,
                  }}>SAVE UNIT</button>
                  <button onClick={() => { setShowForm(false); setFormData({}); }} style={{
                    padding: "10px 20px", background: "#ffffff10",
                    border: "1px solid #ffffff20", borderRadius: 6, color: "#8899aa",
                    cursor: "pointer", fontSize: 12, letterSpacing: 1,
                  }}>CANCEL</button>
                </div>
              </div>
            )}

            {inventory.length === 0 && !showForm && (
              <div style={{ textAlign: "center", padding: 40, color: "#8899aa", fontSize: 13, background: "#ffffff04", borderRadius: 12, border: "1px solid #ffffff08" }}>
                <div style={{ fontSize: 30, marginBottom: 12 }}>📦</div>
                No units yet. Add your first unit when your shipment arrives.
              </div>
            )}

            {inventory.map((item) => (
              <div key={item.id} style={{
                background: "#ffffff06",
                border: `1px solid ${item.status === "Sold" ? "#60e8a020" : "#e8c96030"}`,
                borderRadius: 10, padding: 16, marginBottom: 12,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontSize: 15, color: "#e8e0d0", fontWeight: "bold" }}>{item.device}</div>
                    <div style={{ fontSize: 11, color: "#8899aa", marginTop: 2 }}>{item.storage} · {item.color} · {item.model}</div>
                    <div style={{ fontSize: 10, color: "#667788", marginTop: 2 }}>IMEI: {item.imei}</div>
                  </div>
                  <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                    <div style={{
                      display: "inline-block", padding: "3px 10px", borderRadius: 20, fontSize: 10, letterSpacing: 1,
                      background: item.status === "Sold" ? "#60e8a020" : "#e8c96020",
                      color: item.status === "Sold" ? "#60e8a0" : "#e8c960",
                    }}>{item.status.toUpperCase()}</div>
                    <div style={{ fontSize: 14, color: "#e8c960" }}>{formatNaira(item.totalLandingCost)}</div>
                    <div style={{ fontSize: 9, color: "#8899aa" }}>landing cost</div>
                    {item.status === "In Stock" && (
                      <button onClick={() => handleDeleteInventory(item.id)} style={{
                        background: "none", border: "1px solid #e8606030", borderRadius: 4,
                        padding: "2px 8px", color: "#e86060", fontSize: 9, cursor: "pointer",
                      }}>REMOVE</button>
                    )}
                  </div>
                </div>
                <div style={{
                  display: "flex", gap: 16, marginTop: 12, paddingTop: 12,
                  borderTop: "1px solid #ffffff08", flexWrap: "wrap",
                }}>
                  {[
                    { label: "Purchase RMB", value: formatRMB(item.purchaseRMB || 0) },
                    { label: "Purchase ₦", value: formatNaira(item.purchaseNaira || 0) },
                    { label: "Shipping", value: formatNaira(item.shippingNaira || 0) },
                    { label: "Agent Fee", value: formatNaira(item.agentFeeNaira || 0) },
                    { label: "Run", value: item.runNumber || "—" },
                    { label: "Condition", value: item.condition || "—" },
                  ].map((d) => (
                    <div key={d.label}>
                      <div style={{ fontSize: 9, color: "#667788", letterSpacing: 1 }}>{d.label.toUpperCase()}</div>
                      <div style={{ fontSize: 12, color: "#aabbcc" }}>{d.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* SALES TAB */}
        {activeTab === "Sales" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 13, color: "#8899aa" }}>{sales.length} sales recorded</div>
              <button onClick={() => { setShowForm(!showForm); setFormData({}); }} style={{
                padding: "8px 16px",
                background: "linear-gradient(135deg, #60e8a0, #40c880)",
                border: "none", borderRadius: 6, color: "#0a0a0f",
                cursor: "pointer", fontSize: 12, fontWeight: "bold", letterSpacing: 1,
              }}>+ RECORD SALE</button>
            </div>

            {showForm && (
              <div style={{
                background: "#ffffff08", border: "1px solid #60e8a030",
                borderRadius: 10, padding: 20, marginBottom: 20,
              }}>
                <div style={{ fontSize: 13, color: "#60e8a0", marginBottom: 16, letterSpacing: 1 }}>NEW SALE ENTRY</div>
                <div style={{ marginBottom: 12, padding: 10, background: "#60d4e815", borderRadius: 6 }}>
                  <div style={{ fontSize: 10, color: "#8899aa", marginBottom: 6, letterSpacing: 1 }}>IN STOCK UNITS</div>
                  {inventory.filter(i => i.status === "In Stock").map(i => (
                    <div key={i.id} onClick={() => setFormData({ ...formData, imei: i.imei, device: i.device })}
                      style={{
                        padding: "6px 10px", marginBottom: 4, borderRadius: 4, cursor: "pointer",
                        background: formData.imei === i.imei ? "#60e8a030" : "#ffffff08",
                        border: formData.imei === i.imei ? "1px solid #60e8a060" : "1px solid transparent",
                        fontSize: 12, color: "#e8e0d0",
                      }}>
                      {i.device} · {i.storage} · IMEI: {i.imei} · Cost: {formatNaira(i.totalLandingCost)}
                    </div>
                  ))}
                  {inventory.filter(i => i.status === "In Stock").length === 0 && (
                    <div style={{ fontSize: 11, color: "#8899aa" }}>No units in stock. Add inventory first.</div>
                  )}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  {[
                    { name: "saleDate", label: "Sale Date", type: "date" },
                    { name: "sellingPrice", label: "Selling Price (Naira) *", type: "number" },
                    { name: "paymentMethod", label: "Payment Method", type: "select", options: ["Cash", "Bank Transfer", "Opay", "POS"] },
                    { name: "customerName", label: "Customer Name", type: "text" },
                    { name: "customerPhone", label: "Customer Phone", type: "text" },
                    { name: "customerLocation", label: "Customer Location", type: "text", placeholder: "Area in PH" },
                  ].map((field) => (
                    <div key={field.name} style={{ display: "flex", flexDirection: "column" }}>
                      <label style={labelStyle}>{field.label.toUpperCase()}</label>
                      {field.type === "select" ? (
                        <select name={field.name} onChange={handleFormChange} style={inputStyle}>
                          <option value="">Select...</option>
                          {field.options.map((o) => <option key={o} value={o}>{o}</option>)}
                        </select>
                      ) : (
                        <input type={field.type} name={field.name} placeholder={field.placeholder}
                          value={formData[field.name] || ""}
                          onChange={handleFormChange} style={inputStyle} />
                      )}
                    </div>
                  ))}
                </div>
                {formData.imei && formData.sellingPrice && (() => {
                  const unit = inventory.find((i) => i.imei === formData.imei);
                  const profit = unit ? Number(formData.sellingPrice) - unit.totalLandingCost : 0;
                  const margin = unit ? ((profit / unit.totalLandingCost) * 100).toFixed(1) : 0;
                  return (
                    <div style={{ marginTop: 16, padding: 12, background: profit >= 0 ? "#60e8a015" : "#e8606015", borderRadius: 6, display: "flex", justifyContent: "space-between" }}>
                      <div>
                        <span style={{ fontSize: 11, color: "#8899aa" }}>Profit: </span>
                        <span style={{ fontSize: 16, color: profit >= 0 ? "#60e8a0" : "#e86060", fontWeight: "bold" }}>{formatNaira(profit)}</span>
                      </div>
                      <div>
                        <span style={{ fontSize: 11, color: "#8899aa" }}>Margin: </span>
                        <span style={{ fontSize: 16, color: profit >= 0 ? "#60e8a0" : "#e86060", fontWeight: "bold" }}>{margin}%</span>
                      </div>
                    </div>
                  );
                })()}
                <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                  <button onClick={handleAddSale} style={{
                    padding: "10px 20px", background: "linear-gradient(135deg, #60e8a0, #40c880)",
                    border: "none", borderRadius: 6, color: "#0a0a0f",
                    cursor: "pointer", fontSize: 12, fontWeight: "bold", letterSpacing: 1,
                  }}>RECORD SALE</button>
                  <button onClick={() => { setShowForm(false); setFormData({}); }} style={{
                    padding: "10px 20px", background: "#ffffff10",
                    border: "1px solid #ffffff20", borderRadius: 6, color: "#8899aa",
                    cursor: "pointer", fontSize: 12, letterSpacing: 1,
                  }}>CANCEL</button>
                </div>
              </div>
            )}

            {sales.length === 0 && !showForm && (
              <div style={{ textAlign: "center", padding: 40, color: "#8899aa", fontSize: 13, background: "#ffffff04", borderRadius: 12, border: "1px solid #ffffff08" }}>
                <div style={{ fontSize: 30, marginBottom: 12 }}>💰</div>
                No sales yet. Record your first sale when a unit sells.
              </div>
            )}

            {sales.map((sale) => (
              <div key={sale.id} style={{
                background: "#ffffff06", border: "1px solid #60e8a020",
                borderRadius: 10, padding: 16, marginBottom: 12,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontSize: 15, color: "#e8e0d0", fontWeight: "bold" }}>{sale.device} {sale.storage}</div>
                    <div style={{ fontSize: 11, color: "#8899aa", marginTop: 2 }}>{sale.customerName || "—"} · {sale.customerPhone || "—"}</div>
                    <div style={{ fontSize: 10, color: "#667788", marginTop: 2 }}>{sale.paymentMethod || "—"} · {sale.saleDate || "—"} · {sale.runNumber || "—"}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 16, color: "#60e8a0", fontWeight: "bold" }}>{formatNaira(sale.sellingPrice)}</div>
                    <div style={{ fontSize: 11, color: "#aabbcc" }}>profit: {formatNaira(sale.profit)}</div>
                    <button onClick={() => handleDeleteSale(sale.id)} style={{
                      marginTop: 6, background: "none", border: "1px solid #e8606030", borderRadius: 4,
                      padding: "2px 8px", color: "#e86060", fontSize: 9, cursor: "pointer",
                    }}>UNDO</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* RUN SUMMARY TAB */}
        {activeTab === "Run Summary" && (
          <div>
            <div style={{ fontSize: 13, color: "#8899aa", marginBottom: 20 }}>Import run performance</div>

            {getRuns().length === 0 && (
              <div style={{ textAlign: "center", padding: 40, color: "#8899aa", fontSize: 13, background: "#ffffff04", borderRadius: 12, border: "1px solid #ffffff08" }}>
                <div style={{ fontSize: 30, marginBottom: 12 }}>📊</div>
                No runs yet. Add inventory with a Run Number to see run summaries.
              </div>
            )}

            {getRuns().map((run) => {
              const runInventory = inventory.filter((i) => i.runNumber === run);
              const runSoldIMEIs = runInventory.filter(i => i.status === "Sold").map(i => i.imei);
              const runSales = sales.filter((s) => runSoldIMEIs.includes(s.imei));
              const totalLanding = runInventory.reduce((s, i) => s + Number(i.totalLandingCost || 0), 0);
              const totalRev = runSales.reduce((s, i) => s + Number(i.sellingPrice || 0), 0);
              const grossProfit = runSales.reduce((s, i) => s + Number(i.profit || 0), 0);
              const margin = totalLanding > 0 ? ((grossProfit / totalLanding) * 100).toFixed(1) : 0;
              const totalRMB = runInventory.reduce((s, i) => s + Number(i.purchaseRMB || 0), 0);

              return (
                <div key={run} style={{
                  background: "#ffffff06", border: "1px solid #e8c96020",
                  borderRadius: 12, padding: 20, marginBottom: 16,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <div style={{ fontSize: 16, color: "#e8c960", fontWeight: "bold" }}>{run}</div>
                    <div style={{
                      padding: "4px 12px", borderRadius: 20, fontSize: 11,
                      background: "#e8c96020", color: "#e8c960", letterSpacing: 1,
                    }}>{runInventory.filter(i => i.status === "Sold").length}/{runInventory.length} SOLD</div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                    {[
                      { label: "Total Units", value: runInventory.length },
                      { label: "Units Sold", value: runSales.length },
                      { label: "In Stock", value: runInventory.filter(i => i.status === "In Stock").length },
                      { label: "Total RMB Spent", value: formatRMB(totalRMB) },
                      { label: "Total Landing Cost", value: formatNaira(totalLanding) },
                      { label: "Revenue So Far", value: formatNaira(totalRev) },
                    ].map((d) => (
                      <div key={d.label} style={{ background: "#ffffff06", borderRadius: 8, padding: 12, textAlign: "center" }}>
                        <div style={{ fontSize: 13, color: "#e8e0d0", fontWeight: "bold" }}>{d.value}</div>
                        <div style={{ fontSize: 9, color: "#8899aa", marginTop: 4, letterSpacing: 1 }}>{d.label.toUpperCase()}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{
                    marginTop: 12, padding: 12,
                    background: Number(margin) >= 30 ? "#60e8a015" : "#e8c96015",
                    borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center",
                  }}>
                    <div>
                      <div style={{ fontSize: 9, color: "#8899aa", letterSpacing: 1 }}>GROSS PROFIT</div>
                      <div style={{ fontSize: 18, fontWeight: "bold", color: grossProfit >= 0 ? "#60e8a0" : "#e86060" }}>{formatNaira(grossProfit)}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 9, color: "#8899aa", letterSpacing: 1 }}>PROFIT MARGIN</div>
                      <div style={{ fontSize: 24, fontWeight: "bold", color: Number(margin) >= 30 ? "#60e8a0" : "#e8c960" }}>{margin}%</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* MONTHLY SUMMARY TAB */}
        {activeTab === "Monthly Summary" && (
          <div>
            <div style={{ fontSize: 13, color: "#8899aa", marginBottom: 20 }}>Month by month business health</div>

            {getMonths().length === 0 && (
              <div style={{ textAlign: "center", padding: 40, color: "#8899aa", fontSize: 13, background: "#ffffff04", borderRadius: 12, border: "1px solid #ffffff08" }}>
                <div style={{ fontSize: 30, marginBottom: 12 }}>📅</div>
                No sales recorded yet. Monthly summaries appear here automatically.
              </div>
            )}

            {getMonths().map((month) => {
              const monthSales = sales.filter((s) => s.saleDate && s.saleDate.startsWith(month));
              const monthRevenue = monthSales.reduce((s, i) => s + Number(i.sellingPrice || 0), 0);
              const monthCosts = monthSales.reduce((s, i) => s + Number(i.landingCost || 0), 0);
              const monthProfit = monthRevenue - monthCosts;
              const avgProfit = monthSales.length > 0 ? monthProfit / monthSales.length : 0;
              const date = new Date(month + "-01");
              const monthName = date.toLocaleString("default", { month: "long", year: "numeric" });

              return (
                <div key={month} style={{
                  background: "#ffffff06", border: "1px solid #60d4e820",
                  borderRadius: 12, padding: 20, marginBottom: 16,
                }}>
                  <div style={{ fontSize: 15, color: "#60d4e8", marginBottom: 16, fontWeight: "bold" }}>{monthName}</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
                    {[
                      { label: "Units Sold", value: monthSales.length },
                      { label: "Total Revenue", value: formatNaira(monthRevenue) },
                      { label: "Total Costs", value: formatNaira(monthCosts) },
                      { label: "Net Profit", value: formatNaira(monthProfit) },
                      { label: "Avg Profit Per Unit", value: formatNaira(avgProfit) },
                      { label: "Profit Margin", value: monthCosts > 0 ? `${((monthProfit / monthCosts) * 100).toFixed(1)}%` : "—" },
                    ].map((d) => (
                      <div key={d.label} style={{ background: "#ffffff06", borderRadius: 8, padding: 14 }}>
                        <div style={{ fontSize: 9, color: "#8899aa", letterSpacing: 1, marginBottom: 6 }}>{d.label.toUpperCase()}</div>
                        <div style={{ fontSize: 15, color: "#e8e0d0", fontWeight: "bold" }}>{d.value}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 12, padding: 14, background: "#ffffff06", borderRadius: 8 }}>
                    <div style={{ fontSize: 10, color: "#8899aa", letterSpacing: 1, marginBottom: 10 }}>REINVESTMENT TRACKING</div>
                    <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                      {[
                        { label: "Capital Reinvested", value: "Log manually", color: "#60e8a0" },
                        { label: "Withdrawn", value: "Log manually", color: "#e8c960" },
                        { label: "Available Capital", value: formatNaira(monthProfit), color: "#60d4e8" },
                      ].map((d) => (
                        <div key={d.label}>
                          <div style={{ fontSize: 9, color: "#667788", letterSpacing: 1 }}>{d.label.toUpperCase()}</div>
                          <div style={{ fontSize: 13, color: d.color }}>{d.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* CUSTOMERS TAB */}
        {activeTab === "Customers" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 13, color: "#8899aa" }}>{customers.length} customers · your most valuable asset</div>
            </div>

            {customers.length === 0 && (
              <div style={{ textAlign: "center", padding: 40, color: "#8899aa", fontSize: 13, background: "#ffffff04", borderRadius: 12, border: "1px solid #ffffff08" }}>
                <div style={{ fontSize: 30, marginBottom: 12 }}>👥</div>
                Customers are added automatically when you record a sale with customer details.
                <div style={{ marginTop: 8, fontSize: 11, color: "#667788" }}>Every customer name and phone you collect is future revenue.</div>
              </div>
            )}

            {customers.sort((a, b) => Number(b.totalValue) - Number(a.totalValue)).map((customer) => (
              <div key={customer.id} style={{
                background: "#ffffff06", border: "1px solid #60d4e820",
                borderRadius: 10, padding: 16, marginBottom: 12,
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <div>
                  <div style={{ fontSize: 15, color: "#e8e0d0", fontWeight: "bold" }}>{customer.name}</div>
                  <div style={{ fontSize: 11, color: "#8899aa", marginTop: 2 }}>{customer.phone} · {customer.location || "—"}</div>
                  <div style={{ fontSize: 10, color: "#667788", marginTop: 2 }}>First purchase: {customer.date || "—"}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 16, color: "#60d4e8", fontWeight: "bold" }}>{formatNaira(customer.totalValue)}</div>
                  <div style={{ fontSize: 10, color: "#8899aa" }}>{customer.purchases} purchase{customer.purchases > 1 ? "s" : ""}</div>
                  {customer.purchases > 1 && (
                    <div style={{ fontSize: 9, color: "#e8c960", marginTop: 2 }}>⭐ REPEAT BUYER</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

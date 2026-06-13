import { useState, useEffect } from "react";

const PASSWORD = "interact2026";

const STATUTS = ["À contacter", "Contacté", "En négociation", "Confirmé", "Refusé"];
const NIVEAUX = ["Bronze", "Argent", "Or", "Platine", "Personnalisé"];

const STATUT_COLORS = {
  "À contacter": { bg: "#F0F4FF", text: "#4A6FA5", dot: "#4A6FA5" },
  "Contacté":    { bg: "#FFF8E6", text: "#B07A00", dot: "#F0A500" },
  "En négociation": { bg: "#F0F0FF", text: "#6A5ACD", dot: "#6A5ACD" },
  "Confirmé":    { bg: "#EDFBF4", text: "#1A7A4A", dot: "#2ECC71" },
  "Refusé":      { bg: "#FFF0F0", text: "#A00000", dot: "#E74C3C" },
};

const NIVEAU_COLORS = {
  "Bronze": "#CD7F32", "Argent": "#A8A9AD", "Or": "#D4AF37",
  "Platine": "#6BAED6", "Personnalisé": "#8B5CF6",
};

const emptyForm = {
  nom: "", contact: "", email: "", telephone: "",
  niveau: "Or", montant: "", statut: "À contacter", notes: "",
};

function generateId() { return Date.now().toString(36) + Math.random().toString(36).slice(2); }

function lsGet(key) {
  try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
}
function lsSet(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

async function sendLoginAlert({ visitorName, ip, alertEmail, emailjsServiceId, emailjsTemplateId, emailjsPublicKey }) {
  if (!alertEmail || !emailjsServiceId || !emailjsTemplateId || !emailjsPublicKey) return;
  try {
    await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id: emailjsServiceId,
        template_id: emailjsTemplateId,
        user_id: emailjsPublicKey,
        template_params: {
          to_email: alertEmail,
          visitor_name: visitorName || "Inconnu",
          visitor_ip: ip || "Non disponible",
          login_time: new Date().toLocaleString("fr-FR"),
        },
      }),
    });
  } catch (e) { console.error("EmailJS error:", e); }
}

async function getIP() {
  try {
    const r = await fetch("https://api.ipify.org?format=json");
    const d = await r.json();
    return d.ip;
  } catch { return "Inconnue"; }
}

const inp = (extra = {}) => ({
  width: "100%", boxSizing: "border-box", background: "#1E293B",
  border: "1px solid #334155", borderRadius: 10, padding: "12px 14px",
  color: "#E2E8F0", fontSize: 15, outline: "none", ...extra,
});

const labelStyle = { fontSize: 12, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 6 };

function SettingsModal({ onClose }) {
  const [vals, setVals] = useState({ alertEmail: "", emailjsServiceId: "", emailjsTemplateId: "", emailjsPublicKey: "" });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const cfg = lsGet("emailjs_config");
    if (cfg) setVals(cfg);
  }, []);

  function save() {
    lsSet("emailjs_config", vals);
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); }, 900);
  }

  const fields = [
    { key: "alertEmail", label: "Ton adresse email (alerte)", placeholder: "toi@example.com" },
    { key: "emailjsServiceId", label: "EmailJS — Service ID", placeholder: "service_xxxxxxx" },
    { key: "emailjsTemplateId", label: "EmailJS — Template ID", placeholder: "template_xxxxxxx" },
    { key: "emailjsPublicKey", label: "EmailJS — Public Key", placeholder: "xxxxxxxxxxxx" },
  ];

  return (
    <div style={{ position: "fixed", inset: 0, background: "#000A", zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "#0F172A", borderRadius: "20px 20px 0 0", padding: 24, width: "100%", maxWidth: 480, border: "1px solid #334155" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#F8FAFC" }}>⚙️ Configuration alertes</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#64748B", fontSize: 22, cursor: "pointer" }}>✕</button>
        </div>
        <div style={{ fontSize: 13, color: "#64748B", marginBottom: 18, lineHeight: 1.5 }}>
          Crée un compte sur <strong style={{ color: "#4A90D9" }}>emailjs.com</strong>, puis saisis tes clés ci-dessous.
        </div>
        {fields.map(f => (
          <div key={f.key} style={{ marginBottom: 14 }}>
            <label style={labelStyle}>{f.label}</label>
            <input value={vals[f.key]} onChange={e => setVals(p => ({ ...p, [f.key]: e.target.value }))}
              placeholder={f.placeholder} style={inp()} />
          </div>
        ))}
        <button onClick={save} style={{ width: "100%", background: saved ? "#2ECC71" : "linear-gradient(135deg,#4A90D9,#2ECC71)", border: "none", borderRadius: 12, padding: 14, color: "#fff", fontSize: 15, fontWeight: 800, cursor: "pointer", marginTop: 6 }}>
          {saved ? "✅ Sauvegardé !" : "💾 Enregistrer"}
        </button>
      </div>
    </div>
  );
}

function LoginScreen({ onSuccess }) {
  const [name, setName] = useState("");
  const [pwd, setPwd] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!name.trim()) { setError("Saisis ton prénom / nom."); return; }
    if (pwd !== PASSWORD) { setError("Mot de passe incorrect."); return; }
    setLoading(true);
    setError("");
    const ip = await getIP();
    const cfg = lsGet("emailjs_config") || {};
    await sendLoginAlert({ visitorName: name.trim(), ip, ...cfg });
    setLoading(false);
    onSuccess(name.trim());
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0F172A", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🤝</div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: "#4A90D9", textTransform: "uppercase", marginBottom: 6 }}>Mes Sponsors</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#F8FAFC" }}>Accès sécurisé</div>
        </div>
        <div style={{ background: "#1E293B", borderRadius: 16, padding: 24, border: "1px solid #334155" }}>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Ton prénom / nom</label>
            <input placeholder="Ex: Marie Martin" value={name}
              onChange={e => { setName(e.target.value); setError(""); }}
              style={inp()} onKeyDown={e => e.key === "Enter" && handleLogin()} />
          </div>
          <div style={{ marginBottom: 8 }}>
            <label style={labelStyle}>Mot de passe</label>
            <div style={{ position: "relative" }}>
              <input type={showPwd ? "text" : "password"} placeholder="••••••••" value={pwd}
                onChange={e => { setPwd(e.target.value); setError(""); }}
                style={inp({ paddingRight: 48 })} onKeyDown={e => e.key === "Enter" && handleLogin()} />
              <button onClick={() => setShowPwd(p => !p)} style={{
                position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#64748B", padding: 0,
              }}>{showPwd ? "🙈" : "👁️"}</button>
            </div>
          </div>
          {error && (
            <div style={{ background: "#FFF0F022", border: "1px solid #E74C3C44", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#E74C3C", marginBottom: 12 }}>
              {error}
            </div>
          )}
          <button onClick={handleLogin} disabled={loading} style={{
            width: "100%", background: "linear-gradient(135deg,#4A90D9,#2ECC71)", border: "none",
            borderRadius: 12, padding: 14, color: "#fff", fontSize: 15, fontWeight: 800, cursor: "pointer", marginTop: 8,
          }}>
            {loading ? "Connexion…" : "Se connecter →"}
          </button>
        </div>
        <div style={{ textAlign: "center", marginTop: 16, fontSize: 12, color: "#334155" }}>
          Chaque connexion est enregistrée avec ton nom et ton IP.
        </div>
      </div>
    </div>
  );
}

export default function SponsorsApp() {
  const [auth, setAuth] = useState(false);
  const [sponsors, setSponsors] = useState([]);
  const [view, setView] = useState("list");
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [filterStatut, setFilterStatut] = useState("Tous");
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const data = lsGet("sponsors_data");
    if (data) setSponsors(data);
  }, []);

  function persist(data) {
    lsSet("sponsors_data", data);
  }

  function openNew() { setForm(emptyForm); setSelected(null); setView("form"); }
  function openEdit(s) { setForm({ ...s }); setSelected(s); setView("form"); }
  function openDetail(s) { setSelected(s); setView("detail"); }

  function save() {
    if (!form.nom.trim()) return;
    let updated;
    if (selected) {
      updated = sponsors.map(s => s.id === selected.id ? { ...form, id: s.id } : s);
    } else {
      updated = [{ ...form, id: generateId() }, ...sponsors];
    }
    setSponsors(updated);
    persist(updated);
    setView("list");
  }

  function remove(id) {
    const updated = sponsors.filter(s => s.id !== id);
    setSponsors(updated);
    persist(updated);
    setView("list");
  }

  const filtered = sponsors.filter(s => {
    const q = search.toLowerCase();
    const matchSearch = !q || s.nom.toLowerCase().includes(q) || s.contact?.toLowerCase().includes(q);
    const matchStatut = filterStatut === "Tous" || s.statut === filterStatut;
    return matchSearch && matchStatut;
  });

  const total = sponsors.filter(s => s.statut === "Confirmé")
    .reduce((sum, s) => sum + (parseFloat(s.montant) || 0), 0);

  if (!auth) return <LoginScreen onSuccess={() => setAuth(true)} />;

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: "#0F172A", minHeight: "100vh", maxWidth: 480, margin: "0 auto", color: "#E2E8F0", position: "relative", paddingBottom: 80 }}>
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}

      <div style={{ background: "linear-gradient(135deg, #1E293B 0%, #0F172A 100%)", borderBottom: "1px solid #1E293B", padding: "20px 20px 16px" }}>
        {view !== "list" && (
          <button onClick={() => setView("list")} style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer", padding: "0 0 12px", fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}>
            ← Retour
          </button>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: "#4A90D9", textTransform: "uppercase", marginBottom: 4 }}>Mes Sponsors</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#F8FAFC", letterSpacing: -0.5 }}>
              {view === "list" ? "Tableau de bord" : view === "form" ? (selected ? "Modifier" : "Nouveau sponsor") : selected?.nom}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
            {view === "list" && (
              <>
                <button onClick={() => setShowSettings(true)} style={{ background: "#1E293B", border: "1px solid #334155", borderRadius: 8, padding: "6px 10px", color: "#94A3B8", fontSize: 14, cursor: "pointer" }}>⚙️</button>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 11, color: "#64748B", marginBottom: 2 }}>Confirmés</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#2ECC71" }}>
                    {total >= 1000 ? `${(total/1000).toFixed(1)}k` : total.toLocaleString("fr")} TND
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {view === "list" && (
          <div style={{ display: "flex", gap: 8, marginTop: 16, overflowX: "auto", paddingBottom: 2 }}>
            {["Tous", ...STATUTS].map(st => {
              const count = st === "Tous" ? sponsors.length : sponsors.filter(s => s.statut === st).length;
              const active = filterStatut === st;
              return (
                <button key={st} onClick={() => setFilterStatut(st)} style={{
                  flexShrink: 0, background: active ? "#4A90D9" : "#1E293B", border: active ? "1px solid #4A90D9" : "1px solid #334155",
                  borderRadius: 20, padding: "5px 12px", color: active ? "#fff" : "#94A3B8",
                  fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
                }}>
                  {st} {count > 0 && <span style={{ opacity: 0.7 }}>({count})</span>}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {view === "list" && (
        <div style={{ padding: "16px 16px 0" }}>
          <input placeholder="🔍  Rechercher un sponsor…" value={search} onChange={e => setSearch(e.target.value)} style={inp({ marginBottom: 16 })} />
          {filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "48px 24px", color: "#475569" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🤝</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: "#64748B" }}>Aucun sponsor ici</div>
              <div style={{ fontSize: 14, marginTop: 6 }}>Ajoute ton premier sponsor ci-dessous</div>
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.map(s => {
              const sc = STATUT_COLORS[s.statut] || STATUT_COLORS["À contacter"];
              return (
                <div key={s.id} onClick={() => openDetail(s)} style={{ background: "#1E293B", borderRadius: 14, padding: "14px 16px", border: "1px solid #334155", cursor: "pointer" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 16, color: "#F1F5F9" }}>{s.nom}</div>
                      {s.contact && <div style={{ fontSize: 13, color: "#64748B", marginTop: 2 }}>{s.contact}</div>}
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 12 }}>
                      {s.montant && <div style={{ fontWeight: 700, fontSize: 15, color: NIVEAU_COLORS[s.niveau] || "#94A3B8" }}>{parseFloat(s.montant).toLocaleString("fr")} TND</div>}
                      <div style={{ fontSize: 11, fontWeight: 700, color: NIVEAU_COLORS[s.niveau] || "#94A3B8", textTransform: "uppercase", letterSpacing: 1 }}>{s.niveau}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: sc.dot }} />
                    <div style={{ fontSize: 12, fontWeight: 600, color: sc.dot }}>{s.statut}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {view === "detail" && selected && (() => {
        const s = sponsors.find(x => x.id === selected.id) || selected;
        const sc = STATUT_COLORS[s.statut] || STATUT_COLORS["À contacter"];
        return (
          <div style={{ padding: 16 }}>
            <div style={{ background: "#1E293B", borderRadius: 16, overflow: "hidden", border: "1px solid #334155" }}>
              <div style={{ background: `linear-gradient(135deg, ${NIVEAU_COLORS[s.niveau] || "#4A90D9"}22, #1E293B)`, padding: "20px 20px 16px", borderBottom: "1px solid #334155" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  {s.montant && <div style={{ fontSize: 32, fontWeight: 800, color: NIVEAU_COLORS[s.niveau] || "#4A90D9" }}>{parseFloat(s.montant).toLocaleString("fr")} TND</div>}
                  <span style={{ background: sc.bg, color: sc.text, padding: "6px 14px", borderRadius: 20, fontSize: 13, fontWeight: 700 }}>{s.statut}</span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: NIVEAU_COLORS[s.niveau] || "#94A3B8", textTransform: "uppercase", letterSpacing: 1.5, marginTop: 4 }}>{s.niveau}</div>
              </div>
              {[{ label: "Contact", value: s.contact }, { label: "Email", value: s.email }, { label: "Téléphone", value: s.telephone }, { label: "Notes", value: s.notes }].filter(f => f.value).map(f => (
                <div key={f.label} style={{ padding: "14px 20px", borderBottom: "1px solid #0F172A" }}>
                  <div style={{ fontSize: 11, color: "#64748B", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>{f.label}</div>
                  <div style={{ fontSize: 15, color: "#CBD5E1", lineHeight: 1.5 }}>{f.value}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button onClick={() => openEdit(s)} style={{ flex: 1, background: "#4A90D9", border: "none", borderRadius: 12, padding: 14, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>✏️ Modifier</button>
              <button onClick={() => { if (confirm("Supprimer ce sponsor ?")) remove(s.id); }} style={{ background: "#1E293B", border: "1px solid #E74C3C", borderRadius: 12, padding: "14px 18px", color: "#E74C3C", fontSize: 15, cursor: "pointer" }}>🗑</button>
            </div>
          </div>
        );
      })()}

      {view === "form" && (
        <div style={{ padding: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { label: "Nom du sponsor *", key: "nom", placeholder: "Ex: Décathlon" },
              { label: "Nom du contact", key: "contact", placeholder: "Ex: Jean Dupont" },
              { label: "Email", key: "email", placeholder: "jean@sponsor.com", type: "email" },
              { label: "Téléphone", key: "telephone", placeholder: "+216 …", type: "tel" },
            ].map(f => (
              <div key={f.key}>
                <label style={labelStyle}>{f.label}</label>
                <input type={f.type || "text"} placeholder={f.placeholder} value={form[f.key]}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} style={inp()} />
              </div>
            ))}
            <div>
              <label style={labelStyle}>Niveau</label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {NIVEAUX.map(n => (
                  <button key={n} onClick={() => setForm(p => ({ ...p, niveau: n }))} style={{
                    padding: "8px 14px", borderRadius: 20,
                    border: form.niveau === n ? `2px solid ${NIVEAU_COLORS[n]}` : "2px solid #334155",
                    background: form.niveau === n ? `${NIVEAU_COLORS[n]}22` : "#1E293B",
                    color: form.niveau === n ? NIVEAU_COLORS[n] : "#64748B", fontSize: 13, fontWeight: 700, cursor: "pointer",
                  }}>{n}</button>
                ))}
              </div>
            </div>
            <div>
              <label style={labelStyle}>Montant (TND)</label>
              <input type="number" placeholder="Ex: 500" value={form.montant}
                onChange={e => setForm(p => ({ ...p, montant: e.target.value }))} style={inp()} />
            </div>
            <div>
              <label style={labelStyle}>Statut</label>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {STATUTS.map(st => {
                  const sc = STATUT_COLORS[st];
                  return (
                    <button key={st} onClick={() => setForm(p => ({ ...p, statut: st }))} style={{
                      padding: "11px 16px", borderRadius: 10,
                      border: form.statut === st ? `2px solid ${sc.dot}` : "2px solid #334155",
                      background: form.statut === st ? `${sc.dot}18` : "#1E293B",
                      color: form.statut === st ? sc.dot : "#64748B", fontSize: 14, fontWeight: 600, cursor: "pointer",
                      textAlign: "left", display: "flex", alignItems: "center", gap: 10,
                    }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: sc.dot, flexShrink: 0 }} />
                      {st}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label style={labelStyle}>Notes</label>
              <textarea rows={4} placeholder="Informations complémentaires…" value={form.notes}
                onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                style={inp({ resize: "vertical" })} />
            </div>
            <button onClick={save} disabled={!form.nom.trim()} style={{
              background: form.nom.trim() ? "linear-gradient(135deg,#4A90D9,#2ECC71)" : "#334155",
              border: "none", borderRadius: 12, padding: 15, color: "#fff", fontSize: 16, fontWeight: 800,
              cursor: form.nom.trim() ? "pointer" : "not-allowed", marginTop: 8,
            }}>
              {selected ? "💾 Enregistrer" : "✅ Ajouter le sponsor"}
            </button>
          </div>
        </div>
      )}

      {view === "list" && (
        <button onClick={openNew} style={{
          position: "fixed", bottom: 24, right: "calc(50% - 228px)", width: 56, height: 56,
          background: "linear-gradient(135deg,#4A90D9,#2ECC71)", border: "none", borderRadius: "50%",
          color: "#fff", fontSize: 28, cursor: "pointer", boxShadow: "0 4px 24px #4A90D955",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100,
        }}>+</button>
      )}
    </div>
  );
}

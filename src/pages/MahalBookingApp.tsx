import React, { useState, useEffect, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";

// ── API Base URL ──────────────────────────────────────────────
// Change to your PC's IP when testing on phone (e.g. http://192.168.1.x:4000/api)
const API = "http://localhost:4000/api";

// ── Constants ─────────────────────────────────────────────────
const HALLS       = ["Grand Hall", "Rose Hall", "Mini Hall", "Jasmine Hall"];
const EVENT_TYPES = ["Wedding", "Reception", "Engagement", "Birthday", "Anniversary", "Corporate"];
const MONTHS      = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const PCOLS       = ["#d4a017","#22c55e","#ef4444","#818cf8","#f59e0b","#06b6d4"];

// ── TypeScript Interfaces ─────────────────────────────────────
interface Booking {
  id: string;
  name: string;
  phone: string;
  date: string;
  time: string;
  eventType: string;
  hall: string;
  status: "confirmed" | "pending" | "cancelled";
  paymentStatus: "paid" | "unpaid" | "partial";
  rent: number;
  radioSet: number;
  cleaning: number;
  electricity: number;
  gas: number;
  generator: number;
  advance: number;
  discount: number;
}

type Page = "dashboard" | "bookings" | "bookingDetails" | "payment" | "preview" | "calendar" | "reports";

interface BadgeCfg {
  bg: string;
  color: string;
  label: string;
}

// ── Helpers ───────────────────────────────────────────────────
const calcTotal   = (b: Booking) => (b.rent||0)+(b.radioSet||0)+(b.cleaning||0)+(b.electricity||0)+(b.gas||0)+(b.generator||0);
const calcBalance = (b: Booking) => calcTotal(b)-(b.advance||0)-(b.discount||0);
const fmt         = (n: number) => "₹"+Number(n).toLocaleString("en-IN");
const fmtDate     = (d: string) => new Date(d+"T00:00:00").toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"});

const shareWhatsApp = (bk: Booking) => {
  const msg = `🏛️ *MAHAL BOOKING CONFIRMATION*\n\n*ID:* ${bk.id}\n*Name:* ${bk.name}\n*Event:* ${bk.eventType}\n*Date:* ${fmtDate(bk.date)} at ${bk.time}\n*Hall:* ${bk.hall}\n\n💰 *PAYMENT*\nRent: ${fmt(bk.rent)} | Radio: ${fmt(bk.radioSet)}\nCleaning: ${fmt(bk.cleaning)} | Electricity: ${fmt(bk.electricity)}\nGas: ${fmt(bk.gas)} | Generator: ${fmt(bk.generator)}\n\n*Total: ${fmt(calcTotal(bk))}*\n*Advance: ${fmt(bk.advance)}* | Discount: ${fmt(bk.discount)}\n*Balance Due: ${fmt(calcBalance(bk))}*\n\n🙏 Thank you for choosing us!`;
  window.open("https://wa.me/91"+bk.phone+"?text="+encodeURIComponent(msg),"_blank");
};

const downloadPDF = (bk: Booking) => {
  const w = window.open("","_blank");
  if (!w) return;
  const total = calcTotal(bk), bal = calcBalance(bk);
  w.document.write(`<!DOCTYPE html><html><head><title>Invoice ${bk.id}</title>
  <style>body{font-family:Georgia,serif;padding:40px;max-width:600px;margin:0 auto;color:#1a1a2e}h1{color:#8B0000;border-bottom:3px solid #d4a017;padding-bottom:12px}h3{color:#5a3a0a;border-bottom:1px solid #d4a01744;padding-bottom:4px}.row{display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px dotted #ddd;font-size:14px}.bold{font-weight:bold}.gold{color:#8B6914}.green{color:#166534}.red{color:#991b1b}.footer{text-align:center;color:#999;font-size:11px;margin-top:30px;border-top:1px solid #eee;padding-top:12px}</style>
  </head><body>
  <h1>🏛️ MAHAL BOOKING INVOICE</h1>
  <p style="color:#666;font-size:13px">Booking ID: <strong>${bk.id}</strong> &nbsp;|&nbsp; Generated: ${new Date().toLocaleDateString("en-IN")}</p>
  <h3>BOOKING DETAILS</h3>
  ${[["Customer",bk.name],["Phone","+91 "+bk.phone],["Event",bk.eventType],["Hall",bk.hall],["Date",fmtDate(bk.date)],["Time",bk.time],["Status",bk.status.toUpperCase()]].map(([l,v])=>`<div class="row"><span>${l}</span><span class="bold">${v}</span></div>`).join("")}
  <h3>PAYMENT BREAKDOWN</h3>
  ${[["Mahal Rent",bk.rent],["Radio Set",bk.radioSet],["Cleaning",bk.cleaning],["Electricity",bk.electricity],["Gas",bk.gas],["Generator",bk.generator]].map(([l,v])=>`<div class="row"><span>${l}</span><span>${fmt(Number(v))}</span></div>`).join("")}
  <div class="row bold gold"><span>TOTAL AMOUNT</span><span>${fmt(total)}</span></div>
  <div class="row green"><span>Advance Paid</span><span>${fmt(bk.advance)}</span></div>
  <div class="row" style="color:#1d4ed8"><span>Discount</span><span>${fmt(bk.discount)}</span></div>
  <div class="row bold red" style="font-size:16px"><span>BALANCE DUE</span><span>${fmt(bal)}</span></div>
  <div class="footer"><p>Computer-generated invoice.</p></div>
  <script>setTimeout(()=>window.print(),300)</script></body></html>`);
  w.document.close();
};

// ── Theme ─────────────────────────────────────────────────────
const C = {
  bg:"#09090f", card:"#111120", card2:"#161625",
  accent:"#d4a017", muted:"#8888aa", text:"#e0e0f0",
  border:"#ffffff0d", border2:"#ffffff14",
  green:"#22c55e", orange:"#f59e0b", red:"#ef4444", blue:"#818cf8",
};

const S: Record<string, React.CSSProperties> = {
  page:    { flex:1, overflowY:"auto", paddingBottom:90, background:C.bg },
  hdr:     { background:C.card, borderBottom:"1px solid "+C.border2, padding:"13px 16px", display:"flex", alignItems:"center", gap:10, position:"sticky", top:0, zIndex:10 },
  hTitle:  { fontSize:17, fontWeight:700, color:C.text, flex:1 },
  card:    { background:C.card, borderRadius:16, padding:16, marginBottom:12, border:"1px solid "+C.border },
  label:   { fontSize:12, color:C.muted, marginBottom:4, display:"block" },
  input:   { width:"100%", background:"#1a1a2e", border:"1px solid #ffffff1a", borderRadius:10, padding:"11px 14px", color:C.text, fontSize:14, outline:"none", boxSizing:"border-box" },
  btn:     { background:"linear-gradient(135deg,#c9860a,#d4a017)", color:"#0a0805", padding:14, borderRadius:14, fontSize:16, fontWeight:800, border:"none", cursor:"pointer", width:"100%", letterSpacing:0.5 },
  btnO:    { background:"transparent", color:C.accent, padding:11, borderRadius:14, fontSize:14, fontWeight:600, border:"1px solid #d4a01766", cursor:"pointer", flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:6 },
  tabs:    { position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:430, background:C.card, borderTop:"1px solid "+C.border2, display:"flex", zIndex:20 },
  tab:     { flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"8px 0", cursor:"pointer", gap:2, background:"none", border:"none" },
  backBtn: { background:"none", border:"none", color:C.accent, cursor:"pointer", fontSize:24, padding:"0 4px", lineHeight:1, display:"flex", alignItems:"center", fontWeight:700 },
};

const BADGE: Record<string, BadgeCfg> = {
  confirmed:{ bg:"#052e16", color:"#22c55e", label:"Confirmed" },
  pending:  { bg:"#1c1200", color:"#f59e0b", label:"Pending"   },
  cancelled:{ bg:"#2d0a0a", color:"#ef4444", label:"Cancelled" },
  paid:     { bg:"#052e16", color:"#22c55e", label:"Paid"      },
  unpaid:   { bg:"#2d0a0a", color:"#ef4444", label:"Unpaid"    },
  partial:  { bg:"#1c1a00", color:"#eab308", label:"Partial"   },
};

// ── Shared Components ─────────────────────────────────────────
const BackBtn = ({ navigate }: { navigate: (p: Page) => void }) => (
  <button style={S.backBtn} onClick={() => navigate("dashboard")} title="Back">←</button>
);

const StatusBadge = ({ status }: { status: string }) => {
  const cfg: BadgeCfg = BADGE[status] || { bg:"#1e1e30", color:C.muted, label:status };
  return (
    <span style={{ background:cfg.bg, color:cfg.color, padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:700, border:`1px solid ${cfg.color}33`, letterSpacing:0.4 }}>
      {cfg.label}
    </span>
  );
};

const BookingCard = ({ booking:b, onDetails }: { booking:Booking; onDetails:(b:Booking)=>void }) => {
  const total = calcTotal(b), balance = calcBalance(b);
  return (
    <div style={{ ...S.card, cursor:"pointer" }} onClick={() => onDetails(b)}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
        <div>
          <div style={{ fontSize:15, fontWeight:700, color:"#f0f0fa" }}>{b.name}</div>
          <div style={{ fontSize:11, color:C.muted, marginTop:1 }}>{b.id} · {b.eventType}</div>
        </div>
        <div style={{ textAlign:"right" }}>
          <div style={{ fontSize:14, fontWeight:700, color:C.accent }}>{fmt(total)}</div>
          <div style={{ fontSize:11, color:balance>0?C.red:C.green, marginTop:1 }}>Bal: {fmt(balance)}</div>
        </div>
      </div>
      <div style={{ display:"flex", gap:10, marginBottom:9, flexWrap:"wrap" }}>
        <span style={{ fontSize:12, color:C.muted }}>📅 {fmtDate(b.date)}</span>
        <span style={{ fontSize:12, color:C.muted }}>🕐 {b.time}</span>
        <span style={{ fontSize:12, color:C.muted }}>🏛 {b.hall}</span>
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ display:"flex", gap:6 }}>
          <StatusBadge status={b.status} />
          <StatusBadge status={b.paymentStatus} />
        </div>
        <button
          onClick={e=>{e.stopPropagation();onDetails(b);}}
          style={{ background:"#1e1e35", color:C.accent, padding:"4px 12px", borderRadius:8, fontSize:12, border:"1px solid #d4a01733", cursor:"pointer" }}
        >View →</button>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
//  LOGIN  ← FIXED: proper validation + Enter key support
// ═══════════════════════════════════════════════════════════
const ADMIN_EMAIL    = "admin@mahal.com";
const ADMIN_PASSWORD = "mahal123"; // Change this to your password

const LoginPage = ({ onLogin }: { onLogin: () => void }) => {
  const [email, setEmail] = useState("");
  const [pass,  setPass]  = useState("");
  const [err,   setErr]   = useState("");
  const [loading, setLoading] = useState(false);

  const go = () => {
    setErr("");
    if (!email) { setErr("Please enter email"); return; }
    if (!pass)  { setErr("Please enter password"); return; }
    // ── FIX: actual credential check ──
    if (email === ADMIN_EMAIL && pass === ADMIN_PASSWORD) {
      setLoading(true);
      setTimeout(() => { setLoading(false); onLogin(); }, 600);
    } else {
      setErr("Invalid email or password");
    }
  };

  return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:28 }}>
      <div style={{ marginBottom:36, textAlign:"center" }}>
        <div style={{ fontSize:56, marginBottom:10 }}>🏛️</div>
        <div style={{ fontSize:30, fontWeight:800, color:C.accent, letterSpacing:2 }}>Piriyam</div>
        {/* <div style={{ fontSize:12, color:C.muted, letterSpacing:3, marginTop:4 }}>BOOKING MANAGEMENT</div> */}
      </div>
      <div style={{ width:"100%", maxWidth:360 }}>
        <div style={{ marginBottom:14 }}>
          <label style={S.label}>Email Address</label>
          <input
            style={S.input}
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="admin@mahal.com"
            onKeyDown={e => e.key==="Enter" && go()}
            autoComplete="email"
          />
        </div>
        <div style={{ marginBottom:18 }}>
          <label style={S.label}>Password</label>
          <input
            style={S.input}
            type="password"
            value={pass}
            onChange={e => setPass(e.target.value)}
            placeholder="Enter password"
            onKeyDown={e => e.key==="Enter" && go()}
            autoComplete="current-password"
          />
        </div>
        {err && (
          <div style={{ color:C.red, fontSize:13, marginBottom:12, textAlign:"center", background:"#2d0a0a", padding:"8px 14px", borderRadius:10, border:"1px solid #ef444433" }}>
            ⚠️ {err}
          </div>
        )}
        <button style={{ ...S.btn, opacity: loading?0.7:1 }} onClick={go} disabled={loading}>
          {loading ? "⏳ Signing in..." : "SIGN IN"}
        </button>
        <div style={{ textAlign:"center", marginTop:12, fontSize:12, color:"#444466" }}>
          {/* Default: admin@mahal.com / mahal123 */}
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
//  DASHBOARD
// ═══════════════════════════════════════════════════════════
const DashboardPage = ({
  bookings, navigate, onLogout
}: { bookings:Booking[]; navigate:(p:Page,d?:Booking|null)=>void; onLogout:()=>void }) => {
  const today    = new Date().toISOString().split("T")[0];
  const todayBks = bookings.filter(b => b.date === today);
  const todayRev = todayBks.reduce((s,b) => s+b.advance, 0);
  const confirmed= bookings.filter(b => b.status==="confirmed").length;
  const pending  = bookings.filter(b => b.status==="pending").length;

  const stats = [
    { icon:"💰", label:"Today Revenue",  val:fmt(todayRev), color:C.accent },
    { icon:"📅", label:"Today Bookings", val:String(todayBks.length), color:C.green },
    { icon:"✅", label:"Confirmed",       val:String(confirmed), color:C.blue },
    { icon:"⏳", label:"Pending",         val:String(pending),   color:C.orange },
  ];

  const chartData = useMemo(() => {
    const byMo: Record<string,{revenue:number;bookings:number}> = {};
    bookings.forEach(b => {
      const key = b.date?.slice(0,7);
      if (!key) return;
      if (!byMo[key]) byMo[key] = { revenue:0, bookings:0 };
      byMo[key].revenue  += calcTotal(b);
      byMo[key].bookings += 1;
    });
    return Object.entries(byMo).sort(([a],[b])=>a.localeCompare(b)).slice(-7)
      .map(([k,v]) => ({ month: MONTHS[parseInt(k.slice(5))-1], ...v }));
  }, [bookings]);

  return (
    <div style={S.page}>
      <div style={S.hdr}>
        <span style={{ fontSize:22 }}>🏛️</span>
        <span style={S.hTitle}>Dashboard</span>
        <span style={{ fontSize:12, color:C.muted, marginRight:8 }}>{new Date().toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}</span>
        <button onClick={onLogout} style={{ background:"#2d0a0a", color:C.red, border:"1px solid #ef444433", borderRadius:8, padding:"5px 10px", fontSize:12, fontWeight:700, cursor:"pointer" }}>
          ⏻ Logout
        </button>
      </div>
      <div style={{ padding:"14px 16px 0" }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
          {stats.map((s,i) => (
            <div key={i} style={{ background:C.card, borderRadius:14, padding:14, border:"1px solid "+C.border }}>
              <div style={{ fontSize:24, marginBottom:6 }}>{s.icon}</div>
              <div style={{ fontSize:22, fontWeight:800, color:s.color }}>{s.val}</div>
              <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{s.label}</div>
            </div>
          ))}
        </div>
        <div style={S.card}>
          <div style={{ fontSize:12, fontWeight:700, color:C.text, marginBottom:12, letterSpacing:0.5 }}>Monthly Revenue</div>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={chartData} margin={{top:0,right:0,bottom:0,left:0}}>
              <XAxis dataKey="month" tick={{fill:C.muted,fontSize:11}} axisLine={false} tickLine={false}/>
              <YAxis hide/>
              <Tooltip contentStyle={{background:"#1a1a2e",border:"1px solid #ffffff1a",borderRadius:8,color:C.text,fontSize:12}} formatter={(v:any)=>[fmt(v),"Revenue"]}/>
              <Bar dataKey="revenue" fill={C.accent} radius={[5,5,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ fontSize:13, fontWeight:700, color:C.text, marginBottom:10 }}>Recent Bookings</div>
        {bookings.slice(0,4).map(b => <BookingCard key={b.id} booking={b} onDetails={bk=>navigate("bookingDetails",bk)}/>)}
        <button style={{ ...S.btnO, width:"100%", marginBottom:4 }} onClick={()=>navigate("bookings")}>View All Bookings →</button>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
//  BOOKINGS
// ═══════════════════════════════════════════════════════════
const BookingsPage = ({
  bookings, navigate
}: { bookings:Booking[]; navigate:(p:Page,d?:Booking|null)=>void }) => {
  const [q,  setQ]  = useState("");
  const [sf, setSf] = useState("all");
  const [pf, setPf] = useState("all");

  const list = useMemo(() => bookings.filter(b => {
    const ms = !q || b.name.toLowerCase().includes(q.toLowerCase()) || b.phone.includes(q);
    return ms && (sf==="all"||b.status===sf) && (pf==="all"||b.paymentStatus===pf);
  }), [bookings,q,sf,pf]);

  const chip = (val:string, cur:string, set:(v:string)=>void, label:string) => (
    <button key={val} onClick={()=>set(cur===val?"all":val)}
      style={{ background:cur===val?C.accent:"#1a1a2e", color:cur===val?"#0a0805":C.muted, padding:"5px 13px", borderRadius:20, fontSize:12, border:"1px solid #ffffff1a", cursor:"pointer", fontWeight:cur===val?700:400, whiteSpace:"nowrap" }}>
      {label}
    </button>
  );

  return (
    <div style={S.page}>
      <div style={S.hdr}>
        <BackBtn navigate={navigate as (p:Page)=>void}/>
        <span style={S.hTitle}>Bookings ({list.length})</span>
        <button style={{ background:C.accent, color:"#0a0805", border:"none", borderRadius:10, padding:"6px 14px", fontSize:13, fontWeight:800, cursor:"pointer" }} onClick={()=>navigate("payment")}>+ New</button>
      </div>
      <div style={{ padding:"12px 16px 0" }}>
        <div style={{ position:"relative", marginBottom:10 }}>
          <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", fontSize:15 }}>🔍</span>
          <input style={{ ...S.input, paddingLeft:38 }} value={q} onChange={e=>setQ(e.target.value)} placeholder="Search name or phone..."/>
          {q && <button onClick={()=>setQ("")} style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:C.muted, cursor:"pointer", fontSize:15 }}>✕</button>}
        </div>
        <div style={{ display:"flex", gap:6, overflowX:"auto", paddingBottom:8, marginBottom:10 }}>
          {chip("confirmed",sf,setSf,"✓ Confirmed")}
          {chip("pending",  sf,setSf,"⏳ Pending")}
          {chip("cancelled",sf,setSf,"✕ Cancelled")}
          {chip("paid",    pf,setPf,"💚 Paid")}
          {chip("unpaid",  pf,setPf,"🔴 Unpaid")}
          {chip("partial", pf,setPf,"🟡 Partial")}
        </div>
        {!list.length
          ? <div style={{ textAlign:"center", padding:"48px 0", color:C.muted }}><div style={{ fontSize:40, marginBottom:8 }}>📋</div><div>No bookings found</div></div>
          : list.map(b => <BookingCard key={b.id} booking={b} onDetails={bk=>navigate("bookingDetails",bk)}/>)
        }
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
//  BOOKING DETAILS
// ═══════════════════════════════════════════════════════════
const BookingDetailsPage = ({
  booking:bk, navigate
}: { booking:Booking|null; navigate:(p:Page)=>void }) => {
  if (!bk) return null;
  const total = calcTotal(bk), balance = calcBalance(bk);
  const row = (l:string, v:string, c?:string) => (
    <div style={{ display:"flex", justifyContent:"space-between", padding:"9px 0", borderBottom:"1px solid #ffffff08" }}>
      <span style={{ fontSize:13, color:C.muted }}>{l}</span>
      <span style={{ fontSize:13, fontWeight:700, color:c||C.text }}>{v}</span>
    </div>
  );
  return (
    <div style={S.page}>
      <div style={S.hdr}>
        <BackBtn navigate={navigate}/>
        <span style={S.hTitle}>{bk.name}</span>
        <span style={{ fontSize:11, color:C.muted }}>{bk.id}</span>
      </div>
      <div style={{ padding:16 }}>
        <div style={{ ...S.card, background:"linear-gradient(135deg,#1a1520,#1e1a30)", marginBottom:14 }}>
          <div style={{ fontSize:22, fontWeight:800, color:"#f0f0fa", marginBottom:3 }}>{bk.name}</div>
          <div style={{ fontSize:13, color:C.muted, marginBottom:10 }}>📞 +91 {bk.phone}</div>
          <div style={{ display:"flex", gap:6 }}><StatusBadge status={bk.status}/><StatusBadge status={bk.paymentStatus}/></div>
        </div>
        <div style={S.card}>
          <div style={{ fontSize:11, fontWeight:700, color:C.accent, marginBottom:8, letterSpacing:1 }}>EVENT DETAILS</div>
          {row("Event Type", bk.eventType)}
          {row("Hall", bk.hall)}
          {row("Date", fmtDate(bk.date))}
          {row("Time", bk.time)}
        </div>
        <div style={S.card}>
          <div style={{ fontSize:11, fontWeight:700, color:C.accent, marginBottom:8, letterSpacing:1 }}>PAYMENT BREAKDOWN</div>
          {row("Mahal Rent",  fmt(bk.rent))}
          {row("Radio Set",   fmt(bk.radioSet))}
          {row("Cleaning",    fmt(bk.cleaning))}
          {row("Electricity", fmt(bk.electricity))}
          {row("Gas",         fmt(bk.gas))}
          {row("Generator",   fmt(bk.generator))}
          <div style={{ marginTop:8 }}>
            {row("TOTAL",       fmt(total),           C.accent)}
            {row("Advance",     fmt(bk.advance),      C.green)}
            {row("Discount",    fmt(bk.discount),     C.blue)}
            {row("BALANCE DUE", fmt(balance),         balance>0?C.red:C.green)}
          </div>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <button style={S.btnO} onClick={()=>shareWhatsApp(bk)}>💬 WhatsApp</button>
          <button style={S.btnO} onClick={()=>downloadPDF(bk)}>📄 PDF</button>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
//  NEW BOOKING
// ═══════════════════════════════════════════════════════════
type BookingDraft = Omit<Booking,"id"|"status"|"paymentStatus">;

const PaymentPage = ({
  navigate, onSave
}: { navigate:(p:Page)=>void; onSave:(b:Booking)=>void }) => {
  const blank: BookingDraft = { name:"", phone:"", date:"", time:"", eventType:"Wedding", hall:"Grand Hall", rent:0, radioSet:0, cleaning:0, electricity:0, gas:0, generator:0, advance:0, discount:0 };
  const [f, setF] = useState<BookingDraft>(blank);
  const set    = (k: keyof BookingDraft, v: string) => setF(x => ({...x, [k]: v}));
  const setNum = (k: keyof BookingDraft, v: string) => setF(x => ({...x, [k]: Number(v)||0}));
  const total   = calcTotal(f as Booking);
  const balance = calcBalance(f as Booking);

  const go = () => {
    if (!f.name||!f.phone||!f.date) { alert("Name, Phone & Date are required"); return; }
    const booking: Booking = {
      ...f,
      id: "BK"+String(Date.now()).slice(-6),
      status: "pending",
      paymentStatus: f.advance >= total ? "paid" : f.advance > 0 ? "partial" : "unpaid",
    };
    onSave(booking);
    navigate("preview");
  };

  return (
    <div style={S.page}>
      <div style={S.hdr}>
        <BackBtn navigate={navigate}/>
        <span style={S.hTitle}>New Booking</span>
      </div>
      <div style={{ padding:16 }}>
        <div style={S.card}>
          <div style={{ fontSize:11, fontWeight:700, color:C.accent, marginBottom:12, letterSpacing:1 }}>BASIC INFORMATION</div>
          {([ ["Customer Name","name","text"], ["Phone Number","phone","tel"], ["Event Date","date","date"], ["Event Time","time","time"] ] as [string,keyof BookingDraft,string][]).map(([l,k,t]) => (
            <div key={k} style={{ marginBottom:13 }}>
              <label style={S.label}>{l}</label>
              <input style={S.input} type={t} value={String(f[k]||"")} onChange={e=>set(k,e.target.value)} placeholder={l}/>
            </div>
          ))}
          {([ ["Event Type","eventType",EVENT_TYPES], ["Hall","hall",HALLS] ] as [string,keyof BookingDraft,string[]][]).map(([l,k,opts]) => (
            <div key={k} style={{ marginBottom:13 }}>
              <label style={S.label}>{l}</label>
              <select style={S.input} value={String(f[k])} onChange={e=>set(k,e.target.value)}>
                {opts.map(o=><option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          ))}
        </div>
        <div style={S.card}>
          <div style={{ fontSize:11, fontWeight:700, color:C.accent, marginBottom:12, letterSpacing:1 }}>PAYMENT ITEMS (₹)</div>
          {([ ["Mahal Rent","rent"], ["Radio Set","radioSet"], ["Cleaning","cleaning"], ["Electricity","electricity"], ["Gas","gas"], ["Generator","generator"] ] as [string,keyof BookingDraft][]).map(([l,k]) => (
            <div key={k} style={{ marginBottom:12 }}>
              <label style={S.label}>{l}</label>
              <input style={S.input} type="number" value={f[k]||""} onChange={e=>setNum(k,e.target.value)} placeholder="0"/>
            </div>
          ))}
        </div>
        <div style={S.card}>
          <div style={{ fontSize:11, fontWeight:700, color:C.accent, marginBottom:12, letterSpacing:1 }}>ADVANCE & DISCOUNT</div>
          {([ ["Advance Amount (₹)","advance"], ["Discount (₹)","discount"] ] as [string,keyof BookingDraft][]).map(([l,k]) => (
            <div key={k} style={{ marginBottom:12 }}>
              <label style={S.label}>{l}</label>
              <input style={S.input} type="number" value={f[k]||""} onChange={e=>setNum(k,e.target.value)} placeholder="0"/>
            </div>
          ))}
          <div style={{ background:"#0d0d1a", borderRadius:10, padding:12 }}>
            {([ ["Total",fmt(total),C.accent], ["Advance",fmt(f.advance),C.green], ["Discount",fmt(f.discount),C.blue], ["Balance Due",fmt(balance),balance>0?C.red:C.green] ] as [string,string,string][]).map(([l,v,c]) => (
              <div key={l} style={{ display:"flex", justifyContent:"space-between", padding:"5px 0" }}>
                <span style={{ fontSize:13, color:C.muted }}>{l}</span>
                <span style={{ fontSize:13, fontWeight:800, color:c }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
        <button style={S.btn} onClick={go}>PREVIEW →</button>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
//  PREVIEW
// ═══════════════════════════════════════════════════════════
const PreviewPage = ({
  booking:bk, navigate, onConfirm
}: { booking:Booking|null; navigate:(p:Page)=>void; onConfirm:()=>Promise<void> }) => {
  const [saving, setSaving] = useState(false);
  if (!bk) return (
    <div style={S.page}>
      <div style={{ padding:40, textAlign:"center", color:C.muted }}>
        No booking data.
        <button onClick={()=>navigate("payment")} style={{ color:C.accent, background:"none", border:"none", cursor:"pointer" }}>← Create one</button>
      </div>
    </div>
  );
  const total = calcTotal(bk), balance = calcBalance(bk);
  const confirm = async () => {
    setSaving(true);
    await onConfirm();
    setSaving(false);
    navigate("bookings");
  };
  return (
    <div style={S.page}>
      <div style={S.hdr}>
        <BackBtn navigate={navigate}/>
        <span style={S.hTitle}>Preview & Confirm</span>
      </div>
      <div style={{ padding:16 }}>
        <div style={{ textAlign:"center", marginBottom:18 }}>
          <div style={{ fontSize:44, marginBottom:8 }}>🏛️</div>
          <div style={{ fontSize:20, fontWeight:800, color:C.accent }}>BOOKING SUMMARY</div>
          <div style={{ fontSize:12, color:C.muted, marginTop:3 }}>Review carefully before confirming</div>
        </div>
        <div style={S.card}>
          {([ ["Customer",bk.name], ["Phone","+91 "+bk.phone], ["Event",bk.eventType], ["Hall",bk.hall], ["Date",fmtDate(bk.date)], ["Time",bk.time] ] as [string,string][]).map(([l,v]) => (
            <div key={l} style={{ display:"flex", justifyContent:"space-between", padding:"9px 0", borderBottom:"1px solid #ffffff08" }}>
              <span style={{ fontSize:13, color:C.muted }}>{l}</span>
              <span style={{ fontSize:13, fontWeight:700, color:C.text }}>{v}</span>
            </div>
          ))}
        </div>
        <div style={S.card}>
          <div style={{ fontSize:11, fontWeight:700, color:C.accent, marginBottom:10, letterSpacing:1 }}>PRICE BREAKDOWN</div>
          {([ ["Mahal Rent",bk.rent], ["Radio Set",bk.radioSet], ["Cleaning",bk.cleaning], ["Electricity",bk.electricity], ["Gas",bk.gas], ["Generator",bk.generator] ] as [string,number][]).map(([l,v]) => (
            <div key={l} style={{ display:"flex", justifyContent:"space-between", padding:"6px 0" }}>
              <span style={{ fontSize:13, color:C.muted }}>{l}</span>
              <span style={{ fontSize:13, color:"#c0c0da" }}>{fmt(v)}</span>
            </div>
          ))}
          <div style={{ borderTop:"1px solid #ffffff14", marginTop:8, paddingTop:8 }}>
            {([ ["TOTAL",fmt(total),C.accent], ["Advance Paid",fmt(bk.advance),C.green], ["Discount",fmt(bk.discount),C.blue], ["BALANCE DUE",fmt(balance),balance>0?C.red:C.green] ] as [string,string,string][]).map(([l,v,c]) => (
              <div key={l} style={{ display:"flex", justifyContent:"space-between", padding:"7px 0" }}>
                <span style={{ fontSize:14, fontWeight:700, color:C.text }}>{l}</span>
                <span style={{ fontSize:14, fontWeight:800, color:c }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display:"flex", gap:10, marginBottom:12 }}>
          <button style={S.btnO} onClick={()=>shareWhatsApp(bk)}>💬 WhatsApp</button>
          <button style={S.btnO} onClick={()=>downloadPDF(bk)}>📄 PDF</button>
        </div>
        <button style={{ ...S.btn, opacity:saving?0.7:1 }} onClick={confirm} disabled={saving}>
          {saving?"⏳ Saving to Database...":"✓ CONFIRM & SAVE TO DATABASE"}
        </button>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
//  CALENDAR
// ═══════════════════════════════════════════════════════════
const CalendarPage = ({
  bookings, navigate
}: { bookings:Booking[]; navigate:(p:Page,d?:Booking|null)=>void }) => {
  const now = new Date();
  const [mo, setMo] = useState(now.getMonth());
  const [yr, setYr] = useState(now.getFullYear());
  const daysInMo = new Date(yr, mo+1, 0).getDate();
  const firstDay = new Date(yr, mo, 1).getDay();

  const byDate = useMemo(() => {
    const m: Record<string,Booking[]> = {};
    bookings.forEach(b => { if(!m[b.date]) m[b.date]=[]; m[b.date].push(b); });
    return m;
  }, [bookings]);

  const ds     = (d:number) => `${yr}-${String(mo+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
  const todayS = new Date().toISOString().split("T")[0];
  const cells  = [...Array(firstDay).fill(null), ...Array.from({length:daysInMo},(_,i)=>i+1)];
  const moBookings = bookings.filter(b=>b.date?.startsWith(`${yr}-${String(mo+1).padStart(2,"0")}`)).sort((a,b)=>a.date.localeCompare(b.date));

  return (
    <div style={S.page}>
      <div style={S.hdr}>
        <BackBtn navigate={navigate as (p:Page)=>void}/>
        <button style={{ background:"none",border:"none",color:C.accent,cursor:"pointer",fontSize:20,padding:"0 2px" }} onClick={()=>mo===0?(setMo(11),setYr(y=>y-1)):setMo(m=>m-1)}>‹</button>
        <span style={{ ...S.hTitle, textAlign:"center" }}>{MONTHS[mo]} {yr}</span>
        <button style={{ background:"none",border:"none",color:C.accent,cursor:"pointer",fontSize:20,padding:"0 2px" }} onClick={()=>mo===11?(setMo(0),setYr(y=>y+1)):setMo(m=>m+1)}>›</button>
      </div>
      <div style={{ padding:16 }}>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:2, marginBottom:4 }}>
          {["S","M","T","W","T","F","S"].map((d,i)=><div key={i} style={{ textAlign:"center", fontSize:11, color:C.muted, fontWeight:700, padding:"3px 0" }}>{d}</div>)}
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:3 }}>
          {cells.map((d,i) => {
            if (!d) return <div key={"_"+i}/>;
            const dateStr=ds(d), bks=byDate[dateStr]||[], isT=dateStr===todayS;
            return (
              <div key={d} onClick={()=>bks.length&&navigate("bookings")}
                style={{ minHeight:46, background:isT?"#1a1508":C.card, border:`1px solid ${isT?C.accent:C.border}`, borderRadius:8, padding:"4px 3px", cursor:bks.length?"pointer":"default", display:"flex", flexDirection:"column", alignItems:"center" }}>
                <span style={{ fontSize:12, color:isT?C.accent:"#c0c0da", fontWeight:isT?800:400 }}>{d}</span>
                {bks.slice(0,2).map((b,j)=>(
                  <div key={j} style={{ width:"100%", background:BADGE[b.status]?.bg||"#1e1e30", borderRadius:3, padding:"1px 2px", marginTop:2 }}>
                    <div style={{ fontSize:8, color:BADGE[b.status]?.color||C.muted, overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis" }}>{b.name.split(" ")[0]}</div>
                  </div>
                ))}
                {bks.length>2&&<div style={{ fontSize:8, color:C.muted }}>+{bks.length-2}</div>}
              </div>
            );
          })}
        </div>
        <div style={{ display:"flex", gap:16, marginTop:14, justifyContent:"center" }}>
          {([ ["#22c55e","Confirmed"], ["#f59e0b","Pending"], ["#ef4444","Cancelled"] ] as [string,string][]).map(([c,l])=>(
            <div key={l} style={{ display:"flex", alignItems:"center", gap:5 }}>
              <div style={{ width:10, height:10, background:c, borderRadius:2 }}/>
              <span style={{ fontSize:11, color:C.muted }}>{l}</span>
            </div>
          ))}
        </div>
        {moBookings.length>0 && (
          <div style={{ marginTop:18 }}>
            <div style={{ fontSize:13, fontWeight:700, color:C.text, marginBottom:10 }}>Bookings this month</div>
            {moBookings.map(b=><BookingCard key={b.id} booking={b} onDetails={bk=>navigate("bookingDetails",bk)}/>)}
          </div>
        )}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
//  REPORTS
// ═══════════════════════════════════════════════════════════
const ReportsPage = ({
  bookings, navigate
}: { bookings:Booking[]; navigate:(p:Page)=>void }) => {
  const totalRevenue  = bookings.reduce((s,b)=>s+calcTotal(b),0);
  const totalAdvance  = bookings.reduce((s,b)=>s+(b.advance||0),0);
  const totalBalance  = bookings.reduce((s,b)=>s+calcBalance(b),0);
  const totalDiscount = bookings.reduce((s,b)=>s+(b.discount||0),0);

  const byStatus  = Object.entries(bookings.reduce((a,b)=>({...a,[b.status]:(a[b.status as keyof typeof a]||0)+1}),{} as Record<string,number>)).map(([name,value])=>({name,value}));
  const byPayment = Object.entries(bookings.reduce((a,b)=>({...a,[b.paymentStatus]:(a[b.paymentStatus as keyof typeof a]||0)+1}),{} as Record<string,number>)).map(([name,value])=>({name,value}));
  const byHall    = Object.entries(bookings.reduce((a,b)=>({...a,[b.hall]:(a[b.hall as keyof typeof a]||0)+1}),{} as Record<string,number>)).map(([name,value])=>({name,value}));
  const byEvent   = Object.entries(bookings.reduce((a,b)=>({...a,[b.eventType]:(a[b.eventType as keyof typeof a]||0)+1}),{} as Record<string,number>)).map(([name,value])=>({name,value}));

  const monthlyData = useMemo(()=>{
    const byMo: Record<string,{revenue:number;bookings:number;advance:number}> = {};
    bookings.forEach(b=>{
      const key=b.date?.slice(0,7); if(!key) return;
      if(!byMo[key]) byMo[key]={revenue:0,bookings:0,advance:0};
      byMo[key].revenue  += calcTotal(b);
      byMo[key].bookings += 1;
      byMo[key].advance  += (b.advance||0);
    });
    return Object.entries(byMo).sort(([a],[b])=>a.localeCompare(b)).slice(-7)
      .map(([k,v])=>({month:MONTHS[parseInt(k.slice(5))-1],...v}));
  },[bookings]);

  const summaryCards = [
    { icon:"💰", label:"Total Revenue",  val:fmt(totalRevenue),  color:C.accent },
    { icon:"✅", label:"Total Advance",   val:fmt(totalAdvance),  color:C.green  },
    { icon:"⏳", label:"Total Balance",   val:fmt(totalBalance),  color:C.red    },
    { icon:"🎁", label:"Total Discount",  val:fmt(totalDiscount), color:C.blue   },
    { icon:"📋", label:"Total Bookings",  val:String(bookings.length), color:C.orange },
    { icon:"🏛", label:"Halls Active",    val:String(byHall.length),   color:"#06b6d4"},
  ];

  const PieCard = ({ title, data }: { title:string; data:{name:string;value:number}[] }) => (
    <div style={S.card}>
      <div style={{ fontSize:12, fontWeight:700, color:C.text, marginBottom:10, letterSpacing:0.5 }}>{title}</div>
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
            {data.map((_,i)=><Cell key={i} fill={PCOLS[i%PCOLS.length]}/>)}
          </Pie>
          <Tooltip contentStyle={{background:"#1a1a2e",border:"1px solid #ffffff1a",borderRadius:8,color:C.text,fontSize:12}}/>
        </PieChart>
      </ResponsiveContainer>
      <div style={{ display:"flex", flexWrap:"wrap", gap:6, justifyContent:"center" }}>
        {data.map((d,i)=>(
          <div key={d.name} style={{ display:"flex", alignItems:"center", gap:4 }}>
            <div style={{ width:8, height:8, borderRadius:2, background:PCOLS[i%PCOLS.length] }}/>
            <span style={{ fontSize:10, color:C.muted }}>{d.name} ({d.value})</span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div style={S.page}>
      <div style={S.hdr}>
        <BackBtn navigate={navigate}/>
        <span style={S.hTitle}>Reports & Analytics</span>
        <span style={{ fontSize:11, color:C.muted }}>{bookings.length} bookings</span>
      </div>
      <div style={{ padding:"14px 16px 0" }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
          {summaryCards.map((s,i)=>(
            <div key={i} style={{ background:C.card, borderRadius:14, padding:14, border:"1px solid "+C.border }}>
              <div style={{ fontSize:20, marginBottom:5 }}>{s.icon}</div>
              <div style={{ fontSize:18, fontWeight:800, color:s.color }}>{s.val}</div>
              <div style={{ fontSize:10, color:C.muted, marginTop:2 }}>{s.label}</div>
            </div>
          ))}
        </div>
        <div style={S.card}>
          <div style={{ fontSize:12, fontWeight:700, color:C.text, marginBottom:12, letterSpacing:0.5 }}>📊 Monthly Revenue</div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={monthlyData} margin={{top:0,right:0,bottom:0,left:0}}>
              <XAxis dataKey="month" tick={{fill:C.muted,fontSize:11}} axisLine={false} tickLine={false}/>
              <YAxis hide/>
              <Tooltip contentStyle={{background:"#1a1a2e",border:"1px solid #ffffff1a",borderRadius:8,color:C.text,fontSize:12}} formatter={(v:any)=>[fmt(v),"Revenue"]}/>
              <Bar dataKey="revenue" fill={C.accent} radius={[5,5,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={S.card}>
          <div style={{ fontSize:12, fontWeight:700, color:C.text, marginBottom:12, letterSpacing:0.5 }}>📅 Monthly Bookings Count</div>
          <ResponsiveContainer width="100%" height={130}>
            <BarChart data={monthlyData} margin={{top:0,right:0,bottom:0,left:0}}>
              <XAxis dataKey="month" tick={{fill:C.muted,fontSize:11}} axisLine={false} tickLine={false}/>
              <YAxis hide/>
              <Tooltip contentStyle={{background:"#1a1a2e",border:"1px solid #ffffff1a",borderRadius:8,color:C.text,fontSize:12}}/>
              <Bar dataKey="bookings" fill={C.blue} radius={[5,5,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <PieCard title="📋 Bookings by Status"  data={byStatus}/>
        <PieCard title="💳 Bookings by Payment" data={byPayment}/>
        <PieCard title="🏛️ Bookings by Hall"    data={byHall}/>
        <PieCard title="🎉 Bookings by Event"   data={byEvent}/>
        <div style={S.card}>
          <div style={{ fontSize:12, fontWeight:700, color:C.text, marginBottom:12, letterSpacing:0.5 }}>🏛️ Hall Revenue Breakdown</div>
          {HALLS.map(hall => {
            const hBks = bookings.filter(b=>b.hall===hall);
            const hRev = hBks.reduce((s,b)=>s+calcTotal(b),0);
            const pct  = totalRevenue>0 ? Math.round(hRev/totalRevenue*100) : 0;
            return (
              <div key={hall} style={{ marginBottom:12 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                  <span style={{ fontSize:13, color:C.text }}>{hall}</span>
                  <span style={{ fontSize:13, fontWeight:700, color:C.accent }}>{fmt(hRev)} <span style={{ color:C.muted, fontWeight:400 }}>({hBks.length} bookings)</span></span>
                </div>
                <div style={{ background:"#1a1a2e", borderRadius:4, height:6 }}>
                  <div style={{ background:C.accent, borderRadius:4, height:6, width:pct+"%" }}/>
                </div>
              </div>
            );
          })}
        </div>
        <div style={S.card}>
          <div style={{ fontSize:12, fontWeight:700, color:C.text, marginBottom:12, letterSpacing:0.5 }}>🏆 Top Customers by Revenue</div>
          {[...bookings].sort((a,b)=>calcTotal(b)-calcTotal(a)).slice(0,5).map((b,i)=>(
            <div key={b.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0", borderBottom:"1px solid #ffffff08" }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ width:24, height:24, borderRadius:12, background:PCOLS[i], display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:800, color:"#0a0805" }}>{i+1}</div>
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color:C.text }}>{b.name}</div>
                  <div style={{ fontSize:11, color:C.muted }}>{b.eventType} · {b.hall}</div>
                </div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:13, fontWeight:700, color:C.accent }}>{fmt(calcTotal(b))}</div>
                <StatusBadge status={b.paymentStatus}/>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
//  BOTTOM NAV
// ═══════════════════════════════════════════════════════════
const BottomNav = ({ page, navigate }: { page:Page; navigate:(p:Page)=>void }) => {
  const tabs: { id:Page; icon:string; label:string; accent?:boolean }[] = [
    { id:"dashboard", icon:"🏠", label:"Home"     },
    { id:"bookings",  icon:"📋", label:"Bookings" },
    { id:"payment",   icon:"➕", label:"New", accent:true },
    { id:"calendar",  icon:"📅", label:"Calendar" },
    { id:"reports",   icon:"📊", label:"Reports"  },
  ];
  return (
    <div style={S.tabs}>
      {tabs.map(t=>(
        <button key={t.id} onClick={()=>navigate(t.id)} style={{ ...S.tab, color:t.accent?C.accent:page===t.id?C.accent:C.muted }}>
          <span style={{ fontSize:t.accent?20:18 }}>{t.icon}</span>
          <span style={{ fontSize:9, fontWeight:page===t.id||t.accent?700:400 }}>{t.label}</span>
        </button>
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
//  APP ROOT
// ═══════════════════════════════════════════════════════════
const SEED_BOOKINGS: Booking[] = [
  { id:"BK001", name:"Arjun Mehta",   phone:"9876543210", date:"2026-04-02", time:"10:00 AM", eventType:"Wedding",    hall:"Grand Hall",   status:"confirmed", paymentStatus:"paid",    rent:75000, radioSet:8000,  cleaning:3000, electricity:4500, gas:2000, generator:3500, advance:88000, discount:8000 },
  { id:"BK002", name:"Priya Sharma",  phone:"9988776655", date:"2026-04-05", time:"11:00 AM", eventType:"Reception",  hall:"Rose Hall",    status:"pending",   paymentStatus:"partial", rent:55000, radioSet:5000,  cleaning:2500, electricity:3500, gas:1500, generator:2500, advance:35000, discount:0 },
  { id:"BK003", name:"Ravi Krishnan", phone:"9123456789", date:"2026-04-08", time:"09:00 AM", eventType:"Birthday",   hall:"Mini Hall",    status:"confirmed", paymentStatus:"unpaid",  rent:25000, radioSet:3000,  cleaning:1500, electricity:2000, gas:1000, generator:1500, advance:0,     discount:2000 },
  { id:"BK004", name:"Sunita Patel",  phone:"9765432109", date:"2026-04-12", time:"06:00 PM", eventType:"Engagement", hall:"Grand Hall",   status:"cancelled", paymentStatus:"unpaid",  rent:60000, radioSet:6000,  cleaning:2500, electricity:4000, gas:1800, generator:3000, advance:0,     discount:0 },
  { id:"BK005", name:"Mohammed Ali",  phone:"9654321098", date:"2026-04-15", time:"07:00 PM", eventType:"Wedding",    hall:"Grand Hall",   status:"confirmed", paymentStatus:"paid",    rent:80000, radioSet:9000,  cleaning:3500, electricity:5000, gas:2500, generator:4000, advance:96000, discount:8000 },
];

export default function MahalApp() {
  const [loggedIn,  setLoggedIn]  = useState(false);
  const [page,      setPage]      = useState<Page>("dashboard");
  const [bookings,  setBookings]  = useState<Booking[]>([]);
  const [selected,  setSelected]  = useState<Booking|null>(null);
  const [draft,     setDraft]     = useState<Booking|null>(null);
  const [loading,   setLoading]   = useState(false);
  const [dbOnline,  setDbOnline]  = useState(true);

  useEffect(() => {
    const l = document.createElement("link");
    l.href = "https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,700;9..40,800&display=swap";
    l.rel  = "stylesheet";
    document.head.appendChild(l);
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res  = await fetch(API+"/bookings");
      if (!res.ok) throw new Error("Server error");
      const data: Booking[] = await res.json();
      setBookings(data);
      setDbOnline(true);
    } catch {
      setDbOnline(false);
      if (bookings.length === 0) setBookings(SEED_BOOKINGS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (loggedIn) fetchBookings(); }, [loggedIn]);

  const saveBooking = async (booking: Booking): Promise<void> => {
    try {
      const res = await fetch(API+"/bookings", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify(booking),
      });
      if (!res.ok) throw new Error("Save failed");
      await fetchBookings();
    } catch {
      setBookings(prev => [booking, ...prev]);
    }
  };

  const navigate = (target: Page, data: Booking|null = null) => {
    if (target==="bookingDetails" && data) setSelected(data);
    setPage(target);
  };

  const handleLogout = () => {
    setLoggedIn(false);
    setPage("dashboard");
    setBookings([]);
    setSelected(null);
    setDraft(null);
  };

  if (!loggedIn) return <LoginPage onLogin={()=>setLoggedIn(true)}/>;

  const PAGES: Record<Page, React.ReactElement> = {
    dashboard:      <DashboardPage      bookings={bookings} navigate={navigate} onLogout={handleLogout}/>,
    bookings:       <BookingsPage       bookings={bookings} navigate={navigate}/>,
    bookingDetails: <BookingDetailsPage booking={selected}  navigate={navigate as (p:Page)=>void}/>,
    payment:        <PaymentPage        navigate={navigate as (p:Page)=>void} onSave={bk=>{setDraft(bk);}} />,
    preview:        <PreviewPage        booking={draft}     navigate={navigate as (p:Page)=>void} onConfirm={async()=>{ if(draft) await saveBooking(draft); }}/>,
    calendar:       <CalendarPage       bookings={bookings} navigate={navigate}/>,
    reports:        <ReportsPage        bookings={bookings} navigate={navigate as (p:Page)=>void}/>,
  };

  return (
    <div style={{ background:C.bg, minHeight:"100vh", display:"flex", justifyContent:"center", fontFamily:"'DM Sans',sans-serif" }}>
      <div style={{ width:"100%", maxWidth:430, minHeight:"100vh", background:C.bg, display:"flex", flexDirection:"column", position:"relative" }}>
        {!dbOnline && (
          <div style={{ background:"#2d1a00", padding:"6px 16px", textAlign:"center", fontSize:11, color:C.orange, borderBottom:"1px solid #f59e0b33" }}>
            ⚠️ Server offline — showing local data. Run: node server.js
          </div>
        )}
        {loading && (
          <div style={{ background:"#0d1a0d", padding:"5px 16px", textAlign:"center", fontSize:11, color:C.green }}>
            ⏳ Loading from database...
          </div>
        )}
        {PAGES[page] || PAGES.dashboard}
        <BottomNav page={page} navigate={navigate as (p:Page)=>void}/>
      </div>
    </div>
  );
}

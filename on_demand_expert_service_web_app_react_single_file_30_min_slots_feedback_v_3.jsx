import React, { useEffect, useMemo, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { motion } from "framer-motion";
import {
  Star,
  LogOut,
  Shield,
  Wallet,
  Search,
  ShieldAlert,
  Banknote,
  FileCheck2,
  Plus,
  Trash2,
  Edit3,
  RotateCcw,
  X,
} from "lucide-react";

// shadcn/ui
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

/*************************
 * BRANDING (Logo & Colors)
 *************************/
const LS_BRAND = "odx_brand_v4"; // {name, tagline, colors:{primary, accent}, logoDataUrl}
const DEFAULT_BRAND = {
  name: "Sahakar Sarathi",
  tagline: "साथ जुड़ें साथ बढ़ें",
  colors: { primary: "#2F6F3F", accent: "#F28C28" },
  logoDataUrl: null,
};

function BrandStyles({ brand }) {
  const css = `:root{--brand-primary:${brand.colors.primary};--brand-accent:${brand.colors.accent}}`;
  return <style>{css}</style>;
}

function BrandButton({ className = "", style = {}, children, ...rest }) {
  return (
    <Button
      className={`text-white ${className}`}
      style={{ backgroundColor: "var(--brand-primary)", borderColor: "var(--brand-primary)", ...style }}
      {...rest}
    >
      {children}
    </Button>
  );
}

function BrandHeader({ brand, userName, onLogout, onReset }) {
  return (
    <header className="max-w-6xl mx-auto p-4 md:p-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {brand.logoDataUrl ? (
          <img src={brand.logoDataUrl} alt={brand.name} className="h-10 w-10 rounded-md object-contain" />
        ) : (
          <div
            className="h-10 w-10 rounded-md flex items-center justify-center text-white font-semibold"
            style={{ backgroundColor: "var(--brand-primary)" }}
          >
            {brand.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
          </div>
        )}
        <div>
          <div className="text-xl md:text-2xl font-semibold" style={{ color: "var(--brand-primary)" }}>{brand.name}</div>
          <div className="text-xs text-muted-foreground">{brand.tagline || "Fast advice in simple language"}</div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {userName && <div className="text-sm">Hello, <b>{userName}</b></div>}
        {onReset && (
          <Button variant="outline" size="sm" onClick={onReset}><RotateCcw className="h-4 w-4 mr-2"/>Reset</Button>
        )}
        {onLogout && (
          <Button variant="outline" size="sm" onClick={onLogout}><LogOut className="h-4 w-4 mr-2"/>Logout</Button>
        )}
      </div>
    </header>
  );
}

/*************************
 * CONSTANTS & UTILITIES *
 *************************/
const DOMAINS = [
  { id: "cyber", label: "Cybersecurity", icon: Shield },
  { id: "tax", label: "Tax/Finance", icon: Wallet },
  { id: "core", label: "Core Banking System", icon: Banknote },
  { id: "procure", label: "Procurement", icon: FileCheck2 },
  { id: "reg", label: "Regulatory Compliance", icon: ShieldAlert },
];

const PACKAGE_HOURS = [1, 4, 10, 20];
const SLOT_MIN = 30; // booking slot duration in minutes

const LS_USER = "odx_user_v4";
const LS_USERS = "odx_users_v4";
const LS_PURCHASES = "odx_purchases_v4"; // [{id,userId,expertId,packageHours,amount,hoursRemaining}]
const LS_SESSIONS = "odx_sessions_v4"; // [{id,userId,expertId,purchaseId,date,startMin,endMin,link,status,cancelReason,cancelledBy,cancelledAt}]
const LS_AVAIL = "odx_avail_overrides_v4"; // [{id,expertId,date,workday,dayStart,dayEnd}]
const LS_PAYOUTS = "odx_payouts_v4"; // [{id,expertId,amount,createdAt,note}]
const LS_FEEDBACK = "odx_feedback_v4"; // [{id,userId,expertId,purchaseId,rating,text,createdAt}]
const LS_EXPERT_SLOTS = "odx_explicit_windows_v4"; // [{id,expertId,date,windows:[{start,end}]}]
const LS_CLIENT_PAYMENTS = "odx_client_payments_v4"; // [{id,userId,amount,createdAt,note}]

function timeStrToMinutes(t) { const [h, m] = t.split(":").map(Number); return h * 60 + m; }
function minutesToTimeStr(mins) { const h = Math.floor(mins / 60); const m = mins % 60; return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`; }
function ymd(d) { const x = new Date(d); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`; }
function overlaps(aStart, aEnd, bStart, bEnd) { return Math.max(aStart, bStart) < Math.min(aEnd, bEnd); }
function rupee(n) { return `₹${Number(n || 0).toLocaleString("en-IN")}`; }
function saveLS(k, v) { localStorage.setItem(k, JSON.stringify(v)); }
function loadLS(k, fb) { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? fb; } catch { return fb; } }

/*****************
 * MOCK DATABASE *
 *****************/
const MOCK_USERS = [
  { id: "u1", username: "ravi", password: "ravi123", name: "Ravi Kumar", email: "ravi@example.com", role: "client", active: true },
  { id: "u2", username: "anita", password: "anita123", name: "Anita Verma", email: "anita@example.com", role: "client", active: true },
  { id: "u3", username: "sara", password: "sara123", name: "Sara Khan", email: "sara@example.com", role: "client", active: true },
  { id: "admin", username: "admin", password: "admin123", name: "Super Admin", email: "admin@example.com", role: "admin", active: true },
  { id: "ex1", username: "nikhil", password: "nikhil123", name: "Nikhil Sharma", email: "nikhil@secure.co", role: "expert", expertId: "e1", active: true },
  { id: "ex2", username: "priya", password: "priya123", name: "Priya Iyer", email: "priya@defend.in", role: "expert", expertId: "e2", active: true },
];

const MOCK_EXPERTS = [
  { id: "e1", name: "Nikhil Sharma", domain: "cyber", description: "Helps small businesses secure phones, laptops, and Wi‑Fi.", experience: "8 years • Ex-BCG Platinion", rating: 4.7, rate: 1500, phone: "+91 90000 11111", email: "nikhil@secure.co", dayStart: "09:00", dayEnd: "17:00", workdays: [1,2,3,4,5] },
  { id: "e2", name: "Priya Iyer", domain: "cyber", description: "Simple steps to prevent fraud and data leaks.", experience: "6 years • ISO 27001 Lead Auditor", rating: 4.5, rate: 1200, phone: "+91 90000 22222", email: "priya@defend.in", dayStart: "10:00", dayEnd: "18:00", workdays: [1,2,3,4,5] },
  { id: "e3", name: "Amit Das", domain: "tax", description: "Tax filing and small business GST guidance.", experience: "10 years • Chartered Accountant", rating: 4.8, rate: 1000, phone: "+91 90000 33333", email: "amit@gstpro.in", dayStart: "09:00", dayEnd: "17:00", workdays: [1,2,3,4,5] },
  { id: "e4", name: "Sneha Joshi", domain: "core", description: "Core banking setup and CBS vendor selection.", experience: "9 years • Ex-Oracle Flexcube", rating: 4.6, rate: 2000, phone: "+91 90000 44444", email: "sneha@cbshelp.in", dayStart: "11:00", dayEnd: "19:00", workdays: [1,2,3,4,5] },
  { id: "e5", name: "Rahul Menon", domain: "procure", description: "Vendor comparison and basic contract review.", experience: "7 years • CIPS Level 4", rating: 4.4, rate: 900, phone: "+91 90000 55555", email: "rahul@buyright.in", dayStart: "09:00", dayEnd: "17:00", workdays: [1,2,3,4,5] },
  { id: "e6", name: "Farah Ali", domain: "reg", description: "RBI, SEBI and local licence support.", experience: "12 years • Compliance Officer", rating: 4.9, rate: 1800, phone: "+91 90000 66666", email: "farah@regassist.in", dayStart: "10:00", dayEnd: "18:00", workdays: [1,2,3,4,5] },
];

/****************
 * SLOT LOGIC   *
 ****************/
// Expand explicit windows (if any) into 30-min bookable slots; else use default/overrides
function computeSlotsForDate(expert, dateISO, sessions, availOverrides, explicit) {
  const todays = sessions.filter((s) => s.expertId === expert.id && s.date === dateISO && s.status !== "cancelled");
  const rec = (explicit || []).find((r) => r.expertId === expert.id && r.date === dateISO);
  const windows = rec ? (rec.windows || rec.slots || []) : [];

  let baseWindows = windows;
  if (!baseWindows || baseWindows.length === 0) {
    const date = new Date(dateISO);
    const dow = date.getDay();
    const override = (availOverrides || []).find((o) => o.expertId === expert.id && o.date === dateISO);
    if (override && !override.workday) return [];
    if (!override && !expert.workdays.includes(dow)) return [];
    const start = timeStrToMinutes(override?.dayStart || expert.dayStart);
    const end = timeStrToMinutes(override?.dayEnd || expert.dayEnd);
    baseWindows = [{ start, end }];
  }

  const out = [];
  for (const w of baseWindows) {
    for (let t = w.start; t + SLOT_MIN <= w.end; t += SLOT_MIN) {
      const candidate = { start: t, end: t + SLOT_MIN };
      const clash = todays.some((x) => overlaps(candidate.start, candidate.end, x.startMin, x.endMin));
      if (!clash) out.push(candidate);
    }
  }
  out.sort((a, b) => a.start - b.start);
  return out;
}

/****************
 * UI WIDGETS   *
 ****************/
function Stars({ value, count }) {
  const full = Math.floor(value);
  const half = value - full >= 0.5;
  const arr = Array.from({ length: 5 }, (_, i) => i);
  return (
    <div className="flex items-center gap-1">
      {arr.map((i) => (
        <Star key={i} className={`h-4 w-4 ${i < full ? "fill-current" : half && i === full ? "fill-current opacity-60" : "opacity-30"}`} style={{ color: "var(--brand-primary)" }} />
      ))}
      <span className="text-xs text-muted-foreground">{value.toFixed(1)}{typeof count === 'number' ? ` (${count})` : ''}</span>
    </div>
  );
}

function Avatar({ name }) {
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-semibold" style={{ backgroundColor: "var(--brand-accent)", color: "white" }}>
      {initials}
    </div>
  );
}

/****************
 * LOGIN SCREEN *
 ****************/
function Login({ onLogin, brand }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);

  function submit() {
    const users = loadLS(LS_USERS, MOCK_USERS);
    const user = users.find((u) => u.username === username && u.password === password && u.active !== false);
    if (user) onLogin(user);
    else toast.error("Wrong username/password or user inactive");
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md shadow-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl" style={{ color: "var(--brand-primary)" }}>On-Demand Experts</CardTitle>
          <CardDescription>Simple help for your business</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label>Username</Label>
            <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="e.g., ravi" />
          </div>
          <div className="grid gap-2">
            <Label>Password</Label>
            <div className="flex gap-2">
              <Input type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••" />
              <Button type="button" variant="outline" onClick={() => setShow((s) => !s)}>{show ? "Hide" : "Show"}</Button>
            </div>
          </div>
          <BrandButton className="w-full text-base" onClick={submit}>Continue</BrandButton>
          <div className="text-xs text-muted-foreground">
            Clients: <b>ravi/ravi123</b>, <b>anita/anita123</b>, <b>sara/sara123</b> • Experts: <b>nikhil/nikhil123</b>, <b>priya/priya123</b> • Admin: <b>admin/admin123</b>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/****************
 * EXPERT CARD  *
 ****************/
function ExpertCard({ expert, onBook, ratingValue, ratingCount }) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar name={expert.name} />
            <div>
              <CardTitle className="text-lg leading-tight">{expert.name}</CardTitle>
              <CardDescription className="text-xs">{DOMAINS.find((d) => d.id === expert.domain)?.label}</CardDescription>
            </div>
          </div>
          <Stars value={ratingValue ?? expert.rating} count={ratingCount} />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="text-sm">{expert.description}</div>
        <div className="text-xs text-muted-foreground">{expert.experience}</div>
        <div className="flex items-center justify-between mt-1">
          <div className="text-sm font-medium">{rupee(expert.rate)} / hour</div>
          <BrandButton onClick={() => onBook(expert)} className="text-base">Book consultation</BrandButton>
        </div>
      </CardContent>
    </Card>
  );
}

/****************
 * MAIN APP     *
 ****************/
export default function OnDemandExpertsApp() {
  // brand (persisted)
  const [brand, setBrand] = useState(() => loadLS(LS_BRAND, DEFAULT_BRAND));
  useEffect(() => saveLS(LS_BRAND, brand), [brand]);

  // users & session
  const [users, setUsers] = useState(() => loadLS(LS_USERS, MOCK_USERS));
  useEffect(() => saveLS(LS_USERS, users), [users]);
  const [user, setUser] = useState(() => loadLS(LS_USER, null));
  useEffect(() => saveLS(LS_USER, user), [user]);

  // data
  const [purchases, setPurchases] = useState(() => loadLS(LS_PURCHASES, []));
  const [sessions, setSessions] = useState(() => loadLS(LS_SESSIONS, []));
  const [availOverrides, setAvailOverrides] = useState(() => loadLS(LS_AVAIL, []));
  const [payouts, setPayouts] = useState(() => loadLS(LS_PAYOUTS, []));
  const [feedback, setFeedback] = useState(() => loadLS(LS_FEEDBACK, []));
  const [expSlots, setExpSlots] = useState(() => loadLS(LS_EXPERT_SLOTS, []));
  const [clientPayments, setClientPayments] = useState(() => loadLS(LS_CLIENT_PAYMENTS, []));

  useEffect(() => saveLS(LS_PURCHASES, purchases), [purchases]);
  useEffect(() => saveLS(LS_SESSIONS, sessions), [sessions]);
  useEffect(() => saveLS(LS_AVAIL, availOverrides), [availOverrides]);
  useEffect(() => saveLS(LS_PAYOUTS, payouts), [payouts]);
  useEffect(() => saveLS(LS_FEEDBACK, feedback), [feedback]);
  useEffect(() => saveLS(LS_EXPERT_SLOTS, expSlots), [expSlots]);
  useEffect(() => saveLS(LS_CLIENT_PAYMENTS, clientPayments), [clientPayments]);

  // Hard reset
  function resetAll() { try { Object.keys(localStorage).forEach((k) => { if (k.startsWith("odx_")) localStorage.removeItem(k); }); } catch {} window.location.reload(); }

  if (!user) return <><BrandStyles brand={brand} /><Login onLogin={setUser} brand={brand} /></>;

  if (user.role === "expert") {
    return (
      <>
        <BrandStyles brand={brand} />
        <ExpertDashboard
          brand={brand}
          user={user}
          onLogout={() => setUser(null)}
          sessions={sessions}
          setSessions={setSessions}
          availOverrides={availOverrides}
          setAvailOverrides={setAvailOverrides}
          expSlots={expSlots}
          setExpSlots={setExpSlots}
          purchases={purchases}
          setPurchases={setPurchases}
          onReset={resetAll}
        />
      </>
    );
  }

  if (user.role === "admin") {
    return (
      <>
        <BrandStyles brand={brand} />
        <AdminDashboard
          brand={brand}
          setBrand={setBrand}
          user={user}
          onLogout={() => setUser(null)}
          users={users}
          setUsers={setUsers}
          sessions={sessions}
          purchases={purchases}
          payouts={payouts}
          setPayouts={setPayouts}
          clientPayments={clientPayments}
          setClientPayments={setClientPayments}
          onReset={resetAll}
        />
      </>
    );
  }

  return (
    <>
      <BrandStyles brand={brand} />
      <ClientHome
        brand={brand}
        user={user}
        onLogout={() => setUser(null)}
        purchases={purchases}
        setPurchases={setPurchases}
        sessions={sessions}
        setSessions={setSessions}
        availOverrides={availOverrides}
        feedback={feedback}
        setFeedback={setFeedback}
        expSlots={expSlots}
        clientPayments={clientPayments}
        onReset={resetAll}
      />
    </>
  );
}

/****************
 * CLIENT HOME  *
 ****************/
function ClientHome({ brand, user, onLogout, purchases, setPurchases, sessions, setSessions, availOverrides, feedback, setFeedback, expSlots, clientPayments, onReset }) {
  const [activeTab, setActiveTab] = useState("browse");
  const [domainFilter, setDomainFilter] = useState("cyber");
  const [search, setSearch] = useState("");

  // dialogs state
  const [pickPkgOpen, setPickPkgOpen] = useState(false);
  const [confirmBuyOpen, setConfirmBuyOpen] = useState(false);
  const [selectedExpert, setSelectedExpert] = useState(null);
  const [selectedHours, setSelectedHours] = useState(1);
  const [acceptTermsBuy, setAcceptTermsBuy] = useState(false);

  // schedule dialogs
  const [chooseDateOpen, setChooseDateOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [fbTarget, setFbTarget] = useState(null); // {expertId, purchaseId}
  const [fbRating, setFbRating] = useState(0);
  const [fbText, setFbText] = useState("");
  const [confirmSlotOpen, setConfirmSlotOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [scheduleDate, setScheduleDate] = useState(ymd(new Date()));
  const [selectedSlots, setSelectedSlots] = useState([]); // multi-select
  const [acceptTermsSlot, setAcceptTermsSlot] = useState(false);

  // cancel dialog
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState("");

  const experts = useMemo(() => {
    const q = search.toLowerCase();
    return MOCK_EXPERTS.filter((e) => e.domain === domainFilter && (!q || e.name.toLowerCase().includes(q)));
  }, [domainFilter, search]);

  // feedback helpers
  const aggRatingForExpert = (expertId) => {
    const list = feedback.filter((f) => f.expertId === expertId);
    if (list.length === 0) return null;
    const avg = list.reduce((s, r) => s + Number(r.rating || 0), 0) / list.length;
    return { value: avg, count: list.length };
  };
  const hasFeedbackForPurchase = (purchaseId) => feedback.some((f) => f.purchaseId === purchaseId && f.userId === user.id);
  function openFeedbackForPurchase(p) { setFbTarget({ expertId: p.expertId, purchaseId: p.id }); setFbRating(0); setFbText(""); setFeedbackOpen(true); }

  const myPurchases = purchases.filter((p) => p.userId === user.id);
  const mySessions = sessions.filter((s) => s.userId === user.id);

  // keep session status updated; preserve cancelled
  useEffect(() => {
    const updated = sessions.map((s) => {
      if (s.status === 'cancelled') return s;
      const up = sessionIsUpcoming(s);
      const status = up ? 'upcoming' : 'completed';
      return s.status === status ? s : { ...s, status };
    });
    if (JSON.stringify(updated) !== JSON.stringify(sessions)) setSessions(updated);
  }, [sessions, setSessions]);

  useEffect(() => {
    for (const p of myPurchases) {
      if (p.hoursRemaining === 0 && !hasFeedbackForPurchase(p.id)) {
        const sess = sessions.filter((s) => s.purchaseId === p.id);
        if (sess.length > 0 && sess.every((s) => !sessionIsUpcoming(s))) {
          setFbTarget({ expertId: p.expertId, purchaseId: p.id });
          setFbRating(0); setFbText("");
          setFeedbackOpen(true);
          break;
        }
      }
    }
  }, [myPurchases, sessions]);

  function openBook(ex) { setSelectedExpert(ex); setSelectedHours(1); setAcceptTermsBuy(false); setPickPkgOpen(true); }
  function continueToConfirm() { setPickPkgOpen(false); setConfirmBuyOpen(true); }
  function confirmPurchase() {
    if (!acceptTermsBuy) return toast.error("Please accept the terms and conditions");
    const amount = selectedExpert.rate * selectedHours;
    const rec = { id: uuidv4(), userId: user.id, expertId: selectedExpert.id, packageHours: selectedHours, hoursRemaining: selectedHours, amount, createdAt: new Date().toISOString() };
    setPurchases((prev) => [rec, ...prev]); setConfirmBuyOpen(false); setActiveTab("schedule"); toast.success("Package purchased. Go to Schedule a Session to book your time.");
  }

  function openSchedule(purchase) { setSelectedPurchase(purchase); setScheduleDate(ymd(new Date())); setSelectedSlots([]); setAcceptTermsSlot(false); setChooseDateOpen(true); }
  function confirmSlot() {
    if (!acceptTermsSlot) return toast.error("Please accept the terms and conditions");
    if (!selectedPurchase || !selectedSlots || selectedSlots.length === 0) return;
    // revalidate: no past slots & still available & within hours
    const today = ymd(new Date());
    const now = new Date();
    const nowMin = now.getHours()*60 + now.getMinutes();
    const valid = selectedSlots.filter((s) => {
      if (scheduleDate < today) return false;
      if (scheduleDate === today && s.start <= nowMin) return false;
      const expert = MOCK_EXPERTS.find((e)=>e.id===selectedPurchase.expertId);
      const avail = computeSlotsForDate(expert, scheduleDate, sessions, availOverrides, expSlots);
      return !!avail.find((a)=>a.start===s.start && a.end===s.end);
    });
    if (valid.length === 0) return toast.error("Selected slots are no longer available");
    const deduction = (SLOT_MIN/60) * valid.length;
    if (deduction > selectedPurchase.hoursRemaining + 1e-6) return toast.error("Not enough hours remaining to book all selected slots");

    // Deduct
    const newRemaining = Math.max(0, selectedPurchase.hoursRemaining - deduction);
    setPurchases((prev) => prev.map((p) => (p.id === selectedPurchase.id ? { ...p, hoursRemaining: Number(newRemaining.toFixed(2)) } : p)));
    // Create sessions
    const created = valid.map((v) => ({ id: uuidv4(), userId: user.id, expertId: selectedPurchase.expertId, purchaseId: selectedPurchase.id, date: scheduleDate, startMin: v.start, endMin: v.end, link: `https://meet.example.com/${uuidv4().slice(0, 8)}`, status: "upcoming", createdAt: new Date().toISOString() }));
    setSessions((prev) => [...created, ...prev]);
    setConfirmSlotOpen(false);
    const ex = MOCK_EXPERTS.find((e) => e.id === selectedPurchase.expertId);
    toast.success(`Booked ${valid.length} slot${valid.length>1?'s':''} with ${ex.name}`);
  }

  // cancellation helpers (client)
  function canCancel(s) { return s.status !== 'cancelled' && (dateTimeMin(s) - Date.now() >= 24*60*60*1000); }
  function startCancel(s) { setCancelTarget(s); setCancelReason(""); setCancelOpen(true); }
  function confirmCancel() {
    if (!cancelTarget) return;
    if (!canCancel(cancelTarget)) { toast.error("You can cancel only up to 24 hours before start"); setCancelOpen(false); return; }
    if (!cancelReason.trim()) { toast.error("Please provide a cancellation reason"); return; }
    // mark cancelled
    setSessions((prev) => prev.map((x) => x.id === cancelTarget.id ? { ...x, status: 'cancelled', cancelReason: cancelReason.trim(), cancelledBy: user.id, cancelledAt: new Date().toISOString() } : x));
    // refund hours to purchase
    const mins = cancelTarget.endMin - cancelTarget.startMin;
    setPurchases((prev) => prev.map((p) => p.id === cancelTarget.purchaseId ? { ...p, hoursRemaining: Number(Math.min(p.packageHours, (p.hoursRemaining + mins/60)).toFixed(2)) } : p));
    setCancelOpen(false);
    toast.success("Session cancelled");
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <BrandHeader brand={brand} userName={user.name} onLogout={onLogout} onReset={onReset} />

      <main className="max-w-6xl mx-auto p-4 md:p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 w-full max-w-2xl">
            <TabsTrigger value="browse">Find Experts</TabsTrigger>
            <TabsTrigger value="schedule">Schedule a Session</TabsTrigger>
            <TabsTrigger value="mysessions">My Sessions</TabsTrigger>
            <TabsTrigger value="profile">My Profile</TabsTrigger>
          </TabsList>

          {/* BROWSE */}
          <TabsContent value="browse" className="mt-4 space-y-4">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Choose a domain</CardTitle>
                <CardDescription>Pick a field and then select an expert</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-4">
                <div className="md:col-span-3 grid gap-3">
                  <div className="flex flex-wrap gap-2">
                    {DOMAINS.map((d) => (
                      <Button key={d.id} variant={d.id === domainFilter ? "default" : "outline"} className="rounded-full" onClick={() => setDomainFilter(d.id)}>{d.label}</Button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search expert name" value={search} onChange={(e) => setSearch(e.target.value)} />
                  </div>
                </div>
                <div className="text-sm bg-muted/50 rounded-xl p-3">
                  <div className="font-medium mb-1">How it works</div>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Choose an expert</li>
                    <li>Select hours (1, 4, 10, 20)</li>
                    <li>Confirm purchase</li>
                    <li>Go to <b>Schedule a Session</b> to book time (30-min slots; multi-select)</li>
                  </ol>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
              {experts.map((ex) => (
                <motion.div key={ex.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                  <ExpertCard expert={ex} onBook={openBook} ratingValue={(aggRatingForExpert(ex.id)?.value) || ex.rating} ratingCount={(aggRatingForExpert(ex.id)?.count) || 0} />
                </motion.div>
              ))}
              {experts.length === 0 && (
                <Card><CardContent className="p-6 text-sm text-muted-foreground">No experts found.</CardContent></Card>
              )}
            </div>
          </TabsContent>

          {/* SCHEDULE */}
          <TabsContent value="schedule" className="mt-4 space-y-4">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Your packages</CardTitle>
                <CardDescription>Book slots from purchased hours</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                {myPurchases.length === 0 && (<div className="text-sm text-muted-foreground">No packages yet. Go to <b>Find Experts</b> to purchase hours.</div>)}
                {myPurchases.map((p) => {
                  const expert = MOCK_EXPERTS.find((e) => e.id === p.expertId);
                  const allSessions = sessions.filter((s) => s.purchaseId === p.id);
                  const allCompleted = allSessions.length === 0 ? true : allSessions.every((s)=>!sessionIsUpcoming(s));
                  return (
                    <div key={p.id} className="flex items-center justify-between gap-3 border rounded-xl p-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={expert.name} />
                        <div>
                          <div className="font-medium">{expert.name}</div>
                          <div className="text-xs text-muted-foreground">Package: {p.packageHours} hrs • Left: <b>{p.hoursRemaining}</b> hrs</div>
                        </div>
                      </div>
                      {p.hoursRemaining > 0 ? (
                        <BrandButton onClick={() => openSchedule(p)}>Book slots</BrandButton>
                      ) : hasFeedbackForPurchase(p.id) ? (
                        <Button variant="outline" disabled>Feedback sent</Button>
                      ) : allCompleted ? (
                        <BrandButton onClick={() => openFeedbackForPurchase(p)}>Leave feedback</BrandButton>
                      ) : (
                        <Button variant="outline" disabled>Await session completion</Button>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </TabsContent>

          {/* MY SESSIONS */}
          <TabsContent value="mysessions" className="mt-4 space-y-4">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Upcoming sessions</CardTitle>
                <CardDescription>Join or cancel (≥24h prior)</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                {mySessions.filter((s) => sessionIsUpcoming(s) && s.status !== 'cancelled').length === 0 && (<div className="text-sm text-muted-foreground">No upcoming sessions yet.</div>)}
                {mySessions.filter((s)=>sessionIsUpcoming(s) && s.status!=='cancelled').sort((a, b) => dateTimeMin(a) - dateTimeMin(b)).map((s) => {
                  const ex = MOCK_EXPERTS.find((e) => e.id === s.expertId);
                  const when = `${s.date} • ${minutesToTimeStr(s.startMin)}-${minutesToTimeStr(s.endMin)}`;
                  const p = purchases.find((x) => x.id === s.purchaseId);
                  return (
                    <div key={s.id} className="flex items-center justify-between gap-3 border rounded-xl p-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={ex.name} />
                        <div>
                          <div className="font-medium">{ex.name}</div>
                          <div className="text-xs text-muted-foreground">{when} • Package: {p?.packageHours} hrs</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <a href={s.link} target="_blank" rel="noreferrer"><BrandButton>Join meeting</BrandButton></a>
                        <Button variant="destructive" disabled={!canCancel(s)} onClick={()=>startCancel(s)}>Cancel</Button>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Past sessions</CardTitle>
                <CardDescription>Hours used and amount billed</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">{renderPastSummaries(mySessions, purchases)}</CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Cancelled sessions</CardTitle>
                <CardDescription>These were cancelled ≥24h in advance</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                {mySessions.filter((s)=>s.status==='cancelled').length===0 && <div className="text-sm text-muted-foreground">No cancellations</div>}
                {mySessions.filter((s)=>s.status==='cancelled').sort((a,b)=>dateTimeMin(b)-dateTimeMin(a)).map((s)=>{
                  const ex = MOCK_EXPERTS.find((e)=>e.id===s.expertId);
                  return (
                    <div key={s.id} className="flex items-center justify-between gap-3 border border-red-300 bg-red-50 rounded-xl p-3 text-red-700">
                      <div>
                        <div className="font-medium">{ex?.name} • Cancelled</div>
                        <div className="text-xs">{s.date} • {minutesToTimeStr(s.startMin)}-{minutesToTimeStr(s.endMin)}</div>
                        {s.cancelReason && <div className="text-xs">Reason: {s.cancelReason}</div>}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </TabsContent>

          {/* PROFILE */}
          <TabsContent value="profile" className="mt-4 space-y-4">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>My profile</CardTitle>
                <CardDescription>Your details and billing summary</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <div className="text-sm"><b>Name:</b> {user.name}</div>
                  <div className="text-sm"><b>Email:</b> {user.email}</div>
                  <div className="text-sm"><b>Role:</b> {user.role}</div>
                </div>
                {(() => {
                  const myPurchases = purchases.filter(p=>p.userId===user.id);
                  const myPayments = (clientPayments||[]).filter(p=>p.userId===user.id);
                  const totalAmount = myPurchases.reduce((s,p)=> s + Number(p.amount||0), 0);
                  const totalPaid = myPayments.reduce((s,p)=> s + Number(p.amount||0), 0);
                  const outstanding = Math.max(0, totalAmount - totalPaid);
                  const hoursPurchased = myPurchases.reduce((s,p)=> s + Number(p.packageHours||0), 0);
                  const hoursRemaining = myPurchases.reduce((s,p)=> s + Number(p.hoursRemaining||0), 0);
                  const hoursUsed = Math.max(0, hoursPurchased - hoursRemaining);
                  return (
                    <div className="grid gap-2">
                      <div className="text-sm"><b>Total amount (purchases):</b> {rupee(totalAmount)}</div>
                      <div className="text-sm"><b>Total paid:</b> {rupee(totalPaid)}</div>
                      <div className="text-sm"><b>Total outstanding:</b> {rupee(outstanding)}</div>
                      <div className="text-sm"><b>Hours purchased:</b> {hoursPurchased} hr</div>
                      <div className="text-sm"><b>Hours used:</b> {hoursUsed} hr</div>
                      <div className="text-sm"><b>Hours remaining:</b> {hoursRemaining} hr</div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* BOOK: PICK PACKAGE */}
      <Dialog open={pickPkgOpen} onOpenChange={setPickPkgOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Book consultation</DialogTitle>
            <DialogDescription>
              {selectedExpert ? (
                <div className="mt-2 flex items-center gap-2">
                  <Avatar name={selectedExpert.name} />
                  <div>
                    <div className="font-medium">{selectedExpert.name}</div>
                    {(() => { const ar = aggRatingForExpert(selectedExpert.id); return (
                      <Stars value={(ar?.value) || selectedExpert.rating} count={ar?.count || 0} />
                    ); })()}
                  </div>
                </div>
              ) : null}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="text-sm font-medium">Choose package</div>
            <div className="grid grid-cols-2 gap-2">
              {PACKAGE_HOURS.map((h) => (
                <Button key={h} variant={selectedHours === h ? "default" : "outline"} className="h-16 text-lg" onClick={() => setSelectedHours(h)}>{h} hr{h > 1 ? "s" : ""}</Button>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPickPkgOpen(false)}>Cancel</Button>
            <BrandButton onClick={continueToConfirm}>Continue</BrandButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* BOOK: CONFIRM PURCHASE */}
      <Dialog open={confirmBuyOpen} onOpenChange={setConfirmBuyOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm purchase</DialogTitle>
            <DialogDescription>Review details and accept terms</DialogDescription>
          </DialogHeader>
          {selectedExpert && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div><div className="font-medium">{selectedExpert.name}</div><div className="text-xs text-muted-foreground">{selectedHours} hr package</div></div>
                <div className="text-lg font-semibold">{rupee(selectedExpert.rate * selectedHours)}</div>
              </div>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={acceptTermsBuy} onChange={(e) => setAcceptTermsBuy(e.target.checked)} />I accept the terms and conditions</label>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmBuyOpen(false)}>Back</Button>
            <BrandButton onClick={confirmPurchase}>Confirm purchase</BrandButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* SCHEDULE: PICK DATE & SLOTS (MULTI-SELECT) */}
      <Dialog open={chooseDateOpen} onOpenChange={setChooseDateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Choose date and time</DialogTitle>
            <DialogDescription>Select 30-minute slots</DialogDescription>
          </DialogHeader>
          {selectedPurchase && (
            <DateAndSlots purchase={selectedPurchase} scheduleDate={scheduleDate} setScheduleDate={setScheduleDate} sessions={sessions} availOverrides={availOverrides} expSlots={expSlots} selectedSlots={selectedSlots} setSelectedSlots={setSelectedSlots} />
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setChooseDateOpen(false)}>Close</Button>
            <BrandButton disabled={selectedSlots.length===0} onClick={() => { setChooseDateOpen(false); setConfirmSlotOpen(true); }}>Review & continue</BrandButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* SCHEDULE: CONFIRM SLOTS */}
      <Dialog open={confirmSlotOpen} onOpenChange={setConfirmSlotOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm {selectedSlots.length>1?`${selectedSlots.length} slots`:'slot'}</DialogTitle>
            <DialogDescription>Check details and accept terms</DialogDescription>
          </DialogHeader>
          {selectedPurchase && selectedSlots && selectedSlots.length>0 && (
            <div className="space-y-3">
              {(() => {
                const expert = MOCK_EXPERTS.find((e) => e.id === selectedPurchase.expertId);
                return (
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{expert.name}</div>
                      <div className="text-xs text-muted-foreground">{scheduleDate}</div>
                    </div>
                    <Avatar name={expert.name} />
                  </div>
                );
              })()}
              <div className="grid gap-1 text-sm">
                {selectedSlots.sort((a,b)=>a.start-b.start).map((s)=> (
                  <div key={s.start} className="flex items-center justify-between border rounded-md px-2 py-1">
                    <div>{minutesToTimeStr(s.start)} - {minutesToTimeStr(s.end)}</div>
                    <Button size="icon" variant="ghost" onClick={()=>setSelectedSlots(selectedSlots.filter(x=>x.start!==s.start))}><X className="h-4 w-4"/></Button>
                  </div>
                ))}
              </div>
              <div className="text-sm">Total time: <b>{(selectedSlots.length * SLOT_MIN)/60} hr</b> • Will deduct from package</div>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={acceptTermsSlot} onChange={(e) => setAcceptTermsSlot(e.target.checked)} />I accept the terms and conditions</label>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setConfirmSlotOpen(false); setChooseDateOpen(true); }}>Back</Button>
            <BrandButton onClick={confirmSlot}>Confirm</BrandButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* FEEDBACK: RATE EXPERT AFTER PACKAGE EXHAUSTED & ALL SESSIONS COMPLETED */}
      <Dialog open={feedbackOpen} onOpenChange={setFeedbackOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>How was your experience?</DialogTitle>
            <DialogDescription>Please rate your expert and share feedback</DialogDescription>
          </DialogHeader>
          {fbTarget && (
            <div className="space-y-4">
              {(() => { const expert = MOCK_EXPERTS.find((e) => e.id === fbTarget.expertId); return (
                <div className="flex items-center gap-3"><Avatar name={expert.name} /><div><div className="font-medium">{expert.name}</div><div className="text-xs text-muted-foreground">Package exhausted • All sessions completed</div></div></div>
              ); })()}
              <div className="flex items-center gap-2">
                {[1,2,3,4,5].map((n) => (
                  <button key={n} onClick={() => setFbRating(n)} className={`p-1 ${fbRating>=n?'':'opacity-40'}`} aria-label={`${n} star`}>
                    <Star className={`h-6 w-6 ${fbRating>=n?'fill-current':''}`} style={{ color: "var(--brand-primary)" }} />
                  </button>
                ))}
                <span className="text-sm ml-2">{fbRating>0?`${fbRating} / 5`:"Select stars"}</span>
              </div>
              <div className="grid gap-2">
                <Label>Feedback (optional)</Label>
                <textarea className="border rounded-md p-2 text-sm min-h-[80px]" value={fbText} onChange={(e)=>setFbText(e.target.value)} placeholder="Share what went well or what we can improve" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={()=>setFeedbackOpen(false)}>Later</Button>
            <BrandButton onClick={() => {
              if (!fbTarget) return;
              if (fbRating<=0) return toast.error('Please select a star rating');
              const rec = { id: uuidv4(), userId: user.id, expertId: fbTarget.expertId, purchaseId: fbTarget.purchaseId, rating: fbRating, text: fbText.trim(), createdAt: new Date().toISOString() };
              setFeedback((prev)=>[rec, ...prev]);
              setFeedbackOpen(false);
              toast.success('Thanks for your feedback!');
            }}>Submit feedback</BrandButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CANCEL: ask reason & confirm */}
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel session</DialogTitle>
            <DialogDescription>Provide a reason and confirm. You can cancel up to 24 hours before start.</DialogDescription>
          </DialogHeader>
          {cancelTarget && (
            <div className="space-y-3 text-sm">
              <div className="text-muted-foreground">{cancelTarget.date} • {minutesToTimeStr(cancelTarget.startMin)}-{minutesToTimeStr(cancelTarget.endMin)}</div>
              <div className="grid gap-1">
                <Label>Reason</Label>
                <textarea className="border rounded-md p-2" value={cancelReason} onChange={(e)=>setCancelReason(e.target.value)} placeholder="E.g., conflict at the same time" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={()=>setCancelOpen(false)}>Close</Button>
            <BrandButton onClick={confirmCancel}>Confirm cancellation</BrandButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/****************
 * EXPERT DASH  *
 ****************/
function ExpertDashboard({ brand, user, onLogout, sessions, setSessions, availOverrides, setAvailOverrides, expSlots, setExpSlots, purchases, setPurchases, onReset }) {
  const expertId = user.expertId;
  const expert = MOCK_EXPERTS.find((e) => e.id === expertId);
  const [tab, setTab] = useState("availability");

  const myUpcoming = sessions.filter((s) => s.expertId === expertId && sessionIsUpcoming(s) && s.status!=='cancelled').sort((a, b) => dateTimeMin(a) - dateTimeMin(b));
  const myPast = sessions.filter((s) => s.expertId === expertId && !sessionIsUpcoming(s));
  const myCancelled = sessions.filter((s)=> s.expertId===expertId && s.status==='cancelled');
  const earned = myPast.reduce((sum,s)=> sum + ((s.endMin - s.startMin)/60) * expert.rate, 0);

  // availability editor state
  const [dateISO, setDateISO] = useState(ymd(new Date()));
  const existing = availOverrides.find((o) => o.expertId === expertId && o.date === dateISO);
  const [workday, setWorkday] = useState(existing ? existing.workday : true);
  const [dayStart, setDayStart] = useState(existing ? existing.dayStart : expert.dayStart);
  const [dayEnd, setDayEnd] = useState(existing ? existing.dayEnd : expert.dayEnd);

  useEffect(() => {
    const ex = availOverrides.find((o) => o.expertId === expertId && o.date === dateISO);
    setWorkday(ex ? ex.workday : true);
    setDayStart(ex ? ex.dayStart : expert.dayStart);
    setDayEnd(ex ? ex.dayEnd : expert.dayEnd);
  }, [dateISO, expertId, availOverrides, expert.dayStart, expert.dayEnd]);

  // explicit windows for this date
  const manualRec = expSlots.find((r) => r.expertId === expertId && r.date === dateISO);
  const manualWindows = (manualRec?.windows) || (manualRec?.slots) || [];
  const [newWindowStart, setNewWindowStart] = useState(dayStart);
  const [newWindowEnd, setNewWindowEnd] = useState(minutesToTimeStr(Math.min(timeStrToMinutes(dayStart) + SLOT_MIN*2, timeStrToMinutes(expert.dayEnd))));
  useEffect(() => { setNewWindowStart(dayStart); setNewWindowEnd(minutesToTimeStr(Math.min(timeStrToMinutes(dayStart) + SLOT_MIN*2, timeStrToMinutes(expert.dayEnd)))); }, [dateISO, dayStart, expert.dayEnd]);

  const dateSessions = sessions.filter((s) => s.expertId === expertId && s.date === dateISO && s.status!=='cancelled');

  function addWindow() {
    const start = timeStrToMinutes(newWindowStart);
    const end = timeStrToMinutes(newWindowEnd);
    if (end <= start) return toast.error("End must be after start");
    if ((end - start) < SLOT_MIN) return toast.error(`Minimum window is ${SLOT_MIN} minutes`);
    if (manualWindows.some((w) => overlaps(w.start, w.end, start, end))) return toast.error("Overlaps existing window");
    if (dateSessions.some((x) => overlaps(x.startMin, x.endMin, start, end))) return toast.error("Clashes with a booked session");
    let next;
    if (manualRec) {
      const windows = (manualRec.windows || manualRec.slots || []);
      next = expSlots.map((r) => (r === manualRec ? { ...r, windows: [...windows, { start, end }].sort((a,b)=>a.start-b.start) } : r));
    } else {
      next = [{ id: uuidv4(), expertId, date: dateISO, windows: [{ start, end }] }, ...expSlots];
    }
    setExpSlots(next);
    toast.success("Window added");
  }

  function removeWindow(start) {
    if (!manualRec) return;
    const windows = (manualRec.windows || manualRec.slots || []);
    const nextWindows = windows.filter((w) => w.start !== start);
    const next = nextWindows.length ? expSlots.map((r) => (r === manualRec ? { ...r, windows: nextWindows } : r)) : expSlots.filter((r) => !(r.expertId === expertId && r.date === dateISO));
    setExpSlots(next);
  }

  function clearWindowsForDate() { setExpSlots(expSlots.filter((r) => !(r.expertId === expertId && r.date === dateISO))); toast.success("Cleared all windows for this date"); }

  function saveOverride() {
    const exists = availOverrides.find((o) => o.expertId === expertId && o.date === dateISO);
    let next;
    if (exists) next = availOverrides.map((o) => (o.expertId === expertId && o.date === dateISO ? { ...exists, workday, dayStart, dayEnd } : o));
    else next = [{ id: uuidv4(), expertId, date: dateISO, workday, dayStart, dayEnd }, ...availOverrides];
    setAvailOverrides(next);
    toast.success("Availability updated for the day");
  }
  function clearOverride(id) { setAvailOverrides((prev) => prev.filter((o) => o.id !== id)); }

  // expert-side cancellation
  function canCancel(s) { return s.status !== 'cancelled' && (dateTimeMin(s) - Date.now() >= 24*60*60*1000); }
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  function startCancel(s){ setCancelTarget(s); setCancelReason(""); setCancelOpen(true);}  
  function confirmCancel(){
    if(!cancelTarget) return; if(!canCancel(cancelTarget)){ toast.error("Only up to 24h before"); setCancelOpen(false); return; }
    if(!cancelReason.trim()){ toast.error("Please provide a reason"); return; }
    setSessions((prev)=> prev.map(x=> x.id===cancelTarget.id? { ...x, status:'cancelled', cancelReason: cancelReason.trim(), cancelledBy: user.id, cancelledAt: new Date().toISOString() }: x));
    // refund client hours
    const mins = cancelTarget.endMin - cancelTarget.startMin;
    setPurchases((prev)=> prev.map(p=> p.id===cancelTarget.purchaseId? { ...p, hoursRemaining: Number(Math.min(p.packageHours, (p.hoursRemaining + mins/60)).toFixed(2)) }: p));
    setCancelOpen(false); toast.success("Session cancelled");
  }

  const myOverrides = availOverrides.filter((o) => o.expertId === expertId).sort((a, b) => (a.date > b.date ? 1 : -1));

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <BrandHeader brand={brand} userName={user.name} onLogout={onLogout} onReset={onReset} />

      <main className="max-w-6xl mx-auto p-4 md:p-6">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid grid-cols-4 w-full max-w-2xl">
            <TabsTrigger value="availability">Manage Availability</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="completed">Completed & Earnings</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
          </TabsList>

          <TabsContent value="availability" className="mt-4 grid gap-4 md:grid-cols-3">
            <Card className="md:col-span-2 shadow-sm">
              <CardHeader>
                <CardTitle>Set availability for a date</CardTitle>
                <CardDescription>Override your default working hours</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-3">
                <div className="grid gap-2"><Label>Date</Label><Input type="date" value={dateISO} onChange={(e) => setDateISO(e.target.value)} /></div>
                <div className="flex items-center gap-2"><Switch checked={workday} onCheckedChange={setWorkday} /><span className="text-sm">Working this day</span></div>
                <div className="grid gap-2"><Label>Start</Label><Input type="time" value={dayStart} onChange={(e) => setDayStart(e.target.value)} /></div>
                <div className="grid gap-2"><Label>End</Label><Input type="time" value={dayEnd} onChange={(e) => setDayEnd(e.target.value)} /></div>
              </CardContent>
              <CardFooter><BrandButton onClick={saveOverride}><Edit3 className="h-4 w-4 mr-2"/>Save for this date</BrandButton></CardFooter>
            </Card>

            <Card className="md:col-span-1 shadow-sm">
              <CardHeader>
                <CardTitle>Declare time windows (this date)</CardTitle>
                <CardDescription>Clients will see 30-min slots inside these windows on {dateISO}.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="grid gap-2">
                    <Label>Start</Label>
                    <Input type="time" step="1800" value={newWindowStart} onChange={(e)=>setNewWindowStart(e.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <Label>End</Label>
                    <Input type="time" step="1800" value={newWindowEnd} onChange={(e)=>setNewWindowEnd(e.target.value)} />
                  </div>
                </div>
                <div>
                  <BrandButton onClick={addWindow}><Plus className="h-4 w-4 mr-2"/>Add window</BrandButton>
                </div>
                <div className="grid gap-2">
                  <Label>Windows for {dateISO}</Label>
                  {manualWindows.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No windows yet.</div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {manualWindows.map((w) => (
                        <div key={w.start} className="flex items-center gap-2 border rounded-full px-3 py-1">
                          <span className="text-sm">{minutesToTimeStr(w.start)} - {minutesToTimeStr(w.end)}</span>
                          <Button size="icon" variant="ghost" onClick={() => removeWindow(w.start)}><Trash2 className="h-4 w-4"/></Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
              {manualWindows.length > 0 && (
                <CardFooter>
                  <Button variant="outline" onClick={clearWindowsForDate}>Clear all for this date</Button>
                </CardFooter>
              )}
            </Card>

            <Card className="shadow-sm md:col-span-3">
              <CardHeader><CardTitle>My date overrides</CardTitle><CardDescription>Custom working hours & days off</CardDescription></CardHeader>
              <CardContent className="grid gap-2">
                {myOverrides.length === 0 && <div className="text-sm text-muted-foreground">No overrides yet.</div>}
                {myOverrides.map((o) => (
                  <div key={o.id} className="flex items-center justify-between gap-2 border rounded-xl p-2">
                    <div className="text-sm">{o.date} • {o.workday ? `${o.dayStart}-${o.dayEnd}` : "Day off"}</div>
                    <Button size="icon" variant="destructive" onClick={() => clearOverride(o.id)}><Trash2 className="h-4 w-4"/></Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="upcoming" className="mt-4">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>My upcoming sessions</CardTitle>
                <CardDescription>Join or cancel (≥24h prior)</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                {myUpcoming.length === 0 && (
                  <div className="text-sm text-muted-foreground">No upcoming sessions</div>
                )}
                {myUpcoming.map((s) => {
                  const when = `${s.date} • ${minutesToTimeStr(s.startMin)}-${minutesToTimeStr(s.endMin)}`;
                  return (
                    <div key={s.id} className="flex items-center justify-between gap-3 border rounded-xl p-3">
                      <div>
                        <div className="font-medium">{when}</div>
                        <div className="text-xs text-muted-foreground">Client: {clientName(s.userId)}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <a href={s.link} target="_blank" rel="noreferrer"><BrandButton>Join</BrandButton></a>
                        <Button variant="destructive" disabled={!canCancel(s)} onClick={()=>startCancel(s)}>Cancel</Button>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="completed" className="mt-4 grid gap-4">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Completed sessions</CardTitle>
                <CardDescription>Past meetings</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                {myPast.length === 0 && (
                  <div className="text-sm text-muted-foreground">No completed sessions</div>
                )}
                {myPast.sort((a,b)=>dateTimeMin(b)-dateTimeMin(a)).map((s) => {
                  const when = `${s.date} • ${minutesToTimeStr(s.startMin)}-${minutesToTimeStr(s.endMin)}`;
                  return (
                    <div key={s.id} className="flex items-center justify-between gap-3 border rounded-xl p-3">
                      <div>
                        <div className="font-medium">{when}</div>
                        <div className="text-xs text-muted-foreground">Client: {clientName(s.userId)}</div>
                      </div>
                      <div className="text-sm">{rupee(((s.endMin - s.startMin)/60) * expert.rate)}</div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Total earned</CardTitle>
                <CardDescription>Based on completed sessions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">{rupee(earned)}</div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cancelled" className="mt-4">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Cancelled sessions</CardTitle>
                <CardDescription>Visible to both client and expert</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                {myCancelled.length===0 && <div className="text-sm text-muted-foreground">No cancellations</div>}
                {myCancelled.sort((a,b)=>dateTimeMin(b)-dateTimeMin(a)).map((s)=> (
                  <div key={s.id} className="border border-red-300 bg-red-50 rounded-xl p-3 text-red-700">
                    <div className="font-medium">{s.date} • {minutesToTimeStr(s.startMin)}-{minutesToTimeStr(s.endMin)}</div>
                    <div className="text-xs">Client: {clientName(s.userId)}</div>
                    {s.cancelReason && <div className="text-xs mt-1">Reason: {s.cancelReason}</div>}
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Expert cancel modal */}
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel session</DialogTitle>
            <DialogDescription>Provide a reason and confirm. Allowed up to 24 hours before start.</DialogDescription>
          </DialogHeader>
          {cancelTarget && (
            <div className="space-y-3 text-sm">
              <div className="text-muted-foreground">{cancelTarget.date} • {minutesToTimeStr(cancelTarget.startMin)}-{minutesToTimeStr(cancelTarget.endMin)}</div>
              <div className="grid gap-1">
                <Label>Reason</Label>
                <textarea className="border rounded-md p-2" value={cancelReason} onChange={(e)=>setCancelReason(e.target.value)} placeholder="E.g., urgent conflict" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={()=>setCancelOpen(false)}>Close</Button>
            <BrandButton onClick={confirmCancel}>Confirm cancellation</BrandButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/****************
 * ADMIN DASH   *
 ****************/
function AdminDashboard({ brand, setBrand, user, onLogout, users, setUsers, sessions, purchases, payouts, setPayouts, clientPayments, setClientPayments, onReset }) {
  const [tab, setTab] = useState("users");

  function addUser(newUser) { setUsers((prev) => [{ ...newUser, id: uuidv4(), active: true }, ...prev]); toast.success("User added"); }
  function toggleActive(id) { setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, active: !u.active } : u))); }
  function deleteUser(id) { setUsers((prev) => prev.filter((u) => u.id !== id)); }

  function totalEarnedForExpert(expertId) {
    const ex = MOCK_EXPERTS.find((e) => e.id === expertId);
    const past = sessions.filter((s) => s.expertId === expertId && !sessionIsUpcoming(s));
    return past.reduce((sum, s) => sum + ((s.endMin - s.startMin)/60) * (ex?.rate || 0), 0);
  }
  function totalPaidToExpert(expertId) { return payouts.filter((p) => p.expertId === expertId).reduce((sum, p) => sum + Number(p.amount || 0), 0); }
  function recordPayout(expertId, amount) {
    if (!amount || Number(amount) <= 0) return toast.error("Enter an amount");
    setPayouts((prev) => [{ id: uuidv4(), expertId, amount: Number(amount), createdAt: new Date().toISOString() }, ...prev]);
    toast.success("Payout recorded");
  }

  const upcomingAll = sessions.filter((s)=> s.status!=='cancelled' && sessionIsUpcoming(s)).sort((a, b) => dateTimeMin(a) - dateTimeMin(b));
  const pastAll = sessions.filter((s) => s.status!=='cancelled' && !sessionIsUpcoming(s)).sort((a, b) => dateTimeMin(b) - dateTimeMin(a));
  const cancelledAll = sessions.filter((s)=> s.status==='cancelled').sort((a,b)=>dateTimeMin(b)-dateTimeMin(a));

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <BrandHeader brand={brand} userName={user.name} onLogout={onLogout} onReset={onReset} />

      <main className="max-w-6xl mx-auto p-4 md:p-6">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid grid-cols-5 w-full max-w-4xl">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
            <TabsTrigger value="purchases">Purchases</TabsTrigger>
            <TabsTrigger value="payouts">Payouts</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
          </TabsList>

          {/* USERS */}
          <TabsContent value="users" className="mt-4 grid gap-4 md:grid-cols-2">
            <Card className="shadow-sm">
              <CardHeader><CardTitle>All users</CardTitle><CardDescription>Experts, clients & admins</CardDescription></CardHeader>
              <CardContent className="grid gap-2">
                {users.length === 0 && <div className="text-sm text-muted-foreground">No users</div>}
                {users.map((u) => (
                  <div key={u.id} className="flex items-center justify-between gap-2 border rounded-xl p-2">
                    <div>
                      <div className="font-medium">{u.name} <span className="text-xs text-muted-foreground">({u.role})</span></div>
                      <div className="text-xs text-muted-foreground">{u.email}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={u.active !== false} onCheckedChange={() => toggleActive(u.id)} />
                      <Button variant="destructive" size="sm" onClick={() => deleteUser(u.id)}>Delete</Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader><CardTitle>Add user</CardTitle><CardDescription>Quick create</CardDescription></CardHeader>
              <CardContent className="grid gap-2">
                <AddUserForm onSubmit={addUser} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* SESSIONS */}
          <TabsContent value="sessions" className="mt-4 grid gap-4">
            <Card className="shadow-sm">
              <CardHeader><CardTitle>Upcoming sessions</CardTitle><CardDescription>Across all experts & clients</CardDescription></CardHeader>
              <CardContent className="grid gap-3">
                {upcomingAll.length === 0 && <div className="text-sm text-muted-foreground">No upcoming sessions</div>}
                {upcomingAll.map((s) => {
                  const ex = MOCK_EXPERTS.find((e) => e.id === s.expertId);
                  return (
                    <div key={s.id} className="flex items-center justify-between gap-3 border rounded-xl p-3">
                      <div>
                        <div className="font-medium">{s.date} • {minutesToTimeStr(s.startMin)}-{minutesToTimeStr(s.endMin)}</div>
                        <div className="text-xs text-muted-foreground">Expert: {ex?.name} • Client: {clientName(s.userId)}</div>
                      </div>
                      <a href={s.link} target="_blank" rel="noreferrer"><BrandButton>Join</BrandButton></a>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader><CardTitle>Cancelled sessions</CardTitle><CardDescription>All cancellations & reasons</CardDescription></CardHeader>
              <CardContent className="grid gap-3">
                {cancelledAll.length === 0 && <div className="text-sm text-muted-foreground">No cancellations</div>}
                {cancelledAll.map((s) => {
                  const ex = MOCK_EXPERTS.find((e) => e.id === s.expertId);
                  return (
                    <div key={s.id} className="border border-red-300 bg-red-50 rounded-xl p-3 text-red-700">
                      <div className="font-medium">{s.date} • {minutesToTimeStr(s.startMin)}-{minutesToTimeStr(s.endMin)}</div>
                      <div className="text-xs">Expert: {ex?.name} • Client: {clientName(s.userId)}</div>
                      {s.cancelReason && <div className="text-xs">Reason: {s.cancelReason}</div>}
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader><CardTitle>Past sessions</CardTitle><CardDescription>Completed meetings</CardDescription></CardHeader>
              <CardContent className="grid gap-3">
                {pastAll.length === 0 && <div className="text-sm text-muted-foreground">No past sessions</div>}
                {pastAll.map((s) => {
                  const ex = MOCK_EXPERTS.find((e) => e.id === s.expertId);
                  return (
                    <div key={s.id} className="flex items-center justify-between gap-3 border rounded-xl p-3">
                      <div>
                        <div className="font-medium">{s.date} • {minutesToTimeStr(s.startMin)}-{minutesToTimeStr(s.endMin)}</div>
                        <div className="text-xs text-muted-foreground">Expert: {ex?.name} • Client: {clientName(s.userId)}</div>
                      </div>
                      <div className="text-sm">{rupee(((s.endMin - s.startMin)/60) * (ex?.rate || 0))}</div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </TabsContent>

          {/* PURCHASES */}
          <TabsContent value="purchases" className="mt-4">
            <Card className="shadow-sm">
              <CardHeader><CardTitle>All purchases</CardTitle><CardDescription>Packages bought by clients</CardDescription></CardHeader>
              <CardContent className="grid gap-3">
                {purchases.length === 0 && <div className="text-sm text-muted-foreground">No purchases</div>}
                {purchases.map((p) => {
                  const ex = MOCK_EXPERTS.find((e) => e.id === p.expertId);
                  const u = users.find((x) => x.id === p.userId);
                  return (
                    <div key={p.id} className="flex items-center justify-between gap-3 border rounded-xl p-3">
                      <div>
                        <div className="font-medium">{u?.name} → {ex?.name}</div>
                        <div className="text-xs text-muted-foreground">{p.packageHours} hrs • Left: {p.hoursRemaining} • {new Date(p.createdAt).toLocaleString()}</div>
                      </div>
                      <div className="text-sm">{rupee(p.amount)}</div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </TabsContent>

          {/* PAYOUTS & BILLING */}
          <TabsContent value="payouts" className="mt-4 grid gap-4 md:grid-cols-2">
            <Card className="shadow-sm">
              <CardHeader><CardTitle>Expert earnings (due)</CardTitle><CardDescription>Completed sessions × hourly rate</CardDescription></CardHeader>
              <CardContent className="grid gap-3">
                {MOCK_EXPERTS.map((ex) => {
                  const earned = totalEarnedForExpert(ex.id);
                  const paid = totalPaidToExpert(ex.id);
                  const due = Math.max(0, earned - paid);
                  return (
                    <div key={ex.id} className="flex items-center justify-between gap-2 border rounded-xl p-3">
                      <div>
                        <div className="font-medium">{ex.name}</div>
                        <div className="text-xs text-muted-foreground">Earned: {rupee(earned)} • Paid: {rupee(paid)}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-medium">Due: {rupee(due)}</div>
                        <BrandButton onClick={() => {
                          const amt = prompt(`Record payout for ${ex.name} (₹):`, String(due));
                          if (amt != null) recordPayout(ex.id, Number(amt));
                        }}>Record payout</BrandButton>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader><CardTitle>Payout history</CardTitle><CardDescription>All recorded payouts</CardDescription></CardHeader>
              <CardContent className="grid gap-3">
                {payouts.length === 0 && <div className="text-sm text-muted-foreground">No payouts yet</div>}
                {payouts.map((p) => {
                  const ex = MOCK_EXPERTS.find((e) => e.id === p.expertId);
                  return (
                    <div key={p.id} className="flex items-center justify-between gap-3 border rounded-xl p-3">
                      <div>
                        <div className="font-medium">{ex?.name}</div>
                        <div className="text-xs text-muted-foreground">{new Date(p.createdAt).toLocaleString()}</div>
                      </div>
                      <div className="text-sm">{rupee(p.amount)}</div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing" className="mt-4 grid gap-4">
            <Card className="shadow-sm">
              <CardHeader><CardTitle>Client billing summary</CardTitle><CardDescription>Total purchases vs payments</CardDescription></CardHeader>
              <CardContent className="grid gap-3">
                {[...users.filter(u=>u.role==='client')].map((u)=>{
                  const ups = purchases.filter(p=>p.userId===u.id);
                  const pays = (clientPayments||[]).filter(p=>p.userId===u.id);
                  const total = ups.reduce((s,p)=>s+Number(p.amount||0),0);
                  const paid = pays.reduce((s,p)=>s+Number(p.amount||0),0);
                  const due = Math.max(0, total - paid);
                  return (
                    <div key={u.id} className="flex items-center justify-between gap-3 border rounded-xl p-3">
                      <div>
                        <div className="font-medium">{u.name}</div>
                        <div className="text-xs text-muted-foreground">Total: {rupee(total)} • Paid: {rupee(paid)} • Due: {rupee(due)}</div>
                      </div>
                      <BrandButton onClick={()=>{
                        const amt = prompt(`Record payment from ${u.name} (₹):`, "");
                        if(amt && Number(amt)>0){
                          setClientPayments((prev)=> [{id: uuidv4(), userId: u.id, amount: Number(amt), createdAt: new Date().toISOString()}, ...prev]);
                          toast.success("Payment recorded");
                        }
                      }}>Record payment</BrandButton>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

/****************
 * ADMIN HELPERS
 ****************/
function AddUserForm({ onSubmit }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("client");
  const [expertId, setExpertId] = useState("");

  function submit() {
    if (!name || !email || !username || !password) return toast.error("Fill all fields");
    if (role === "expert" && !expertId) return toast.error("Pick expert mapping");
    onSubmit({ name, email, username, password, role, expertId: role === "expert" ? expertId : undefined });
    setName(""); setEmail(""); setUsername(""); setPassword(""); setRole("client"); setExpertId("");
  }

  return (
    <div className="grid gap-3">
      <div className="grid gap-1"><Label>Name</Label><Input value={name} onChange={(e)=>setName(e.target.value)} /></div>
      <div className="grid gap-1"><Label>Email</Label><Input value={email} onChange={(e)=>setEmail(e.target.value)} /></div>
      <div className="grid gap-1"><Label>Username</Label><Input value={username} onChange={(e)=>setUsername(e.target.value)} /></div>
      <div className="grid gap-1"><Label>Password</Label><Input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} /></div>
      <div className="grid gap-1">
        <Label>Role</Label>
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger><SelectValue placeholder="Pick role" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="client">Client</SelectItem>
            <SelectItem value="expert">Expert</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {role === "expert" && (
        <div className="grid gap-1">
          <Label>Map to Expert</Label>
          <Select value={expertId} onValueChange={setExpertId}>
            <SelectTrigger><SelectValue placeholder="Pick expert" /></SelectTrigger>
            <SelectContent>
              {MOCK_EXPERTS.map((ex)=>(<SelectItem key={ex.id} value={ex.id}>{ex.name}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
      )}
      <BrandButton onClick={submit}>Add</BrandButton>
    </div>
  );
}

/****************
 * CLIENT: Date & Slots picker (multi-select + no past)
 ****************/
function DateAndSlots({ purchase, scheduleDate, setScheduleDate, sessions, availOverrides, expSlots, selectedSlots, setSelectedSlots }) {
  const expert = MOCK_EXPERTS.find((e) => e.id === purchase.expertId);
  const allSlots = computeSlotsForDate(expert, scheduleDate, sessions, availOverrides, expSlots);

  const today = ymd(new Date());
  const now = new Date();
  const nowMin = now.getHours()*60 + now.getMinutes();
  const slots = allSlots.filter((s)=> !(scheduleDate < today || (scheduleDate===today && s.start <= nowMin)));

  // Limit selection by available hours
  const maxPick = Math.floor((purchase.hoursRemaining + 1e-6) / (SLOT_MIN/60));
  const pick = (slot) => {
    const exists = selectedSlots.find((s)=>s.start===slot.start);
    if (exists) setSelectedSlots(selectedSlots.filter((s)=>s.start!==slot.start));
    else {
      if (selectedSlots.length >= maxPick) return toast.error("Not enough hours remaining for more slots");
      setSelectedSlots([...selectedSlots, slot]);
    }
  };
  const atCapacity = selectedSlots.length >= maxPick;

  return (
    <div className="space-y-4">
      <div className="grid gap-1 text-sm"><div className="text-xs text-muted-foreground">Expert</div><div className="font-medium">{expert.name}</div></div>
      <div className="grid gap-2"><Label>Date</Label><Input type="date" value={scheduleDate} onChange={(e) => { setSelectedSlots([]); setScheduleDate(e.target.value); }} /></div>
      <div className="grid gap-2">
        <Label>Available time slots</Label>
        {slots.length === 0 ? (
          <div className="text-sm text-muted-foreground">No slots on this day. The expert may not have added windows for this date.</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {slots.map((s) => {
              const active = !!selectedSlots.find((x)=>x.start===s.start);
              return (
                <Button key={s.start} variant={active?"default":"outline"} onClick={() => pick(s)} disabled={!active && atCapacity}>
                  {minutesToTimeStr(s.start)} - {minutesToTimeStr(s.end)}
                </Button>
              );
            })}
          </div>
        )}
        <div className="text-xs text-muted-foreground">Selected: {selectedSlots.length} • You can pick up to {maxPick} slot{maxPick!==1?'s':''} based on remaining hours.</div>
      </div>
    </div>
  );
}

/****************
 * HELPERS
 ****************/
function sessionIsUpcoming(s) { const dt = new Date(`${s.date}T00:00:00`); dt.setMinutes(dt.getMinutes() + s.startMin); return dt.getTime() > Date.now(); }
function dateTimeMin(s) { const dt = new Date(`${s.date}T00:00:00`); dt.setMinutes(dt.getMinutes() + s.startMin); return dt.getTime(); }
function clientName(id) { const u = loadLS(LS_USERS, MOCK_USERS).find((x) => x.id === id); return u?.name || "Client"; }

function renderPastSummaries(mySessions, purchases) {
  const past = mySessions.filter((s) => !sessionIsUpcoming(s) && s.status!== 'cancelled');
  if (past.length === 0) return <div className="text-sm text-muted-foreground">No past sessions yet.</div>;
  return past.sort((a,b)=>dateTimeMin(b)-dateTimeMin(a)).map((s) => {
    const ex = MOCK_EXPERTS.find((e) => e.id === s.expertId);
    const p = purchases.find((x) => x.id === s.purchaseId);
    const hrs = (s.endMin - s.startMin)/60;
    return (
      <div key={s.id} className="flex items-center justify-between gap-3 border rounded-xl p-3">
        <div>
          <div className="font-medium">{ex?.name}</div>
          <div className="text-xs text-muted-foreground">{s.date} • {minutesToTimeStr(s.startMin)}-{minutesToTimeStr(s.endMin)} • Package: {p?.packageHours} hrs</div>
        </div>
        <div className="text-sm">{rupee((ex?.rate || 0) * hrs)}</div>
      </div>
    );
  });
}

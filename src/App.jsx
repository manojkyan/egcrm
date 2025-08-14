
import React, { useEffect, useState } from "react";
import { Routes, Route, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { io } from "socket.io-client";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";
axios.defaults.baseURL = API;

function useAuth(){
  const [user, setUser] = useState(()=> JSON.parse(localStorage.getItem("user")||"null"));
  const token = localStorage.getItem("token");
  axios.defaults.headers.common["Authorization"] = token ? `Bearer ${token}` : "";
  return { user, setUser };
}

function Layout({ children }){
  const navigate = useNavigate();
  const [open,setOpen]=useState(true);
  const appName = import.meta.env.VITE_APP_NAME || "Evergreen Eco-launderer";

  return (
    <div className="h-screen grid" style={{gridTemplateColumns: open ? "260px 1fr" : "72px 1fr"}}>
      <aside className="bg-[color:var(--brand-dark)]/95 border-r border-white/10 p-3">
        <button className="btn btn-primary w-full mb-3" onClick={()=>setOpen(!open)}>{open?"Collapse":"Menu"}</button>
        <nav className="space-y-1 text-sm">
          {["dashboard","orders","customers","pos","employees","finance","reports","offers","chat","announcements","settings"].map(k=>(
            <Link key={k} to={"/"+k} className="block navlink capitalize">{k}</Link>
          ))}
        </nav>
        <div className="mt-6 text-xs opacity-70">{appName}</div>
      </aside>
      <main className="p-4 overflow-auto">{children}</main>
    </div>
  );
}

function Login({ onLogin }){
  const [email,setEmail]=useState("super-admin@evergreen.test");
  const [password,setPassword]=useState("password123");
  const [error,setError]=useState("");
  async function submit(e){
    e.preventDefault();
    try{
      const { data } = await axios.post("/api/auth/login",{email,password});
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      onLogin(data.user);
    }catch(err){ setError("Invalid login"); }
  }
  return (
    <div className="h-screen flex items-center justify-center">
      <div className="card max-w-md w-full">
        <h1 className="text-2xl font-bold mb-2 text-[color:var(--brand-dark)]">Login</h1>
        {error && <div className="text-red-600 mb-2">{error}</div>}
        <form className="space-y-3" onSubmit={submit}>
          <input className="input" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" />
          <input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" />
          <button className="btn-primary" type="submit">Sign in</button>
        </form>
      </div>
    </div>
  )
}

function Dashboard(){
  const [stats,setStats]=useState([]);
  useEffect(()=>{ axios.get("/api/reports/orders-by-status").then(r=>setStats(r.data)); },[]);
  return (
    <div>
      <h1 className="text-2xl font-bold mb-3">Dashboard</h1>
      <div className="grid md:grid-cols-3 gap-3">
        {stats.map(s=>(
          <div key={s.status} className="card">
            <div className="font-semibold capitalize">{s.status}</div>
            <div className="text-3xl">{s.count}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Orders(){
  const [orders,setOrders]=useState([]);
  const [status,setStatus]=useState("order");
  const [customerId,setCustomerId]=useState("");
  const [amount,setAmount]=useState(0);
  const [notes,setNotes]=useState("");

  useEffect(()=>{
    axios.get("/api/orders").then(r=>setOrders(r.data));
    const socket = io(API);
    socket.on("order:new", o=> setOrders(prev=>[o, ...prev]));
    socket.on("order:update", o=> setOrders(prev=> prev.map(x=> x.id===o.id?o:x)));
    return ()=> socket.close();
  },[]);

  async function createOrder(){
    const { data } = await axios.post("/api/orders", { customer_id: customerId||1, items: [], amount, notes });
    setCustomerId(""); setAmount(0); setNotes("");
  }
  async function moveStage(id, status){
    await axios.put(`/api/orders/${id}/status`, { status });
  }

  const stages = ["order","washing","drying","dry wash","wet wash","ironing","qc","ready to pickup","delivery"];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-3">Orders</h1>
      <div className="card mb-4 grid md:grid-cols-4 gap-2">
        <input className="input" placeholder="Customer ID (demo=1)" value={customerId} onChange={e=>setCustomerId(e.target.value)} />
        <input className="input" type="number" placeholder="Amount" value={amount} onChange={e=>setAmount(+e.target.value)} />
        <input className="input" placeholder="Notes" value={notes} onChange={e=>setNotes(e.target.value)} />
        <button className="btn-primary" onClick={createOrder}>Create Order</button>
      </div>
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
        {orders.map(o=>(
          <div key={o.id} className="card">
            <div className="flex items-center justify-between">
              <div className="font-semibold">{o.code}</div>
              <div className="badge capitalize">{o.status}</div>
            </div>
            <div className="text-sm opacity-70">₹ {o.amount} • Customer #{o.customer_id}</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {stages.map(s=>(
                <button key={s} className="btn bg-white/10" onClick={()=>moveStage(o.id, s)}>{s}</button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Customers(){
  const [list,setList] = useState([]);
  const [f,setF] = useState({name:"",phone:"",email:"",address:""});
  useEffect(()=>{ axios.get("/api/customers").then(r=>setList(r.data)); },[]);
  async function create(){
    await axios.post("/api/customers", f);
    setF({name:"",phone:"",email:"",address:""});
    const { data } = await axios.get("/api/customers"); setList(data);
  }
  return (
    <div>
      <h1 className="text-2xl font-bold mb-3">Customers</h1>
      <div className="card grid md:grid-cols-5 gap-2 mb-4">
        {["name","phone","email","address"].map(k=>(
          <input key={k} className="input" placeholder={k} value={f[k]} onChange={e=>setF({...f,[k]:e.target.value})}/>
        ))}
        <button className="btn-primary" onClick={create}>Add</button>
      </div>
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
        {list.map(c=>(<div key={c.id} className="card">
          <div className="font-semibold">{c.name} <span className="badge">#{c.id}</span></div>
          <div className="text-sm opacity-70">{c.phone} • {c.email}</div>
          <div className="text-sm opacity-70">{c.address}</div>
        </div>))}
      </div>
    </div>
  )
}

function POS(){
  return (
    <div>
      <h1 className="text-2xl font-bold mb-3">Store POS (Offline-ready)</h1>
      <div className="card">Queue orders while offline and sync when online (scaffold).</div>
    </div>
  )
}

function Employees(){ return <div><h1 className="text-2xl font-bold mb-3">Employees</h1><div className="card">Manage staff, roles, and attendance (scaffold).</div></div> }
function Finance(){
  const [sum,setSum]=useState({});
  useEffect(()=>{ axios.get("/api/finance/summary").then(r=>setSum(r.data)); },[]);
  return <div><h1 className="text-2xl font-bold mb-3">Finance</h1>
    <div className="grid md:grid-cols-3 gap-3">
      <div className="card">Income ₹ {sum.income||0}</div>
      <div className="card">Expenses ₹ {sum.expenses||0}</div>
      <div className="card">Profit ₹ {sum.profit||0}</div>
    </div>
  </div>
}
function Reports(){ return <div><h1 className="text-2xl font-bold mb-3">Reports</h1><div className="card">Charts & exports (scaffold).</div></div> }
function Offers(){ return <div><h1 className="text-2xl font-bold mb-3">Offers</h1><div className="card">Exclusive customer offers (scaffold).</div></div> }
function Chat(){ return <div><h1 className="text-2xl font-bold mb-3">Staff Chat</h1><div className="card">Real-time chat (Socket.IO wired).</div></div> }
function Ann(){ return <div><h1 className="text-2xl font-bold mb-3">Announcements</h1><div className="card">Post store-wide announcements (scaffold).</div></div> }
function Settings(){ return <div><h1 className="text-2xl font-bold mb-3">Settings</h1><div className="card">Theme, profile, permissions (scaffold).</div></div> }

export default function App(){
  const { user, setUser } = useAuth();
  if(!user) return <Login onLogin={setUser}/>;
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard/>} />
        <Route path="/dashboard" element={<Dashboard/>} />
        <Route path="/orders" element={<Orders/>} />
        <Route path="/customers" element={<Customers/>} />
        <Route path="/pos" element={<POS/>} />
        <Route path="/employees" element={<Employees/>} />
        <Route path="/finance" element={<Finance/>} />
        <Route path="/reports" element={<Reports/>} />
        <Route path="/offers" element={<Offers/>} />
        <Route path="/chat" element={<Chat/>} />
        <Route path="/announcements" element={<Ann/>} />
        <Route path="/settings" element={<Settings/>} />
      </Routes>
    </Layout>
  )
}

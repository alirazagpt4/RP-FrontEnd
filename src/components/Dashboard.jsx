import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell
} from 'recharts';

export default function Dashboard({ currentUser }) {
  const [items, setItems] = useState([]);
  const [allUsers, setAllUsers] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [selectedStore, setSelectedStore] = useState('all');

  // ⭐ Default Dates Logic (MTD - Month to Date)
  const todayDate = new Date().toISOString().split('T')[0];
  const firstDate = new Date(new Date().getFullYear(), new Date().getMonth(), 2).toISOString().split('T')[0];
  
  const [dateFrom, setDateFrom] = useState(firstDate); 
  const [dateTo, setDateTo] = useState(todayDate);

  // 1. Data Fetching
  const fetchData = async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      const itemRes = await axios.get("http://194.163.190.100:8080/api/items", {
        params: { userId: currentUser.id, type: currentUser.type }
      });
      setItems(itemRes.data.data || []);

      const userRes = await axios.get("http://194.163.190.100:8080/api/users");
      setAllUsers(userRes.data || []);
    } catch (err) {
      console.error("Dashboard Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentUser]);

  // 2. Analytics Logic (Zero-Safe Visuals)
  const stats = useMemo(() => {
    let filtered = items || [];

    if (selectedStore !== 'all') {
      filtered = filtered.filter(it => it.storeId === parseInt(selectedStore));
    }

    if (dateFrom && dateTo) {
      filtered = filtered.filter(it => {
        const itemDate = it.createdAt ? it.createdAt.split('T')[0] : ""; 
        return itemDate >= dateFrom && itemDate <= dateTo;
      });
    }

    const counts = {
      total: filtered.length,
      repair: filtered.filter(i => i.type === 'Repair').length,
      claim: filtered.filter(i => i.type === 'Claim').length,
      local: filtered.filter(i => i.type === 'local repair').length,
      atStore: filtered.filter(i => i.status === 'Received at Store').length,
      atWH: filtered.filter(i => i.status === 'Received at Warehouse').length,
      inTransit: filtered.filter(i => i.status === 'Dispatched to Warehouse').length,
      dispCust: filtered.filter(i => i.status === 'Dispatch' && i.returnto === 'To Customer').length,
      dispStore: filtered.filter(i => i.status === 'Dispatch' && i.returnto === 'To Store').length,
      finalRecvd: filtered.filter(i => i.status === 'Received at Store From WH').length,
    };

    const problems = [
      { name: 'Upper', count: filtered.filter(i => i.upperProblem === 'Y').length },
      { name: 'Sole', count: filtered.filter(i => i.soleProblem === 'Y').length },
      { name: 'Color', count: filtered.filter(i => i.colorProblem === 'Y').length },
      { name: 'Buckle', count: filtered.filter(i => i.buckleProblem === 'Y').length },
      { name: 'In-Socks', count: filtered.filter(i => i.inSocksProblem === 'Y').length },
      { name: 'Refinishing', count: filtered.filter(i => i.refinishingProblem === 'Y').length },
    ];

    return { counts, problems, filteredCount: filtered.length };
  }, [items, dateFrom, dateTo, selectedStore]);

  const accessibleStores = useMemo(() => {
    if (currentUser?.type === 'Admin') return allUsers;
    const assignedIds = currentUser?.assignedUsers ? currentUser.assignedUsers.split(',').filter(id => id).map(id => parseInt(id)) : [];
    const myIds = [currentUser?.id, ...assignedIds];
    return allUsers.filter(u => myIds.includes(u.id));
  }, [allUsers, currentUser]);

  const pipelineData = [
    { name: 'At Store', count: stats?.counts.atStore || 0, fill: '#64748b' },
    { name: 'Warehouse', count: stats?.counts.atWH || 0, fill: '#3b82f6' },
    { name: 'To Customer', count: stats?.counts.dispCust || 0, fill: '#10b981' },
    { name: 'To Store', count: stats?.counts.dispStore || 0, fill: '#f59e0b' },
  ];

  if (loading) return <div className="p-20 text-center animate-pulse font-bold text-sky-800 text-xl tracking-widest uppercase">Initializing BI Engine...</div>;

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen font-sans">
      
      {/* --- HEADER & FILTERS --- */}
      <div className="flex flex-wrap justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-slate-100 gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tighter">Production BI</h2>
          <p className="text-slate-400 text-[12px] font-black uppercase tracking-widest">
            {currentUser?.name} | Access Level: {currentUser?.type}
          </p>
        </div>
        
        <div className="flex flex-wrap items-end gap-3">
           {/* Store/User Filter */}
           <div className="flex flex-col gap-1">
             <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-tighter">Store/User</label>
             <select 
               value={selectedStore} 
               onChange={(e) => setSelectedStore(e.target.value)}
               className="bg-slate-50 p-2 rounded-xl text-xs font-bold border border-slate-200 outline-none focus:ring-2 focus:ring-sky-500 h-9 min-w-[150px]"
             >
               <option value="all">All Stores/Users</option>
               {accessibleStores.map(s => (
                 <option key={s.id} value={s.id}>{s.name} ({s.shortName})</option>
               ))}
             </select>
           </div>

           {/* Date Range Filters */}
           <div className="flex gap-2">
             <div className="flex flex-col gap-1">
               <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-tighter">Start Date</label>
               <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="bg-slate-50 p-2 rounded-xl text-xs font-bold border border-slate-200 h-9" />
             </div>
             <div className="flex flex-col gap-1">
               <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-tighter">End Date</label>
               <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="bg-slate-50 p-2 rounded-xl text-xs font-bold border border-slate-200 h-9" />
             </div>
           </div>
           <button onClick={fetchData} className="p-2 bg-sky-100 text-sky-600 rounded-xl hover:bg-sky-200 transition-colors h-9 w-9 flex items-center justify-center">🔄</button>
        </div>
      </div>

      {/* --- KPI CARDS --- */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 group hover:shadow-xl transition-all cursor-default">
          <div className="w-8 h-1 bg-blue-600 rounded-full mb-4"></div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Inflow</p>
          <p className="text-4xl font-black text-slate-800 mt-1">{stats.counts.total}</p>
          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-50">
            <div className="flex-1 text-center">
              <span className="text-[12px] font-black text-slate-400 uppercase block">Repair</span>
              <span className="text-xs font-black text-blue-600">{stats.counts.repair}</span>
            </div>
            <div className="flex-1 border-l border-slate-100 pl-3 text-center">
              <span className="text-[12px] font-black text-slate-400 uppercase block">Claim</span>
              <span className="text-xs font-black text-rose-600">{stats.counts.claim}</span>
            </div>
          </div>
        </div>

        <KPICard title="At Shop" value={stats.counts.atStore} sub="Pending WH Dispatch" color="bg-slate-600" />
        <KPICard title="In Warehouse" value={stats.counts.atWH} sub="Active Processing" color="bg-amber-600" />
        <KPICard title="Audit Completed" value={stats.counts.finalRecvd} sub="Returned to Store" color="bg-emerald-600" />
      </div>

      {/* --- CHARTS --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100">
          <h3 className="text-sm font-black text-slate-400 uppercase mb-6">Inventory Pipeline</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pipelineData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 800}} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} />
                <Bar dataKey="count" radius={[10, 10, 0, 0]} barSize={45}>
                  {pipelineData.map((entry, index) => <Cell key={index} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100">
          <h3 className="text-sm font-black text-slate-400 uppercase mb-6">Quality Control Issues</h3>
          <div className="space-y-4">
            {stats.problems.sort((a,b) => b.count - a.count).map((prob, i) => (
              <div key={i}>
                <div className="flex justify-between text-[11px] font-black mb-1.5 uppercase">
                  <span className="text-slate-500">{prob.name}</span>
                  <span className="text-slate-800">{prob.count} items</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-700 ${i === 0 ? 'bg-rose-500' : 'bg-sky-500'}`} 
                    style={{width: `${stats.counts.total > 0 ? (prob.count / stats.counts.total) * 100 : 0}%`}}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* --- INSIGHTS / ALERT FOOTER --- */}
      <div className="bg-slate-900 rounded-[40px] p-8 text-white relative overflow-hidden">
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-10">
          <div>
            <h4 className="text-sky-400 font-black uppercase tracking-widest text-[10px]">Logistics Overview</h4>
            <p className="text-2xl font-bold mt-2">{stats.counts.inTransit} items currently in transit to Warehouse.</p>
            <p className="text-slate-400 text-sm mt-1">Status: {stats.counts.inTransit > 0 ? 'Verification Required' : 'All Clear'}</p>
          </div>
          <div className="bg-white/5 p-6 rounded-3xl border border-white/10 backdrop-blur-md">
            <h4 className="text-amber-400 font-black uppercase tracking-widest text-[10px]">QC Focus Recommendation</h4>
            {stats.counts.total > 0 ? (
                <p className="text-lg font-medium mt-1">High volume of <span className="text-rose-400 font-bold">{stats.problems[0].name}</span> problems detected in current date range.</p>
            ) : (
                <p className="text-lg font-medium mt-1 text-slate-500 italic">No historical data found for these dates.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function KPICard({ title, value, sub, color }) {
  return (
    <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 group hover:shadow-xl transition-all">
      <div className={`w-8 h-1 ${color} rounded-full mb-4`}></div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
      <p className="text-4xl font-black text-slate-800 mt-1">{value || 0}</p>
      <p className="text-[10px] font-bold text-slate-500 mt-1 italic">{sub}</p>
    </div>
  );
}









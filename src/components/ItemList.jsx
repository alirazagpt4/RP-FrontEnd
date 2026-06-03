
 import React, { useState, useEffect, useMemo } from "react";
  import ItemViewModal from "./ItemViewModal";
  import ItemTable from "./ItemTable";
  import axios from '../axiosConfig';

  export default function ItemList({ refresh, socket, user: propUser }) {
    const [items, setItems] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [msg, setMsg] = useState(null);
    const [loadingId, setLoadingId] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    const [multiSelectMode, setMultiSelectMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);
    const [filterTypes, setFilterTypes] = useState(['store']); 
    const [viewingItem, setViewingItem] = useState(null);
    const [actionFilter, setActionFilter] = useState('all'); 
    const [selectedStore, setSelectedStore] = useState('all');
    
    const today = new Date().toISOString().split('T')[0];
    const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const [startDate, setStartDate] = useState(firstDay); 
    const [endDate, setEndDate] = useState(today);

    const [activeRemarksId, setActiveRemarksId] = useState(null);
    const [tempRemarks, setTempRemarks] = useState({});

    const user = useMemo(() => {
      if (propUser && propUser.id) return propUser;
      const saved = localStorage.getItem("user");
      return saved ? JSON.parse(saved) : null;
    }, [propUser]);

    useEffect(() => {
      if (user?.type === 'Store') setActionFilter('dispatchable');
      else if (user?.type === 'Warehouse') setActionFilter('receivable');
      else setActionFilter('all');
    }, [user?.type]);

    const fetchItems = async () => {
      if (!user?.id) return;
      try {
        const res = await axios.get('/items', {
          params: { userId: user.id, type: user.type, storeId: selectedStore, startDate, endDate }
        });
        if (res.data.success) setItems(res.data.data || []);
        const userRes = await axios.get("/users");
        setAllUsers(userRes.data || []);
      } catch (err) { console.error("Fetch Error:", err); }
    };

    useEffect(() => { fetchItems(); }, [refresh, user, selectedStore, startDate, endDate]);

    const accessibleStores = useMemo(() => {
      if (user?.type === 'Admin') return allUsers;
      const assignedIds = user?.assignedUsers ? user.assignedUsers.split(',').filter(id => id).map(id => parseInt(id.trim())) : [];
      const myIds = [user?.id, ...assignedIds];
      return allUsers.filter(u => myIds.includes(u.id));
    }, [allUsers, user]);

    const filteredItems = useMemo(() => {
      let result = items;
      if (multiSelectMode) {
          result = result.filter(it => {
              const isLocal = it.type?.toLowerCase().trim() === 'local repair';
              const showLocal = filterTypes.includes('local') && isLocal;
              const showStore = filterTypes.includes('store') && it.returnto === 'To Store' && !isLocal;
              const showCustomer = filterTypes.includes('customer') && it.returnto === 'To Customer' && !isLocal;
              return showLocal || showStore || showCustomer;
          });
      }
      if (actionFilter !== 'all') {
          result = result.filter(it => {
              const s = it.status;
              const isLocal = it.type?.toLowerCase().trim() === 'local repair';
              if (user?.type === 'Store') {
                  if (actionFilter === 'dispatchable') return s === "Received at Store" || s === "Received at Store From WH";
                  if (actionFilter === 'receivable') return s === "Dispatch" || (isLocal && s === "Dispatched to Warehouse");
              }
              if (user?.type === 'Warehouse') {
                  if (actionFilter === 'dispatchable') return s === "Received at Warehouse";
                  if (actionFilter === 'receivable') return s === "Dispatched to Warehouse";
              }
              return true;
          });
      }
      return result;
    }, [items, multiSelectMode, filterTypes, actionFilter, user]);
    // Pending Counts Calculate Karne Ka Logic
    const pendingCounts = useMemo(() => {
      let dispatchable = 0;
      let receivable = 0;
      items.forEach(it => {
          const s = it.status;
          const isLocal = it.type?.toLowerCase().trim() === 'local repair';
          
          if (user?.type === 'Store') {
              if (s === "Received at Store" || s === "Received at Store From WH") dispatchable++;
              if (s === "Dispatch" || (isLocal && s === "Dispatched to Warehouse")) receivable++;
          } else if (user?.type === 'Warehouse') {
              if (s === "Received at Warehouse") dispatchable++;
              if (s === "Dispatched to Warehouse") receivable++;
          }
      });
      return { dispatchable, receivable };
    }, [items, user]);
    const getButtonStatus = (item, btnKey) => {
      const status = item.status, returnto = item.returnto, type = item.type, userType = user?.type;
      const S1="Received at Store", S2="Dispatched to Warehouse", S3="Received at Warehouse", S4="Dispatch", S5="Received at Store From WH", S6="Store To Customer";
      
      // 1. Role Check
      if (userType === "Store" && !["to_warehouse", "rec_store_wh", "store_to_customer"].includes(btnKey)) return { hidden: true };
      if (userType === "Warehouse" && !["to_production", "dispatch"].includes(btnKey)) return { hidden: true };

      // 2. Tab Filter Check (Dispatchables vs Receivables)
      if (actionFilter === 'dispatchable' && !['to_warehouse', 'dispatch', 'store_to_customer'].includes(btnKey)) return { hidden: true };
      if (actionFilter === 'receivable' && !['to_production', 'rec_store_wh'].includes(btnKey)) return { hidden: true };

      // 3. "Return To" Logic & Sequence
      const isLocal = type?.toLowerCase().trim() === 'local repair';
      const isClaim = type?.toLowerCase().trim() === 'claim';

      // Sirf Claim case ke liye 2 buttons allow karein (To WH aur Recvd WH)
      if (isClaim) {
        if (!["to_warehouse", "to_production"].includes(btnKey)) return { hidden: true };
      }
      
      // To Customer: Only 3 steps (S1, S2, S3, S4). To Store: All steps.
      let seq = isLocal ? [S1, S2, S5, S6] : (returnto === "To Store" ? [S1, S2, S3, S4, S5, S6] : [S1, S2, S3, S4]);
      
      let btnMap = { 
        to_warehouse: S2, 
        to_production: isLocal ? null : S3, 
        dispatch: isLocal ? null : S4, 
        rec_store_wh: (isLocal || returnto === "To Store") ? S5 : null, 
        store_to_customer: (isLocal || returnto === "To Store") ? S6 : null 
      };
      
      const target = btnMap[btnKey];
      if (!target) return { hidden: true }; // Agar is flow mein button nahi hai to hide kar do

      const currIdx = seq.indexOf(status), targetIdx = seq.indexOf(target);
      if (targetIdx === -1) return { hidden: true }; // Safe check

      // Lock/Unlock logic wahi purani
      if (currIdx >= targetIdx) return { isDone: true, disabled: true, className: "bg-gray-400 opacity-50" };
      if (currIdx === targetIdx - 1) return { isDone: false, disabled: false, className: "hover:scale-105" };
      return { isDone: false, disabled: true, className: "bg-slate-100 text-slate-300" };
    };

    const dispatchAction = async (id, action, slip = null) => {
      const item = items.find(i => i.id === id);
      if (item?.type?.toLowerCase().trim() !== 'local repair' && !slip && (action === "to_warehouse" || action === "dispatch")) {
        slip = prompt("Enter Courier Slip:");
        if (!slip) return null;
      }
      return await axios.post(`/items/${id}/dispatch`, { action, courierSlip: slip });
    };

    const handleSingleAction = async (id, action) => {
      setLoadingId(id);
      try {
        const res = await dispatchAction(id, action);
        if (res?.data.success) {
          setMsg({ type: "success", text: "Updated!" });
          fetchItems();
        }
      } catch (err) { setMsg({ type: "error", text: "Failed" }); }
      finally { setLoadingId(null); }
    };

    const handleBulkAction = async (action) => {
      if (selectedIds.length === 0) return alert("Select items!");
      let slip = (action === "to_warehouse" || action === "dispatch") ? prompt("Enter Common Slip:") : null;
      setLoadingId("bulk");
      try {
        await Promise.all(selectedIds.map(id => dispatchAction(id, action, slip)));
        setSelectedIds([]); fetchItems();
      } catch (err) { alert("Bulk failed"); }
      finally { setLoadingId(null); }
    };

    const handleSaveRemarks = async (id) => {
      try {
        await axios.put(`/items/${id}`, { remarksWH: tempRemarks[id] });
        setActiveRemarksId(null); fetchItems();
      } catch (err) { console.error(err); }
    };

    const statuses = [
      { key: "to_warehouse", label: "To WH", color: "bg-amber-500" },
      { key: "to_production", label: "Recvd WH", color: "bg-blue-600" },
      { key: "dispatch", label: "Dispatch", color: "bg-green-600" },
      { key: "rec_store_wh", label: "Rec Store", color: "bg-purple-600" },
      { key: "store_to_customer", label: "To Cust", color: "bg-rose-600" },
    ];

    return (
      <div className="space-y-4 p-4">
        <div className="flex flex-wrap justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100 gap-4">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-slate-800">Inventory Matrix</h2>
            <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-lg border">
              <select value={selectedStore} onChange={(e) => setSelectedStore(e.target.value)} className="text-[10px] font-bold outline-none">
                <option value="all">All Stores</option>
                {accessibleStores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="text-[10px] font-bold" />
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="text-[10px] font-bold" />
            </div>
            <button onClick={() => { setMultiSelectMode(!multiSelectMode); setSelectedIds([]); }} className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase transition-all shadow-sm ${multiSelectMode ? 'bg-rose-500 text-white' : 'bg-sky-600 text-white'}`}>
              {multiSelectMode ? "✖ Exit Multi-Select" : "⚙ Option Multiple Select"}
            </button>
          </div>
          {msg && <div className={`text-xs font-bold ${msg.type === 'error' ? 'text-red-500' : 'text-green-600'}`}>{msg.text}</div>}
        </div>

        <div className="flex gap-2">
            <button onClick={() => setActionFilter('dispatchable')} className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${actionFilter === 'dispatchable' ? 'bg-indigo-600 text-white shadow-lg scale-105' : 'bg-white border text-slate-400'}`}>📤 SENDING (DISPATCHABLES) ({pendingCounts.dispatchable})</button>
            <button onClick={() => setActionFilter('receivable')} className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${actionFilter === 'receivable' ? 'bg-emerald-600 text-white shadow-lg scale-105' : 'bg-white border text-slate-400'}`}>📥 RECEIVING (RECEIVABLES) ({pendingCounts.receivable})</button>
            <button onClick={() => setActionFilter('all')} className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${actionFilter === 'all' ? 'bg-slate-800 text-white shadow-lg scale-105' : 'bg-white border text-slate-400'}`}>ALL HISTORY</button>
        </div>

        {multiSelectMode && selectedIds.length > 0 && (
          <div className="bg-slate-900 p-3 rounded-xl flex items-center justify-between sticky top-2 z-10 border border-slate-700">
            <span className="text-sky-400 text-[10px] font-black uppercase tracking-widest">{selectedIds.length} Selection Active</span>
            <div className="flex gap-2">
              {statuses.map(st => (
                <button key={st.key} onClick={() => handleBulkAction(st.key)} className={`${st.color} text-white text-[9px] font-black px-4 py-1.5 rounded-lg`}>BULK {st.label}</button>
              ))}
            </div>
          </div>
        )}

        <ItemTable 
          items={filteredItems}
          multiSelectMode={multiSelectMode}
          selectedIds={selectedIds}
          toggleSelect={(id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])}
          statuses={statuses}
          getButtonStatus={getButtonStatus}
          handleSingleAction={handleSingleAction}
          loadingId={loadingId}
          setViewingItem={setViewingItem}
          activeRemarksId={activeRemarksId}
          setActiveRemarksId={setActiveRemarksId}
          tempRemarks={tempRemarks}
          setTempRemarks={setTempRemarks}
          handleSaveRemarks={handleSaveRemarks}
          actionFilter={actionFilter}
        />

        <ItemViewModal item={viewingItem} onClose={() => setViewingItem(null)} />
      </div>
    );
  }
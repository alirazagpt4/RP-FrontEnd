// import React, { useState, useEffect, useMemo } from "react";
// import axios from "axios";
// import ItemViewModal from "./ItemViewModal";
// import ItemTable from "./ItemTable";

// export default function ItemList({ refresh, socket, user: propUser }) {
//   const [items, setItems] = useState([]);
//   const [allUsers, setAllUsers] = useState([]);
//   const [msg, setMsg] = useState(null);
//   const [loadingId, setLoadingId] = useState(null);
  
//   const [multiSelectMode, setMultiSelectMode] = useState(false);
//   const [selectedIds, setSelectedIds] = useState([]);
//   const [filterTypes, setFilterTypes] = useState(['store']); 
//   const [viewingItem, setViewingItem] = useState(null);
//   const [actionFilter, setActionFilter] = useState('all'); 
//   const [selectedStore, setSelectedStore] = useState('all');
  
//   const today = new Date().toISOString().split('T')[0];
//   const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
//   const [startDate, setStartDate] = useState(firstDay); 
//   const [endDate, setEndDate] = useState(today);

//   const [activeRemarksId, setActiveRemarksId] = useState(null);
//   const [tempRemarks, setTempRemarks] = useState({});

//   const user = useMemo(() => {
//     if (propUser && propUser.id) return propUser;
//     const saved = localStorage.getItem("user");
//     return saved ? JSON.parse(saved) : null;
//   }, [propUser]);

//   useEffect(() => {
//     if (user?.type === 'Store') setActionFilter('dispatchable');
//     else if (user?.type === 'Warehouse') setActionFilter('receivable');
//     else setActionFilter('all');
//   }, [user?.type]);

//   const fetchItems = async () => {
//     if (!user?.id) return;
//     try {
//       const res = await axios.get('http://localhost:8080/api/items', {
//         params: { userId: user.id, type: user.type, storeId: selectedStore, startDate, endDate }
//       });
//       if (res.data.success) setItems(res.data.data || []);
//       const userRes = await axios.get("http://localhost:8080/api/users");
//       setAllUsers(userRes.data || []);
//     } catch (err) { console.error("Fetch Error:", err); }
//   };

//   useEffect(() => { fetchItems(); }, [refresh, user, selectedStore, startDate, endDate]);

//   const accessibleStores = useMemo(() => {
//     if (user?.type === 'Admin') return allUsers;
//     const assignedIds = user?.assignedUsers ? user.assignedUsers.split(',').filter(id => id).map(id => parseInt(id.trim())) : [];
//     const myIds = [user?.id, ...assignedIds];
//     return allUsers.filter(u => myIds.includes(u.id));
//   }, [allUsers, user]);

//   // ⭐ UPDATE: Entire Row Hiding Logic
//   const filteredItems = useMemo(() => {
//     let result = items;
//     if (multiSelectMode) {
//         result = result.filter(it => {
//             const isLocal = it.type?.toLowerCase().trim() === 'local repair';
//             const showLocal = filterTypes.includes('local') && isLocal;
//             const showStore = filterTypes.includes('store') && it.returnto === 'To Store' && !isLocal;
//             const showCustomer = filterTypes.includes('customer') && it.returnto === 'To Customer' && !isLocal;
//             return showLocal || showStore || showCustomer;
//         });
//     }

//     if (actionFilter !== 'all') {
//         result = result.filter(it => {
//             const s = it.status;
//             const isLocal = it.type?.toLowerCase().trim() === 'local repair';
            
//             if (user?.type === 'Store') {
//                 if (actionFilter === 'dispatchable') {
//                     return s === "Received at Store" || s === "Received at Store From WH";
//                 }
//                 if (actionFilter === 'receivable') {
//                     return s === "Dispatch" || (isLocal && s === "Dispatched to Warehouse");
//                 }
//             }
//             if (user?.type === 'Warehouse') {
//                 if (actionFilter === 'dispatchable') {
//                     return s === "Received at Warehouse";
//                 }
//                 if (actionFilter === 'receivable') {
//                     return s === "Dispatched to Warehouse";
//                 }
//             }
//             // 🛑 CRITICAL CHANGE: Default false means if status changes, row DISAPPEARS
//             return false; 
//         });
//     }
//     return result;
//   }, [items, multiSelectMode, filterTypes, actionFilter, user]);

//   const getButtonStatus = (item, btnKey) => {
//     const status = item.status, returnto = item.returnto, type = item.type, userType = user?.type;
//     const S1="Received at Store", S2="Dispatched to Warehouse", S3="Received at Warehouse", S4="Dispatch", S5="Received at Store From WH", S6="Store To Customer";
    
//     if (userType === "Store" && !["to_warehouse", "rec_store_wh", "store_to_customer"].includes(btnKey)) return { hidden: true };
//     if (userType === "Warehouse" && !["to_production", "dispatch"].includes(btnKey)) return { hidden: true };

//     if (actionFilter === 'dispatchable' && !['to_warehouse', 'dispatch', 'store_to_customer'].includes(btnKey)) return { hidden: true };
//     if (actionFilter === 'receivable' && !['to_production', 'rec_store_wh'].includes(btnKey)) return { hidden: true };

//     const isLocal = type?.toLowerCase().trim() === 'local repair';
//     let seq = isLocal ? [S1, S2, S5, S6] : (returnto === "To Store" ? [S1, S2, S3, S4, S5, S6] : [S1, S2, S3, S4]);
    
//     let btnMap = { 
//       to_warehouse: S2, 
//       to_production: isLocal ? null : S3, 
//       dispatch: isLocal ? null : S4, 
//       rec_store_wh: (isLocal || returnto === "To Store") ? S5 : null, 
//       store_to_customer: (isLocal || returnto === "To Store") ? S6 : null 
//     };
    
//     const target = btnMap[btnKey];
//     if (!target) return { hidden: true };

//     const currIdx = seq.indexOf(status), targetIdx = seq.indexOf(target);
//     if (targetIdx === -1) return { hidden: true };

//     if (currIdx >= targetIdx) return { isDone: true, disabled: true, className: "bg-gray-400 opacity-50" };
//     if (currIdx === targetIdx - 1) return { isDone: false, disabled: false, className: "hover:scale-105" };
//     return { isDone: false, disabled: true, className: "bg-slate-100 text-slate-300" };
//   };

//   const dispatchAction = async (id, action, slip = null) => {
//     const item = items.find(i => i.id === id);
//     if (item?.type?.toLowerCase().trim() !== 'local repair' && !slip && (action === "to_warehouse" || action === "dispatch")) {
//       slip = prompt("Enter Courier Slip:");
//       if (!slip) return null;
//     }
//     return await axios.post(`http://localhost:8080/api/items/${id}/dispatch`, { action, courierSlip: slip });
//   };

//   const handleSingleAction = async (id, action) => {
//     setLoadingId(id);
//     try {
//       const res = await dispatchAction(id, action);
//       if (res?.data.success) {
//         // ✨ MAGIC: Remove the item from local state immediately
//         setItems(prev => prev.filter(it => it.id !== id));
//         setMsg({ type: "success", text: "Updated!" });
//         // Background fetch to sync with DB
//         fetchItems();
//       }
//     } catch (err) { setMsg({ type: "error", text: "Failed" }); }
//     finally { setLoadingId(null); }
//   };

//   const handleBulkAction = async (action) => {
//     if (selectedIds.length === 0) return alert("Select items!");
//     let slip = (action === "to_warehouse" || action === "dispatch") ? prompt("Enter Common Slip:") : null;
//     setLoadingId("bulk");
//     try {
//       await Promise.all(selectedIds.map(id => dispatchAction(id, action, slip)));
//       // ✨ MAGIC: Hide all selected items immediately
//       setItems(prev => prev.filter(it => !selectedIds.includes(it.id)));
//       setSelectedIds([]); 
//       fetchItems();
//     } catch (err) { alert("Bulk failed"); }
//     finally { setLoadingId(null); }
//   };

//   const handleSaveRemarks = async (id) => {
//     try {
//       await axios.put(`http://localhost:8080/api/items/${id}`, { remarksWH: tempRemarks[id] });
//       setActiveRemarksId(null); fetchItems();
//     } catch (err) { console.error(err); }
//   };

//   const statuses = [
//     { key: "to_warehouse", label: "To WH", color: "bg-amber-500" },
//     { key: "to_production", label: "Recvd WH", color: "bg-blue-600" },
//     { key: "dispatch", label: "Dispatch", color: "bg-green-600" },
//     { key: "rec_store_wh", label: "Rec Store", color: "bg-purple-600" },
//     { key: "store_to_customer", label: "To Cust", color: "bg-rose-600" },
//   ];

//   return (
//     <div className="space-y-4 p-4">
//       {/* ... (Rest of your JSX remains exactly the same) ... */}
//       <div className="flex flex-wrap justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100 gap-4">
//         <div className="flex items-center gap-4">
//           <h2 className="text-xl font-bold text-slate-800">Inventory Matrix</h2>
//           <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-lg border">
//             <select value={selectedStore} onChange={(e) => setSelectedStore(e.target.value)} className="text-[10px] font-bold outline-none">
//               <option value="all">All Stores</option>
//               {accessibleStores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
//             </select>
//             <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="text-[10px] font-bold" />
//             <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="text-[10px] font-bold" />
//           </div>
//           <button onClick={() => { setMultiSelectMode(!multiSelectMode); setSelectedIds([]); }} className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase transition-all shadow-sm ${multiSelectMode ? 'bg-rose-500 text-white' : 'bg-sky-600 text-white'}`}>
//             {multiSelectMode ? "✖ Exit Multi-Select" : "⚙ Option Multiple Select"}
//           </button>
//         </div>
//         {msg && <div className={`text-xs font-bold ${msg.type === 'error' ? 'text-red-500' : 'text-green-600'}`}>{msg.text}</div>}
//       </div>

//       <div className="flex gap-2">
//           <button onClick={() => setActionFilter('dispatchable')} className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${actionFilter === 'dispatchable' ? 'bg-indigo-600 text-white shadow-lg scale-105' : 'bg-white border text-slate-400'}`}>📤 SENDING (DISPATCHABLES)</button>
//           <button onClick={() => setActionFilter('receivable')} className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${actionFilter === 'receivable' ? 'bg-emerald-600 text-white shadow-lg scale-105' : 'bg-white border text-slate-400'}`}>📥 RECEIVING (RECEIVABLES)</button>
//           <button onClick={() => setActionFilter('all')} className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${actionFilter === 'all' ? 'bg-slate-800 text-white shadow-lg scale-105' : 'bg-white border text-slate-400'}`}>ALL HISTORY</button>
//       </div>

//       {multiSelectMode && selectedIds.length > 0 && (
//         <div className="bg-slate-900 p-3 rounded-xl flex items-center justify-between sticky top-2 z-10 border border-slate-700">
//           <span className="text-sky-400 text-[10px] font-black uppercase tracking-widest">{selectedIds.length} Selection Active</span>
//           <div className="flex gap-2">
//             {statuses.map(st => (
//               <button key={st.key} onClick={() => handleBulkAction(st.key)} className={`${st.color} text-white text-[9px] font-black px-4 py-1.5 rounded-lg`}>BULK {st.label}</button>
//             ))}
//           </div>
//         </div>
//       )}

//       <ItemTable 
//         items={filteredItems}
//         multiSelectMode={multiSelectMode}
//         selectedIds={selectedIds}
//         toggleSelect={(id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])}
//         statuses={statuses}
//         getButtonStatus={getButtonStatus}
//         handleSingleAction={handleSingleAction}
//         loadingId={loadingId}
//         setViewingItem={setViewingItem}
//         activeRemarksId={activeRemarksId}
//         setActiveRemarksId={setActiveRemarksId}
//         tempRemarks={tempRemarks}
//         setTempRemarks={setTempRemarks}
//         handleSaveRemarks={handleSaveRemarks}
//         actionFilter={actionFilter}
//       />

//       <ItemViewModal item={viewingItem} onClose={() => setViewingItem(null)} />
//     </div>
//   );
// }
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 import React, { useState, useEffect, useMemo } from "react";
  import axios from "axios";
  import ItemViewModal from "./ItemViewModal";
  import ItemTable from "./ItemTable";

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
        const res = await axios.get('http://localhost:8080/api/items', {
          params: { userId: user.id, type: user.type, storeId: selectedStore, startDate, endDate }
        });
        if (res.data.success) setItems(res.data.data || []);
        const userRes = await axios.get("http://localhost:8080/api/users");
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
      return await axios.post(`http://localhost:8080/api/items/${id}/dispatch`, { action, courierSlip: slip });
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
        await axios.put(`http://localhost:8080/api/items/${id}`, { remarksWH: tempRemarks[id] });
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
            <button onClick={() => setActionFilter('dispatchable')} className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${actionFilter === 'dispatchable' ? 'bg-indigo-600 text-white shadow-lg scale-105' : 'bg-white border text-slate-400'}`}>📤 SENDING (DISPATCHABLES)</button>
            <button onClick={() => setActionFilter('receivable')} className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${actionFilter === 'receivable' ? 'bg-emerald-600 text-white shadow-lg scale-105' : 'bg-white border text-slate-400'}`}>📥 RECEIVING (RECEIVABLES)</button>
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


























































// import React, { useState, useEffect, useMemo } from "react";
// import axios from "axios";

// export default function ItemList({ refresh, socket, user: propUser }) {
//   const [items, setItems] = useState([]);
//   const [allUsers, setAllUsers] = useState([]);
//   const [msg, setMsg] = useState(null);
//   const [loadingId, setLoadingId] = useState(null);
//   const [currentPage, setCurrentPage] = useState(1);
//   const itemsPerPage = 20;

//   const [multiSelectMode, setMultiSelectMode] = useState(false);
//   const [selectedIds, setSelectedIds] = useState([]);
  
//   // ⭐ CHANGED: Changed from single string to Array for Multiple Checkboxes
//   // Defaulting to 'store' so list isn't empty initially
//   const [filterTypes, setFilterTypes] = useState(['store']); 

//   const [viewingItem, setViewingItem] = useState(null);

//   // ⭐ New State for Action Filter (All / Dispatchables / Receivables)
//   const [actionFilter, setActionFilter] = useState('all'); 
  
//   const user = useMemo(() => {
//     if (propUser && propUser.id) return propUser;
//     const saved = localStorage.getItem("user");
//     return saved ? JSON.parse(saved) : null;
//   }, [propUser]);

//   // ⭐ Auto-set Default Filter based on User Type
//   useEffect(() => {
//     if (user?.type === 'Store') {
//       setActionFilter('dispatchable');
//     } else if (user?.type === 'Warehouse') {
//       setActionFilter('receivable');
//     } else {
//       setActionFilter('all');
//     }
//   }, [user?.type]);

//   const [selectedStore, setSelectedStore] = useState('all');
//   const today = new Date().toISOString().split('T')[0];
//   const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
//   const [startDate, setStartDate] = useState(firstDay); 
//   const [endDate, setEndDate] = useState(today);

//   const [activeRemarksId, setActiveRemarksId] = useState(null);
//   const [tempRemarks, setTempRemarks] = useState({});

//   useEffect(() => {
//     if (msg) {
//       const timer = setTimeout(() => setMsg(null), 5000);
//       return () => clearTimeout(timer);
//     }
//   }, [msg]);

//   const fetchItems = async () => {
//     if (!user || !user.id) return; 
//     try {
//       const res = await axios.get('http://localhost:8080/api/items', {
//         params: { userId: user.id, type: user.type, storeId: selectedStore, startDate: startDate, endDate: endDate }
//       });
//       if (res.data.success) setItems(res.data.data || []);
//       const userRes = await axios.get("http://localhost:8080/api/users");
//       setAllUsers(userRes.data || []);
//     } catch (err) { console.error("Fetch Error:", err); }
//   };

//   useEffect(() => { fetchItems(); }, [refresh, user, selectedStore, startDate, endDate]);

//   const accessibleStores = useMemo(() => {
//     if (user?.type === 'Admin') return allUsers;
//     const assignedIds = user?.assignedUsers ? user.assignedUsers.split(',').filter(id => id).map(id => parseInt(id)) : [];
//     const myIds = [user?.id, ...assignedIds];
//     return allUsers.filter(u => myIds.includes(u.id));
//   }, [allUsers, user]);

//   // ⭐ HELPER: Toggle Filter Checkboxes
//   const toggleFilterType = (type) => {
//     setFilterTypes(prev => {
//         if (prev.includes(type)) {
//             return prev.filter(t => t !== type); // Uncheck
//         } else {
//             return [...prev, type]; // Check
//         }
//     });
//     setSelectedIds([]); // Clear selection when filter changes to avoid errors
//   };

//   // ⭐ Refined Filtering Logic (Includes Checkboxes + Action Filter)
//   const filteredItems = useMemo(() => {
//     let result = items;

//     // 1. ⭐ NEW CHECKBOX LOGIC (Store / Customer / Local)
//     if (multiSelectMode) {
//         result = result.filter(it => {
//             const isLocal = it.type && it.type.toLowerCase().trim() === 'local repair';
            
//             // Logic: 
//             // - If 'local' is checked, show Local Repair items.
//             // - If 'store' is checked, show items Returning to Store (Excluding Local Repair to avoid duplicates if logic overlaps).
//             // - If 'customer' is checked, show items Returning to Customer.
            
//             const showLocal = filterTypes.includes('local') && isLocal;
//             const showStore = filterTypes.includes('store') && it.returnto === 'To Store' && !isLocal;
//             const showCustomer = filterTypes.includes('customer') && it.returnto === 'To Customer' && !isLocal;

//             return showLocal || showStore || showCustomer;
//         });
//     }

//     // 2. Action Filter Logic (Dispatchable vs Receivable)
//     if (actionFilter !== 'all') {
//         result = result.filter(it => {
//             const s = it.status;
//             const isLocalRepair = it.type && it.type.toLowerCase().trim() === 'local repair';
            
//             if (user?.type === 'Store') {
//                 if (actionFilter === 'dispatchable') {
//                     // Store Dispatch: Waiting to go to WH OR Waiting to go to Customer
//                     return s === "Received at Store" || s === "Received at Store From WH";
//                 }
//                 if (actionFilter === 'receivable') {
//                     // 1. Normal Item: "Dispatch" (Waiting for store to receive from Warehouse)
//                     // 2. Local Repair: "Dispatched to Warehouse" (Actually means 'Under Repair', waiting for store to receive back)
//                     return s === "Dispatch" || (isLocalRepair && s === "Dispatched to Warehouse"); 
//                 }
//             }
            
//             if (user?.type === 'Warehouse') {
//                 if (actionFilter === 'dispatchable') {
//                     // WH Dispatch: Ready to go out
//                     return s === "Received at Warehouse";
//                 }
//                 if (actionFilter === 'receivable') {
//                     // WH Receive: Store sent it, waiting for WH to receive
//                     return s === "Dispatched to Warehouse";
//                 }
//             }
//             return true;
//         });
//     }

//     return result;
//   }, [items, multiSelectMode, filterTypes, actionFilter, user]);

//   const currentItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

//   const getButtonStatus = (item, btnKey) => {
//     const status = item.status;
//     const returnto = item.returnto;
//     const type = item.type; 
//     const userType = user?.type;

//     const S1 = "Received at Store";
//     const S2 = "Dispatched to Warehouse";
//     const S3 = "Received at Warehouse";
//     const S4 = "Dispatch";
//     const S5 = "Received at Store From WH";
//     const S6 = "Store To Customer"; 

//     // 1. Permission Logic
//     if (userType === "Store") {
//       const storeAllowed = ["to_warehouse", "rec_store_wh", "store_to_customer"];
//       if (!storeAllowed.includes(btnKey)) return { hidden: true };
//     } else if (userType === "Warehouse") {
//       const whAllowed = ["to_production", "dispatch"];
//       if (!whAllowed.includes(btnKey)) return { hidden: true };
//     }

//     // 2. Flow Selection
//     let currentSeq = [];
//     let btnMap = {};
//     const isLocalRepair = type && type.toLowerCase().trim() === 'local repair';

//     if (isLocalRepair) {
//       currentSeq = [S1, S2, S5, S6]; 
//       btnMap = {
//         to_warehouse: S2,
//         to_production: null, 
//         dispatch: null,      
//         rec_store_wh: S5,
//         store_to_customer: S6
//       };
//     } else {
//       const seqStore = [S1, S2, S3, S4, S5, S6];
//       const seqCust = [S1, S2, S3, S4];
//       currentSeq = returnto === "To Store" ? seqStore : seqCust;
//       btnMap = {
//         to_warehouse: S2,
//         to_production: S3,
//         dispatch: S4,
//         rec_store_wh: returnto === "To Store" ? S5 : null,
//         store_to_customer: returnto === "To Store" ? S6 : null
//       };
//     }

//     const targetStatus = btnMap[btnKey];
//     if (!targetStatus) return { hidden: true };

//     const currentIndex = currentSeq.indexOf(status);
//     const targetIndex = currentSeq.indexOf(targetStatus);

//     if (currentIndex >= targetIndex) return { isDone: true, disabled: true, title: "Already Processed", className: "bg-gray-400 opacity-50 cursor-not-allowed" };
//     if (currentIndex === targetIndex - 1) return { isDone: false, disabled: false, title: "", className: "hover:brightness-110 shadow-sm" };
    
//     return { isDone: false, disabled: true, title: "Locked", className: "bg-slate-100 text-slate-300 cursor-not-allowed border border-slate-200" };
//   };

//   const dispatchAction = async (id, action, courierSlipInput = null) => {
//     const item = items.find(i => i.id === id);
//     const isLocalRepair = item && item.type && item.type.toLowerCase().trim() === 'local repair';

//     let courierSlip = courierSlipInput;
    
//     // Only prompt for slip if NOT Local Repair
//     if (!isLocalRepair && !courierSlip && (action === "to_warehouse" || action === "dispatch")) {
//       const label = action === "to_warehouse" ? "Warehouse Courier Slip" : "Final Dispatch Slip";
//       courierSlip = prompt(`Enter ${label} number:`);
//       if (!courierSlip) return null;
//     }
//     return await axios.post(`http://localhost:8080/api/items/${id}/dispatch`, { action, courierSlip });
//   };

//   const handleSingleAction = async (id, action) => {
//     setLoadingId(id);
//     try {
//       const res = await dispatchAction(id, action);
//       if (res && res.data.success) {
//         setMsg({ type: "success", text: "Updated successfully!" });
//         if (socket) socket.emit("itemUpdated", res.data.data);
//         fetchItems();
//       }
//     } catch (err) { setMsg({ type: "error", text: "Update failed" }); }
//     finally { setLoadingId(null); }
//   };

//   const handleBulkAction = async (action) => {
//     if (selectedIds.length === 0) return alert("Please select items first!");
//     const selectedItemsData = items.filter(it => selectedIds.includes(it.id));
//     const cannotProcessIds = [];
//     const toProcessIds = [];
//     selectedItemsData.forEach(item => {
//         const state = getButtonStatus(item, action);
//         if (state.isDone || state.disabled || state.hidden) { 
//             cannotProcessIds.push(item.trackingId);
//         } else {
//             toProcessIds.push(item.id);
//         }
//     });
//     if (cannotProcessIds.length > 0) alert(`Check items again (Processed, Hidden or out of sequence)`);
//     if (toProcessIds.length === 0) return;
    
//     let courierSlip = null;
//     const allLocalRepair = selectedItemsData.every(it => it.type && it.type.toLowerCase().trim() === 'local repair');

//     // Only prompt if Action requires slip AND items are NOT Local Repair
//     if (!allLocalRepair && (action === "to_warehouse" || action === "dispatch")) {
//       courierSlip = prompt(`Enter common Slip number:`);
//       if (!courierSlip) return;
//     }

//     setLoadingId("bulk");
//     try {
//       await Promise.all(toProcessIds.map(id => dispatchAction(id, action, courierSlip)));
//       setMsg({ type: "success", text: `Bulk updated ${toProcessIds.length} items!` });
//       setSelectedIds([]);
//       fetchItems();
//     } catch (err) { setMsg({ type: "error", text: "Bulk failed" }); }
//     finally { setLoadingId(null); }
//   };

//   const handleSaveRemarks = async (id) => {
//     try {
//       setLoadingId(id);
//       const res = await axios.put(`http://localhost:8080/api/items/${id}`, { remarksWH: tempRemarks[id] });
//       if (res.data.success) {
//         setMsg({ type: "success", text: "Remarks saved!" });
//         setActiveRemarksId(null);
//         fetchItems();
//       }
//     } catch (err) { setMsg({ type: "error", text: "Failed to save remarks" }); }
//     finally { setLoadingId(null); }
//   };

//   const toggleSelect = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

//   const statuses = [
//     { key: "to_warehouse", label: "To WH", color: "bg-amber-500" },
//     { key: "to_production", label: "Recvd WH", color: "bg-blue-600" },
//     { key: "dispatch", label: "Dispatch", color: "bg-green-600" },
//     { key: "rec_store_wh", label: "Rec Store From W.H", color: "bg-purple-600" },
//     { key: "store_to_customer", label: "Store To Cust", color: "bg-rose-600" },
//   ];

//   return (
//     <div className="space-y-4 animate-fadeIn relative">
//       <div className="flex flex-col gap-3">
//         {/* Top Header & Date/Store Controls */}
//         <div className="flex flex-wrap justify-between items-center bg-white p-3 rounded-xl shadow-sm border border-gray-100 gap-3">
//           <div className="flex items-center gap-4">
//             <h2 className="text-xl font-bold text-slate-800 tracking-tight">Inventory Matrix</h2>
//             <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
//                <select value={selectedStore} onChange={(e) => setSelectedStore(e.target.value)} className="bg-white px-2 py-1 rounded text-[10px] font-bold border border-slate-200 outline-none">
//                  <option value="all">All Stores</option>
//                  {accessibleStores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
//                </select>
//                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-white px-1 py-1 rounded text-[10px] font-bold border border-slate-200 outline-none" />
//                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-white px-1 py-1 rounded text-[10px] font-bold border border-slate-200 outline-none" />
//             </div>
             
//              {/* ⭐ UPDATED: MULTI-SELECT WITH CHECKBOXES */}
//             <div className="flex items-center gap-2">
//                 <button onClick={() => { setMultiSelectMode(!multiSelectMode); setSelectedIds([]); }} className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase transition-all shadow-sm ${multiSelectMode ? 'bg-rose-500 text-white' : 'bg-sky-600 text-white'}`}>
//                     {multiSelectMode ? "✖ Exit Multi-Select" : "⚙ Option Multiple Select"}
//                 </button>
//                 {multiSelectMode && (
//                     <div className="flex items-center gap-4 bg-slate-50 px-4 py-1.5 rounded-full border border-slate-200 shadow-inner">
//                         {/* 1. To Store Checkbox */}
//                         <label className="flex items-center gap-2 cursor-pointer select-none">
//                             <input type="checkbox" 
//                                 checked={filterTypes.includes('store')} 
//                                 onChange={() => toggleFilterType('store')} 
//                                 className="w-3.5 h-3.5 rounded text-sky-600 focus:ring-sky-500 border-gray-300" 
//                             />
//                             <span className={`text-[11px] font-black uppercase ${filterTypes.includes('store') ? 'text-sky-600' : 'text-slate-400'}`}>To Store</span>
//                         </label>

//                         {/* 2. To Customer Checkbox */}
//                         <label className="flex items-center gap-2 cursor-pointer select-none">
//                             <input type="checkbox" 
//                                 checked={filterTypes.includes('customer')} 
//                                 onChange={() => toggleFilterType('customer')}
//                                 className="w-3.5 h-3.5 rounded text-rose-600 focus:ring-rose-500 border-gray-300"
//                             />
//                             <span className={`text-[11px] font-black uppercase ${filterTypes.includes('customer') ? 'text-rose-600' : 'text-slate-400'}`}>To Customer</span>
//                         </label>
                        
//                         {/* 3. ⭐ NEW: Local Repair Checkbox */}
//                         <label className="flex items-center gap-2 cursor-pointer select-none border-l border-slate-300 pl-4">
//                             <input type="checkbox" 
//                                 checked={filterTypes.includes('local')} 
//                                 onChange={() => toggleFilterType('local')}
//                                 className="w-3.5 h-3.5 rounded text-amber-600 focus:ring-amber-500 border-gray-300"
//                             />
//                             <span className={`text-[11px] font-black uppercase ${filterTypes.includes('local') ? 'text-amber-600' : 'text-slate-400'}`}>Local Repair</span>
//                         </label>
//                     </div>
//                 )}
//             </div>
//           </div>
//           {msg && <div className={`text-xs font-bold ${msg.type === 'error' ? 'text-red-500' : 'text-green-600'}`}>{msg.text}</div>}
//         </div>

//         {/* Action Filter Buttons (Dispatchables / Receivables) */}
//         <div className="flex justify-between items-center">
//             <div className="flex gap-2">
//                 <button 
//                   onClick={() => setActionFilter('all')} 
//                   className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wide transition-all ${actionFilter === 'all' ? 'bg-slate-800 text-white shadow-lg scale-105' : 'bg-white text-slate-400 border border-slate-200 hover:bg-slate-50'}`}
//                 >
//                   All Items
//                 </button>
//                 <button 
//                   onClick={() => setActionFilter('dispatchable')} 
//                   className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wide transition-all ${actionFilter === 'dispatchable' ? 'bg-indigo-600 text-white shadow-lg scale-105' : 'bg-white text-slate-400 border border-slate-200 hover:bg-indigo-50 hover:text-indigo-600'}`}
//                 >
//                   📤 Dispatchables
//                 </button>
//                 <button 
//                   onClick={() => setActionFilter('receivable')} 
//                   className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wide transition-all ${actionFilter === 'receivable' ? 'bg-emerald-600 text-white shadow-lg scale-105' : 'bg-white text-slate-400 border border-slate-200 hover:bg-emerald-50 hover:text-emerald-600'}`}
//                 >
//                   📥 Receivables
//                 </button>
//             </div>
//         </div>
//       </div>

//       {/* Bulk Action Bar (Context Aware) */}
//       {multiSelectMode && selectedIds.length > 0 && (
//         <div className="bg-slate-900 p-2 rounded-xl flex items-center justify-between shadow-2xl sticky top-2 z-10 border border-slate-700">
//           <span className="text-sky-400 text-[10px] font-black px-3 uppercase tracking-widest">{selectedIds.length} Selection Active</span>
//           <div className="flex gap-2">
//             {statuses.map(st => {
//               // Standard Permissions
//               if (user?.type === "Store") {
//                 const storeAllowed = ["to_warehouse", "rec_store_wh", "store_to_customer"];
//                 if (!storeAllowed.includes(st.key)) return null;
//               } else if (user?.type === "Warehouse") {
//                 const whAllowed = ["to_production", "dispatch"];
//                 if (!whAllowed.includes(st.key)) return null;
//               }
              
//               // Note: We removed the check for 'filterType' because we now allow multiple types.
//               // Instead, we rely on the logic in handleBulkAction to filter out invalid clicks.
              
//               // Filter Bulk Buttons based on Active Tab (Dispatch vs Receive)
//               if (actionFilter === 'dispatchable') {
//                   const dispatchKeys = ['to_warehouse', 'store_to_customer', 'dispatch'];
//                   if (!dispatchKeys.includes(st.key)) return null;
//               }
//               if (actionFilter === 'receivable') {
//                   const receiveKeys = ['rec_store_wh', 'to_production'];
//                   if (!receiveKeys.includes(st.key)) return null;
//               }

//               return (
//                 <button key={st.key} onClick={() => handleBulkAction(st.key)} className={`${st.color} text-white text-[9px] font-black px-4 py-1.5 rounded-lg hover:scale-105 transition-all`}>
//                   BULK {st.label}
//                 </button>
//               );
//             })}
//           </div>
//         </div>
//       )}

//       {/* Table Section */}
//       <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
//         <div className="overflow-x-auto">
//           <table className="w-full text-left whitespace-nowrap">
//             <thead className="bg-slate-50 border-b border-slate-100">
//               <tr className="text-[10px] uppercase text-slate-400 font-black">
//                 {multiSelectMode && <th className="p-4 w-10 text-center">Select</th>}
//                 <th className="p-4">Tracking</th>
//                 <th className="p-4">Article</th>
//                 <th className="p-4">Return To</th>
//                 <th className="p-4">Status & Remarks</th>
//                 <th className="p-4 text-center">Actions / View</th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-slate-50">
//               {currentItems.map((it) => (
//                 <tr key={it.id} className={`hover:bg-sky-50/30 transition-colors ${selectedIds.includes(it.id) ? 'bg-sky-50/60' : ''}`}>
//                   {multiSelectMode && (
//                     <td className="p-4 text-center">
//                       <input type="checkbox" checked={selectedIds.includes(it.id)} onChange={() => toggleSelect(it.id)} className="w-4 h-4 rounded text-sky-600 cursor-pointer" />
//                     </td>
//                   )}
//                   <td className="p-4 font-black text-sky-900 text-xs">{it.trackingId}</td>
//                   <td className="p-4 font-bold text-slate-700 text-[11px]">{it.articleNo} ({it.size})</td>
//                   <td className="p-4">
//                     <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${it.returnto === 'To Store' ? 'text-indigo-600 bg-indigo-50' : 'text-rose-600 bg-rose-50'}`}>{it.returnto}</span>
//                     {it.type && it.type.toLowerCase().trim() === 'local repair' && 
//                         <span className="ml-1 text-[9px] font-bold bg-amber-100 text-amber-700 px-1 rounded border border-amber-200">LOCAL</span>
//                     }
//                   </td>
//                   <td className="p-4">
//                     <div className="flex flex-col">
//                         <span className="font-black text-[9px] text-slate-500 uppercase">{it.status}</span>
//                         {it.remarksWH && <span className="text-[9px] font-bold text-sky-600 italic">R: {it.remarksWH}</span>}
//                     </div>
//                   </td>
//                   <td className="p-4 text-center">
//                     <div className="flex justify-center items-center gap-1">
//                       {statuses.map((st) => {
//                         const state = getButtonStatus(it, st.key);
//                         if (state.hidden) return null;
                        
//                         // If in Dispatchable/Receivable mode, HIDE non-clickable buttons
//                         if (actionFilter !== 'all') {
//                              if (state.disabled || state.isDone) return null;
//                         }

//                         let btnLbl = st.label;
//                         if (st.key === "dispatch") btnLbl = it.returnto === "To Store" ? "Disp Store" : "Disp Cust";
                        
//                         return (
//                           <button 
//                             key={st.key} 
//                             onClick={() => handleSingleAction(it.id, st.key)} 
//                             disabled={state.disabled || loadingId === it.id} 
//                             title={state.title}
//                             className={`px-2 py-1 rounded text-[9px] font-bold text-white transition-all ${state.disabled ? state.className : `${st.color} ${state.className}`}`}
//                           >
//                             {btnLbl}
//                           </button>
//                         );
//                       })}
//                       <button onClick={() => { setActiveRemarksId(activeRemarksId === it.id ? null : it.id); setTempRemarks({...tempRemarks, [it.id]: it.remarksWH || ""}); }} className={`p-1.5 rounded-full ${activeRemarksId === it.id ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-sky-200'}`}>💬</button>
//                       <button onClick={() => setViewingItem(it)} className="p-1.5 bg-slate-100 text-slate-600 rounded-full hover:bg-sky-100 shadow-sm">👁️</button>
//                     </div>
//                     {activeRemarksId === it.id && (
//                         <div className="mt-2 flex gap-1 animate-slideInRight">
//                             <input type="text" className="border border-sky-300 rounded px-2 py-1 text-[10px] w-full focus:ring-1 focus:ring-sky-500 outline-none" value={tempRemarks[it.id] || ""} onChange={(e) => setTempRemarks({...tempRemarks, [it.id]: e.target.value})} onKeyDown={(e) => e.key === 'Enter' && handleSaveRemarks(it.id)} />
//                             <button onClick={() => handleSaveRemarks(it.id)} className="bg-green-600 text-white px-2 py-1 rounded text-[9px] font-bold">SAVE</button>
//                         </div>
//                     )}
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       </div>

//       {/* VIEW DETAILS MODAL */}
//       {viewingItem && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
//           <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-slate-200">
            
//             {/* Modal Header */}
//             <div className="bg-slate-900 p-6 flex justify-between items-center sticky top-0 z-10 shadow-lg">
//               <div>
//                 <h3 className="text-3xl font-black text-white tracking-tight">{viewingItem.trackingId}</h3>
//                 <span className="text-sky-400 text-xs font-bold uppercase tracking-widest bg-sky-900/50 px-2 py-1 rounded">
//                   Status: {viewingItem.status}
//                 </span>
//               </div>
//               <button 
//                 onClick={() => setViewingItem(null)} 
//                 className="bg-white/10 hover:bg-rose-500 text-white w-10 h-10 rounded-full flex items-center justify-center transition-all text-xl font-bold"
//               >
//                 ✕
//               </button>
//             </div>

//             {/* Modal Body */}
//             <div className="p-8 space-y-8">
              
//               {/* Row 1: Primary Info */}
//               <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
//                 <h4 className="text-xs font-black text-sky-600 uppercase mb-4 border-b border-slate-200 pb-2">Product & Invoice</h4>
//                 <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
//                   <DetailBox label="Invoice No" value={viewingItem.invoiceNo} />
//                   <DetailBox label="Article" value={viewingItem.articleNo} />
//                   <DetailBox label="Size" value={viewingItem.size} />
//                   <DetailBox label="Color" value={viewingItem.color} />
//                   <DetailBox label="Category" value={viewingItem.category ? viewingItem.category.name : "N/A"} />
//                 </div>
//               </div>

//               {/* Row 2: Customer Info */}
//               <div>
//                 <h4 className="text-xs font-black text-slate-400 uppercase mb-4 border-b border-slate-100 pb-2">Customer Details</h4>
//                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//                   <DetailBox label="Customer Name" value={viewingItem.customerName} />
//                   <DetailBox label="Mobile" value={viewingItem.customerMobile} />
//                   <DetailBox label="Address" value={viewingItem.billingAddress} />
//                 </div>
//               </div>

//               {/* Row 3: Dates & Type */}
//               <div className="grid grid-cols-2 md:grid-cols-4 gap-6 bg-sky-50/50 p-5 rounded-2xl border border-sky-100">
//                 <DetailBox label="Service Type" value={viewingItem.type} />
//                 <DetailBox label="Receiving Date" value={viewingItem.receivingDate} />
//                 <DetailBox label="Est. Completion" value={viewingItem.estimatedCompletionDate} />
//                 <DetailBox label="Claim Amount" value={`PKR ${viewingItem.claimAmount}`} />
//               </div>

//               {/* Row 4: Problem Description */}
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
//                 <div>
//                    <h4 className="text-xs font-black text-slate-400 uppercase mb-2">Problem Description</h4>
//                    <p className="p-4 bg-slate-50 border-l-4 border-rose-400 text-sm font-medium text-slate-700 italic rounded-r-lg">
//                      "{viewingItem.problemDescription}"
//                    </p>
//                 </div>
//                 <div>
//                    <h4 className="text-xs font-black text-slate-400 uppercase mb-2">Identify Flags</h4>
//                    <div className="flex flex-wrap gap-2">
//                       {['upper', 'buckle', 'sole', 'inSocks', 'color', 'refinishing'].map(k => (
//                         viewingItem[k + 'Problem'] === 'Y' && (
//                           <span key={k} className="bg-slate-800 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wide">
//                             {k}
//                           </span>
//                         )
//                       ))}
//                       {!['upper', 'buckle', 'sole', 'inSocks', 'color', 'refinishing'].some(k => viewingItem[k + 'Problem'] === 'Y') && 
//                         <span className="text-xs text-slate-400">No specific flags marked.</span>
//                       }
//                    </div>
//                 </div>
//               </div>

//               {/* Row 5: Logistics / Warehouse Info */}
//               <div className="border-t-2 border-slate-100 pt-6">
//                 <h4 className="text-xs font-black text-slate-400 uppercase mb-4">Logistics & Tracking</h4>
//                 <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
//                   <DetailBox label="Store" value={viewingItem.store ? viewingItem.store.name : "Unknown"} />
//                   <DetailBox label="Warehouse" value={viewingItem.warehouse} />
//                   <DetailBox label="Return Route" value={viewingItem.returnto} />
//                   <DetailBox label="Current Remarks" value={viewingItem.remarksWH} />
//                 </div>
//                 <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-4">
//                   <DetailBox label="To WH Date" value={viewingItem.dispatchToWarehouseDate ? new Date(viewingItem.dispatchToWarehouseDate).toLocaleDateString() : '-'} />
//                   <DetailBox label="Rec @ WH Date" value={viewingItem.dispatchToProductionDate ? new Date(viewingItem.dispatchToProductionDate).toLocaleDateString() : '-'} />
//                   <DetailBox label="WH Slip" value={viewingItem.courierSlip} />
//                   <DetailBox label="Dispatch Slip" value={viewingItem.dispatchCourierSlip} />
//                 </div>
//               </div>

//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// function DetailBox({ label, value }) {
//   return (
//     <div className="flex flex-col gap-0.5">
//       <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter block">{label}</span>
//       <span className="text-sm font-bold text-slate-800 break-words">{value || "---"}</span>
//     </div>
//   );
// }














// import React, { useState, useEffect, useMemo } from "react";
// import axios from "axios";

// export default function ItemList({ refresh, socket, user: propUser }) {
//   const [items, setItems] = useState([]);
//   const [allUsers, setAllUsers] = useState([]);
//   const [msg, setMsg] = useState(null);
//   const [loadingId, setLoadingId] = useState(null);
//   const [currentPage, setCurrentPage] = useState(1);
//   const itemsPerPage = 20;

//   const [multiSelectMode, setMultiSelectMode] = useState(false);
//   const [selectedIds, setSelectedIds] = useState([]);
//   const [filterType, setFilterType] = useState('store'); 
//   const [viewingItem, setViewingItem] = useState(null);

//   // ⭐ New State for Action Filter (All / Dispatchables / Receivables)
//   const [actionFilter, setActionFilter] = useState('all'); 
  
//   const user = useMemo(() => {
//     if (propUser && propUser.id) return propUser;
//     const saved = localStorage.getItem("user");
//     return saved ? JSON.parse(saved) : null;
//   }, [propUser]);

//   // ⭐ Auto-set Default Filter based on User Type
//   useEffect(() => {
//     if (user?.type === 'Store') {
//       setActionFilter('dispatchable');
//     } else if (user?.type === 'Warehouse') {
//       setActionFilter('receivable');
//     } else {
//       setActionFilter('all');
//     }
//   }, [user?.type]);

//   const [selectedStore, setSelectedStore] = useState('all');
//   const today = new Date().toISOString().split('T')[0];
//   const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
//   const [startDate, setStartDate] = useState(firstDay); 
//   const [endDate, setEndDate] = useState(today);

//   const [activeRemarksId, setActiveRemarksId] = useState(null);
//   const [tempRemarks, setTempRemarks] = useState({});

//   useEffect(() => {
//     if (msg) {
//       const timer = setTimeout(() => setMsg(null), 5000);
//       return () => clearTimeout(timer);
//     }
//   }, [msg]);

//   const fetchItems = async () => {
//     if (!user || !user.id) return; 
//     try {
//       const res = await axios.get('http://localhost:8080/api/items', {
//         params: { userId: user.id, type: user.type, storeId: selectedStore, startDate: startDate, endDate: endDate }
//       });
//       if (res.data.success) setItems(res.data.data || []);
//       const userRes = await axios.get("http://localhost:8080/api/users");
//       setAllUsers(userRes.data || []);
//     } catch (err) { console.error("Fetch Error:", err); }
//   };

//   useEffect(() => { fetchItems(); }, [refresh, user, selectedStore, startDate, endDate]);

//   const accessibleStores = useMemo(() => {
//     if (user?.type === 'Admin') return allUsers;
//     const assignedIds = user?.assignedUsers ? user.assignedUsers.split(',').filter(id => id).map(id => parseInt(id)) : [];
//     const myIds = [user?.id, ...assignedIds];
//     return allUsers.filter(u => myIds.includes(u.id));
//   }, [allUsers, user]);

//   // ⭐ Refined Filtering Logic (Includes Action Filter)
//   const filteredItems = useMemo(() => {
//     let result = items;

//     // 1. Existing ReturnTo Filter
//     if (multiSelectMode) {
//         const target = filterType === 'store' ? "To Store" : "To Customer";
//         result = result.filter(it => it.returnto === target);
//     }

//     // 2. Action Filter Logic (Dispatchable vs Receivable)
//     if (actionFilter !== 'all') {
//         result = result.filter(it => {
//             const s = it.status;
//             // Check if item is Local Repair
//             const isLocalRepair = it.type && it.type.toLowerCase().trim() === 'local repair';
            
//             if (user?.type === 'Store') {
//                 if (actionFilter === 'dispatchable') {
//                     // Store Dispatch: Waiting to go to WH OR Waiting to go to Customer
//                     return s === "Received at Store" || s === "Received at Store From WH";
//                 }
//                 if (actionFilter === 'receivable') {
//                     // ⭐ FIX: Add Local Repair Logic
//                     // 1. Normal Item: "Dispatch" (Waiting for store to receive from Warehouse)
//                     // 2. Local Repair: "Dispatched to Warehouse" (Actually means 'Under Repair', waiting for store to receive back)
//                     return s === "Dispatch" || (isLocalRepair && s === "Dispatched to Warehouse"); 
//                 }
//             }
            
//             if (user?.type === 'Warehouse') {
//                 if (actionFilter === 'dispatchable') {
//                     // WH Dispatch: Ready to go out
//                     return s === "Received at Warehouse";
//                 }
//                 if (actionFilter === 'receivable') {
//                     // WH Receive: Store sent it, waiting for WH to receive
//                     return s === "Dispatched to Warehouse";
//                 }
//             }
//             return true;
//         });
//     }

//     return result;
//   }, [items, multiSelectMode, filterType, actionFilter, user]);

//   const currentItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

//   const getButtonStatus = (item, btnKey) => {
//     const status = item.status;
//     const returnto = item.returnto;
//     const type = item.type; 
//     const userType = user?.type;

//     const S1 = "Received at Store";
//     const S2 = "Dispatched to Warehouse";
//     const S3 = "Received at Warehouse";
//     const S4 = "Dispatch";
//     const S5 = "Received at Store From WH";
//     const S6 = "Store To Customer"; 

//     // 1. Permission Logic
//     if (userType === "Store") {
//       const storeAllowed = ["to_warehouse", "rec_store_wh", "store_to_customer"];
//       if (!storeAllowed.includes(btnKey)) return { hidden: true };
//     } else if (userType === "Warehouse") {
//       const whAllowed = ["to_production", "dispatch"];
//       if (!whAllowed.includes(btnKey)) return { hidden: true };
//     }

//     // 2. Flow Selection
//     let currentSeq = [];
//     let btnMap = {};
//     const isLocalRepair = type && type.toLowerCase().trim() === 'local repair';

//     if (isLocalRepair) {
//       currentSeq = [S1, S2, S5, S6]; 
//       btnMap = {
//         to_warehouse: S2,
//         to_production: null, 
//         dispatch: null,      
//         rec_store_wh: S5,
//         store_to_customer: S6
//       };
//     } else {
//       const seqStore = [S1, S2, S3, S4, S5, S6];
//       const seqCust = [S1, S2, S3, S4];
//       currentSeq = returnto === "To Store" ? seqStore : seqCust;
//       btnMap = {
//         to_warehouse: S2,
//         to_production: S3,
//         dispatch: S4,
//         rec_store_wh: returnto === "To Store" ? S5 : null,
//         store_to_customer: returnto === "To Store" ? S6 : null
//       };
//     }

//     const targetStatus = btnMap[btnKey];
//     if (!targetStatus) return { hidden: true };

//     const currentIndex = currentSeq.indexOf(status);
//     const targetIndex = currentSeq.indexOf(targetStatus);

//     if (currentIndex >= targetIndex) return { isDone: true, disabled: true, title: "Already Processed", className: "bg-gray-400 opacity-50 cursor-not-allowed" };
//     if (currentIndex === targetIndex - 1) return { isDone: false, disabled: false, title: "", className: "hover:brightness-110 shadow-sm" };
    
//     return { isDone: false, disabled: true, title: "Locked", className: "bg-slate-100 text-slate-300 cursor-not-allowed border border-slate-200" };
//   };

//   const dispatchAction = async (id, action, courierSlipInput = null) => {
//     // ⭐ FIX: Check Item Type to disable Prompt for Local Repair
//     const item = items.find(i => i.id === id);
//     const isLocalRepair = item && item.type && item.type.toLowerCase().trim() === 'local repair';

//     let courierSlip = courierSlipInput;
    
//     // Only prompt for slip if NOT Local Repair
//     if (!isLocalRepair && !courierSlip && (action === "to_warehouse" || action === "dispatch")) {
//       const label = action === "to_warehouse" ? "Warehouse Courier Slip" : "Final Dispatch Slip";
//       courierSlip = prompt(`Enter ${label} number:`);
//       if (!courierSlip) return null;
//     }
//     return await axios.post(`http://localhost:8080/api/items/${id}/dispatch`, { action, courierSlip });
//   };

//   const handleSingleAction = async (id, action) => {
//     setLoadingId(id);
//     try {
//       const res = await dispatchAction(id, action);
//       if (res && res.data.success) {
//         setMsg({ type: "success", text: "Updated successfully!" });
//         if (socket) socket.emit("itemUpdated", res.data.data);
//         fetchItems();
//       }
//     } catch (err) { setMsg({ type: "error", text: "Update failed" }); }
//     finally { setLoadingId(null); }
//   };

//   const handleBulkAction = async (action) => {
//     if (selectedIds.length === 0) return alert("Please select items first!");
//     const selectedItemsData = items.filter(it => selectedIds.includes(it.id));
//     const cannotProcessIds = [];
//     const toProcessIds = [];
//     selectedItemsData.forEach(item => {
//         const state = getButtonStatus(item, action);
//         if (state.isDone || state.disabled || state.hidden) { 
//             cannotProcessIds.push(item.trackingId);
//         } else {
//             toProcessIds.push(item.id);
//         }
//     });
//     if (cannotProcessIds.length > 0) alert(`Check items again (Processed, Hidden or out of sequence)`);
//     if (toProcessIds.length === 0) return;
    
//     let courierSlip = null;
    
//     // ⭐ FIX: Check if ALL selected items are Local Repair
//     const allLocalRepair = selectedItemsData.every(it => it.type && it.type.toLowerCase().trim() === 'local repair');

//     // Only prompt if Action requires slip AND items are NOT Local Repair
//     if (!allLocalRepair && (action === "to_warehouse" || action === "dispatch")) {
//       courierSlip = prompt(`Enter common Slip number:`);
//       if (!courierSlip) return;
//     }

//     setLoadingId("bulk");
//     try {
//       await Promise.all(toProcessIds.map(id => dispatchAction(id, action, courierSlip)));
//       setMsg({ type: "success", text: `Bulk updated ${toProcessIds.length} items!` });
//       setSelectedIds([]);
//       fetchItems();
//     } catch (err) { setMsg({ type: "error", text: "Bulk failed" }); }
//     finally { setLoadingId(null); }
//   };

//   const handleSaveRemarks = async (id) => {
//     try {
//       setLoadingId(id);
//       const res = await axios.put(`http://localhost:8080/api/items/${id}`, { remarksWH: tempRemarks[id] });
//       if (res.data.success) {
//         setMsg({ type: "success", text: "Remarks saved!" });
//         setActiveRemarksId(null);
//         fetchItems();
//       }
//     } catch (err) { setMsg({ type: "error", text: "Failed to save remarks" }); }
//     finally { setLoadingId(null); }
//   };

//   const toggleSelect = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

//   const statuses = [
//     { key: "to_warehouse", label: "To WH", color: "bg-amber-500" },
//     { key: "to_production", label: "Recvd WH", color: "bg-blue-600" },
//     { key: "dispatch", label: "Dispatch", color: "bg-green-600" },
//     { key: "rec_store_wh", label: "Rec Store From W.H", color: "bg-purple-600" },
//     { key: "store_to_customer", label: "Store To Cust", color: "bg-rose-600" },
//   ];

//   return (
//     <div className="space-y-4 animate-fadeIn relative">
//       <div className="flex flex-col gap-3">
//         {/* Top Header & Date/Store Controls */}
//         <div className="flex flex-wrap justify-between items-center bg-white p-3 rounded-xl shadow-sm border border-gray-100 gap-3">
//           <div className="flex items-center gap-4">
//             <h2 className="text-xl font-bold text-slate-800 tracking-tight">Inventory Matrix</h2>
//             <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
//                <select value={selectedStore} onChange={(e) => setSelectedStore(e.target.value)} className="bg-white px-2 py-1 rounded text-[10px] font-bold border border-slate-200 outline-none">
//                  <option value="all">All Stores</option>
//                  {accessibleStores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
//                </select>
//                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-white px-1 py-1 rounded text-[10px] font-bold border border-slate-200 outline-none" />
//                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-white px-1 py-1 rounded text-[10px] font-bold border border-slate-200 outline-none" />
//             </div>
//              {/* Existing Multi-Select Toggle */}
//             <div className="flex items-center gap-2">
//                 <button onClick={() => { setMultiSelectMode(!multiSelectMode); setSelectedIds([]); }} className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase transition-all shadow-sm ${multiSelectMode ? 'bg-rose-500 text-white' : 'bg-sky-600 text-white'}`}>
//                     {multiSelectMode ? "✖ Exit Multi-Select" : "⚙ Option Multiple Select"}
//                 </button>
//                 {multiSelectMode && (
//                     <div className="flex items-center gap-4 bg-slate-50 px-4 py-1.5 rounded-full border border-slate-200">
//                     <label className="flex items-center gap-2 cursor-pointer">
//                         <input type="radio" name="filterMode" checked={filterType === 'store'} onChange={() => { setFilterType('store'); setSelectedIds([]); }} />
//                         <span className={`text-[11px] font-black uppercase ${filterType === 'store' ? 'text-sky-600' : 'text-slate-400'}`}>To Store</span>
//                     </label>
//                     <label className="flex items-center gap-2 cursor-pointer">
//                         <input type="radio" name="filterMode" checked={filterType === 'customer'} onChange={() => { setFilterType('customer'); setSelectedIds([]); }} />
//                         <span className={`text-[11px] font-black uppercase ${filterType === 'customer' ? 'text-rose-600' : 'text-slate-400'}`}>To Customer</span>
//                     </label>
//                     </div>
//                 )}
//             </div>
//           </div>
//           {msg && <div className={`text-xs font-bold ${msg.type === 'error' ? 'text-red-500' : 'text-green-600'}`}>{msg.text}</div>}
//         </div>

//         {/* ⭐ NEW: Action Filter Buttons (Dispatchables / Receivables) */}
//         <div className="flex justify-between items-center">
//             <div className="flex gap-2">
//                 <button 
//                   onClick={() => setActionFilter('all')} 
//                   className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wide transition-all ${actionFilter === 'all' ? 'bg-slate-800 text-white shadow-lg scale-105' : 'bg-white text-slate-400 border border-slate-200 hover:bg-slate-50'}`}
//                 >
//                   All Items
//                 </button>
//                 <button 
//                   onClick={() => setActionFilter('dispatchable')} 
//                   className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wide transition-all ${actionFilter === 'dispatchable' ? 'bg-indigo-600 text-white shadow-lg scale-105' : 'bg-white text-slate-400 border border-slate-200 hover:bg-indigo-50 hover:text-indigo-600'}`}
//                 >
//                   📤 Dispatchables
//                 </button>
//                 <button 
//                   onClick={() => setActionFilter('receivable')} 
//                   className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wide transition-all ${actionFilter === 'receivable' ? 'bg-emerald-600 text-white shadow-lg scale-105' : 'bg-white text-slate-400 border border-slate-200 hover:bg-emerald-50 hover:text-emerald-600'}`}
//                 >
//                   📥 Receivables
//                 </button>
//             </div>

           
//         </div>
//       </div>

//       {/* ⭐ 2. Bulk Action Bar (Context Aware) */}
//       {multiSelectMode && selectedIds.length > 0 && (
//         <div className="bg-slate-900 p-2 rounded-xl flex items-center justify-between shadow-2xl sticky top-2 z-10 border border-slate-700">
//           <span className="text-sky-400 text-[10px] font-black px-3 uppercase tracking-widest">{selectedIds.length} Selection Active</span>
//           <div className="flex gap-2">
//             {statuses.map(st => {
//               // Standard Permissions
//               if (user?.type === "Store") {
//                 const storeAllowed = ["to_warehouse", "rec_store_wh", "store_to_customer"];
//                 if (!storeAllowed.includes(st.key)) return null;
//               } else if (user?.type === "Warehouse") {
//                 const whAllowed = ["to_production", "dispatch"];
//                 if (!whAllowed.includes(st.key)) return null;
//               }

//               if (filterType === 'customer' && (st.key === "rec_store_wh" || st.key === "store_to_customer")) return null;
              
//               // ⭐ Filter Bulk Buttons based on Active Tab (Dispatch vs Receive)
//               if (actionFilter === 'dispatchable') {
//                   const dispatchKeys = ['to_warehouse', 'store_to_customer', 'dispatch'];
//                   if (!dispatchKeys.includes(st.key)) return null;
//               }
//               if (actionFilter === 'receivable') {
//                   const receiveKeys = ['rec_store_wh', 'to_production'];
//                   if (!receiveKeys.includes(st.key)) return null;
//               }

//               let bulkLabel = st.label;
//               if (st.key === "dispatch") bulkLabel = filterType === 'store' ? "Disp Store" : "Disp Cust";
//               return (
//                 <button key={st.key} onClick={() => handleBulkAction(st.key)} className={`${st.color} text-white text-[9px] font-black px-4 py-1.5 rounded-lg hover:scale-105 transition-all`}>
//                   BULK {bulkLabel}
//                 </button>
//               );
//             })}
//           </div>
//         </div>
//       )}

//       {/* 3. Table Section */}
//       <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
//         <div className="overflow-x-auto">
//           <table className="w-full text-left whitespace-nowrap">
//             <thead className="bg-slate-50 border-b border-slate-100">
//               <tr className="text-[10px] uppercase text-slate-400 font-black">
//                 {multiSelectMode && <th className="p-4 w-10 text-center">Select</th>}
//                 <th className="p-4">Tracking</th>
//                 <th className="p-4">Article</th>
//                 <th className="p-4">Return To</th>
//                 <th className="p-4">Status & Remarks</th>
//                 <th className="p-4 text-center">Actions / View</th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-slate-50">
//               {currentItems.map((it) => (
//                 <tr key={it.id} className={`hover:bg-sky-50/30 transition-colors ${selectedIds.includes(it.id) ? 'bg-sky-50/60' : ''}`}>
//                   {multiSelectMode && (
//                     <td className="p-4 text-center">
//                       <input type="checkbox" checked={selectedIds.includes(it.id)} onChange={() => toggleSelect(it.id)} className="w-4 h-4 rounded text-sky-600 cursor-pointer" />
//                     </td>
//                   )}
//                   <td className="p-4 font-black text-sky-900 text-xs">{it.trackingId}</td>
//                   <td className="p-4 font-bold text-slate-700 text-[11px]">{it.articleNo} ({it.size})</td>
//                   <td className="p-4">
//                     <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${it.returnto === 'To Store' ? 'text-indigo-600 bg-indigo-50' : 'text-rose-600 bg-rose-50'}`}>{it.returnto}</span>
//                   </td>
//                   <td className="p-4">
//                     <div className="flex flex-col">
//                         <span className="font-black text-[9px] text-slate-500 uppercase">{it.status}</span>
//                         {it.remarksWH && <span className="text-[9px] font-bold text-sky-600 italic">R: {it.remarksWH}</span>}
//                     </div>
//                   </td>
//                   <td className="p-4 text-center">
//                     <div className="flex justify-center items-center gap-1">
//                       {statuses.map((st) => {
//                         const state = getButtonStatus(it, st.key);
//                         if (state.hidden) return null;
                        
//                         // ⭐ If in Dispatchable/Receivable mode, HIDE non-clickable buttons
//                         if (actionFilter !== 'all') {
//                              if (state.disabled || state.isDone) return null;
//                         }

//                         let btnLbl = st.label;
//                         if (st.key === "dispatch") btnLbl = it.returnto === "To Store" ? "Disp Store" : "Disp Cust";
                        
//                         return (
//                           <button 
//                             key={st.key} 
//                             onClick={() => handleSingleAction(it.id, st.key)} 
//                             disabled={state.disabled || loadingId === it.id} 
//                             title={state.title}
//                             className={`px-2 py-1 rounded text-[9px] font-bold text-white transition-all ${state.disabled ? state.className : `${st.color} ${state.className}`}`}
//                           >
//                             {btnLbl}
//                           </button>
//                         );
//                       })}
//                       <button onClick={() => { setActiveRemarksId(activeRemarksId === it.id ? null : it.id); setTempRemarks({...tempRemarks, [it.id]: it.remarksWH || ""}); }} className={`p-1.5 rounded-full ${activeRemarksId === it.id ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-sky-200'}`}>💬</button>
//                       <button onClick={() => setViewingItem(it)} className="p-1.5 bg-slate-100 text-slate-600 rounded-full hover:bg-sky-100 shadow-sm">👁️</button>
//                     </div>
//                     {activeRemarksId === it.id && (
//                         <div className="mt-2 flex gap-1 animate-slideInRight">
//                             <input type="text" className="border border-sky-300 rounded px-2 py-1 text-[10px] w-full focus:ring-1 focus:ring-sky-500 outline-none" value={tempRemarks[it.id] || ""} onChange={(e) => setTempRemarks({...tempRemarks, [it.id]: e.target.value})} onKeyDown={(e) => e.key === 'Enter' && handleSaveRemarks(it.id)} />
//                             <button onClick={() => handleSaveRemarks(it.id)} className="bg-green-600 text-white px-2 py-1 rounded text-[9px] font-bold">SAVE</button>
//                         </div>
//                     )}
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       </div>

//       {/* ⭐ START: VIEW DETAILS MODAL ⭐ */}
//       {viewingItem && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
//           <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-slate-200">
            
//             {/* Modal Header */}
//             <div className="bg-slate-900 p-6 flex justify-between items-center sticky top-0 z-10 shadow-lg">
//               <div>
//                 <h3 className="text-3xl font-black text-white tracking-tight">{viewingItem.trackingId}</h3>
//                 <span className="text-sky-400 text-xs font-bold uppercase tracking-widest bg-sky-900/50 px-2 py-1 rounded">
//                   Status: {viewingItem.status}
//                 </span>
//               </div>
//               <button 
//                 onClick={() => setViewingItem(null)} 
//                 className="bg-white/10 hover:bg-rose-500 text-white w-10 h-10 rounded-full flex items-center justify-center transition-all text-xl font-bold"
//               >
//                 ✕
//               </button>
//             </div>

//             {/* Modal Body */}
//             <div className="p-8 space-y-8">
              
//               {/* Row 1: Primary Info */}
//               <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
//                 <h4 className="text-xs font-black text-sky-600 uppercase mb-4 border-b border-slate-200 pb-2">Product & Invoice</h4>
//                 <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
//                   <DetailBox label="Invoice No" value={viewingItem.invoiceNo} />
//                   <DetailBox label="Article" value={viewingItem.articleNo} />
//                   <DetailBox label="Size" value={viewingItem.size} />
//                   <DetailBox label="Color" value={viewingItem.color} />
//                   <DetailBox label="Category" value={viewingItem.category ? viewingItem.category.name : "N/A"} />
//                 </div>
//               </div>

//               {/* Row 2: Customer Info */}
//               <div>
//                 <h4 className="text-xs font-black text-slate-400 uppercase mb-4 border-b border-slate-100 pb-2">Customer Details</h4>
//                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//                   <DetailBox label="Customer Name" value={viewingItem.customerName} />
//                   <DetailBox label="Mobile" value={viewingItem.customerMobile} />
//                   <DetailBox label="Address" value={viewingItem.billingAddress} />
//                 </div>
//               </div>

//               {/* Row 3: Dates & Type */}
//               <div className="grid grid-cols-2 md:grid-cols-4 gap-6 bg-sky-50/50 p-5 rounded-2xl border border-sky-100">
//                 <DetailBox label="Service Type" value={viewingItem.type} />
//                 <DetailBox label="Receiving Date" value={viewingItem.receivingDate} />
//                 <DetailBox label="Est. Completion" value={viewingItem.estimatedCompletionDate} />
//                 <DetailBox label="Claim Amount" value={`PKR ${viewingItem.claimAmount}`} />
//               </div>

//               {/* Row 4: Problem Description */}
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
//                 <div>
//                    <h4 className="text-xs font-black text-slate-400 uppercase mb-2">Problem Description</h4>
//                    <p className="p-4 bg-slate-50 border-l-4 border-rose-400 text-sm font-medium text-slate-700 italic rounded-r-lg">
//                      "{viewingItem.problemDescription}"
//                    </p>
//                 </div>
//                 <div>
//                    <h4 className="text-xs font-black text-slate-400 uppercase mb-2">Identify Flags</h4>
//                    <div className="flex flex-wrap gap-2">
//                       {['upper', 'buckle', 'sole', 'inSocks', 'color', 'refinishing'].map(k => (
//                         viewingItem[k + 'Problem'] === 'Y' && (
//                           <span key={k} className="bg-slate-800 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wide">
//                             {k}
//                           </span>
//                         )
//                       ))}
//                       {!['upper', 'buckle', 'sole', 'inSocks', 'color', 'refinishing'].some(k => viewingItem[k + 'Problem'] === 'Y') && 
//                         <span className="text-xs text-slate-400">No specific flags marked.</span>
//                       }
//                    </div>
//                 </div>
//               </div>

//               {/* Row 5: Logistics / Warehouse Info */}
//               <div className="border-t-2 border-slate-100 pt-6">
//                 <h4 className="text-xs font-black text-slate-400 uppercase mb-4">Logistics & Tracking</h4>
//                 <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
//                   <DetailBox label="Store" value={viewingItem.store ? viewingItem.store.name : "Unknown"} />
//                   <DetailBox label="Warehouse" value={viewingItem.warehouse} />
//                   <DetailBox label="Return Route" value={viewingItem.returnto} />
//                   <DetailBox label="Current Remarks" value={viewingItem.remarksWH} />
//                 </div>
//                 <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-4">
//                   <DetailBox label="To WH Date" value={viewingItem.dispatchToWarehouseDate ? new Date(viewingItem.dispatchToWarehouseDate).toLocaleDateString() : '-'} />
//                   <DetailBox label="Rec @ WH Date" value={viewingItem.dispatchToProductionDate ? new Date(viewingItem.dispatchToProductionDate).toLocaleDateString() : '-'} />
//                   <DetailBox label="WH Slip" value={viewingItem.courierSlip} />
//                   <DetailBox label="Dispatch Slip" value={viewingItem.dispatchCourierSlip} />
//                 </div>
//               </div>

//             </div>
//           </div>
//         </div>
//       )}
//       {/* ⭐ END: VIEW DETAILS MODAL ⭐ */}
//     </div>
//   );
// }

// function DetailBox({ label, value }) {
//   return (
//     <div className="flex flex-col gap-0.5">
//       <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter block">{label}</span>
//       <span className="text-sm font-bold text-slate-800 break-words">{value || "---"}</span>
//     </div>
//   );
// }















// import React, { useState, useEffect, useMemo } from "react";
// import axios from "axios";

// export default function ItemList({ refresh, socket, user: propUser }) {
//   const [items, setItems] = useState([]);
//   const [allUsers, setAllUsers] = useState([]);
//   const [msg, setMsg] = useState(null);
//   const [loadingId, setLoadingId] = useState(null);
//   const [currentPage, setCurrentPage] = useState(1);
//   const itemsPerPage = 20;

//   const [multiSelectMode, setMultiSelectMode] = useState(false);
//   const [selectedIds, setSelectedIds] = useState([]);
//   const [filterType, setFilterType] = useState('store'); 
//   const [viewingItem, setViewingItem] = useState(null);

//   // ⭐ New State for Action Filter (All / Dispatchables / Receivables)
//   const [actionFilter, setActionFilter] = useState('all'); 
  
//   const user = useMemo(() => {
//     if (propUser && propUser.id) return propUser;
//     const saved = localStorage.getItem("user");
//     return saved ? JSON.parse(saved) : null;
//   }, [propUser]);

//   // ⭐ Auto-set Default Filter based on User Type
//   useEffect(() => {
//     if (user?.type === 'Store') {
//       setActionFilter('dispatchable');
//     } else if (user?.type === 'Warehouse') {
//       setActionFilter('receivable');
//     } else {
//       setActionFilter('all');
//     }
//   }, [user?.type]);

//   const [selectedStore, setSelectedStore] = useState('all');
//   const today = new Date().toISOString().split('T')[0];
//   const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
//   const [startDate, setStartDate] = useState(firstDay); 
//   const [endDate, setEndDate] = useState(today);

//   const [activeRemarksId, setActiveRemarksId] = useState(null);
//   const [tempRemarks, setTempRemarks] = useState({});

//   useEffect(() => {
//     if (msg) {
//       const timer = setTimeout(() => setMsg(null), 5000);
//       return () => clearTimeout(timer);
//     }
//   }, [msg]);

//   const fetchItems = async () => {
//     if (!user || !user.id) return; 
//     try {
//       const res = await axios.get('http://localhost:8080/api/items', {
//         params: { userId: user.id, type: user.type, storeId: selectedStore, startDate: startDate, endDate: endDate }
//       });
//       if (res.data.success) setItems(res.data.data || []);
//       const userRes = await axios.get("http://localhost:8080/api/users");
//       setAllUsers(userRes.data || []);
//     } catch (err) { console.error("Fetch Error:", err); }
//   };

//   useEffect(() => { fetchItems(); }, [refresh, user, selectedStore, startDate, endDate]);

//   const accessibleStores = useMemo(() => {
//     if (user?.type === 'Admin') return allUsers;
//     const assignedIds = user?.assignedUsers ? user.assignedUsers.split(',').filter(id => id).map(id => parseInt(id)) : [];
//     const myIds = [user?.id, ...assignedIds];
//     return allUsers.filter(u => myIds.includes(u.id));
//   }, [allUsers, user]);

//   // ⭐ Refined Filtering Logic (Includes Action Filter)
//   const filteredItems = useMemo(() => {
//     let result = items;

//     // 1. Existing ReturnTo Filter
//     if (multiSelectMode) {
//         const target = filterType === 'store' ? "To Store" : "To Customer";
//         result = result.filter(it => it.returnto === target);
//     }

//     // 2. Action Filter Logic (Dispatchable vs Receivable)
//     if (actionFilter !== 'all') {
//         result = result.filter(it => {
//             const s = it.status;
            
//             if (user?.type === 'Store') {
//                 if (actionFilter === 'dispatchable') {
//                     // Store Dispatch: Waiting to go to WH OR Waiting to go to Customer
//                     return s === "Received at Store" || s === "Received at Store From WH";
//                 }
//                 if (actionFilter === 'receivable') {
//                     // Store Receive: WH sent it, waiting for Store to receive
//                     return s === "Dispatch"; 
//                 }
//             }
            
//             if (user?.type === 'Warehouse') {
//                 if (actionFilter === 'dispatchable') {
//                     // WH Dispatch: Ready to go out
//                     return s === "Received at Warehouse";
//                 }
//                 if (actionFilter === 'receivable') {
//                     // WH Receive: Store sent it, waiting for WH to receive
//                     return s === "Dispatched to Warehouse";
//                 }
//             }
//             return true;
//         });
//     }

//     return result;
//   }, [items, multiSelectMode, filterType, actionFilter, user]);

//   const currentItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

//   const getButtonStatus = (item, btnKey) => {
//     const status = item.status;
//     const returnto = item.returnto;
//     const type = item.type; 
//     const userType = user?.type;

//     const S1 = "Received at Store";
//     const S2 = "Dispatched to Warehouse";
//     const S3 = "Received at Warehouse";
//     const S4 = "Dispatch";
//     const S5 = "Received at Store From WH";
//     const S6 = "Store To Customer"; 

//     // 1. Permission Logic
//     if (userType === "Store") {
//       const storeAllowed = ["to_warehouse", "rec_store_wh", "store_to_customer"];
//       if (!storeAllowed.includes(btnKey)) return { hidden: true };
//     } else if (userType === "Warehouse") {
//       const whAllowed = ["to_production", "dispatch"];
//       if (!whAllowed.includes(btnKey)) return { hidden: true };
//     }

//     // 2. Flow Selection
//     let currentSeq = [];
//     let btnMap = {};
//     const isLocalRepair = type && type.toLowerCase().trim() === 'local repair';

//     if (isLocalRepair) {
//       currentSeq = [S1, S2, S5, S6]; 
//       btnMap = {
//         to_warehouse: S2,
//         to_production: null, 
//         dispatch: null,      
//         rec_store_wh: S5,
//         store_to_customer: S6
//       };
//     } else {
//       const seqStore = [S1, S2, S3, S4, S5, S6];
//       const seqCust = [S1, S2, S3, S4];
//       currentSeq = returnto === "To Store" ? seqStore : seqCust;
//       btnMap = {
//         to_warehouse: S2,
//         to_production: S3,
//         dispatch: S4,
//         rec_store_wh: returnto === "To Store" ? S5 : null,
//         store_to_customer: returnto === "To Store" ? S6 : null
//       };
//     }

//     const targetStatus = btnMap[btnKey];
//     if (!targetStatus) return { hidden: true };

//     const currentIndex = currentSeq.indexOf(status);
//     const targetIndex = currentSeq.indexOf(targetStatus);

//     if (currentIndex >= targetIndex) return { isDone: true, disabled: true, title: "Already Processed", className: "bg-gray-400 opacity-50 cursor-not-allowed" };
//     if (currentIndex === targetIndex - 1) return { isDone: false, disabled: false, title: "", className: "hover:brightness-110 shadow-sm" };
    
//     return { isDone: false, disabled: true, title: "Locked", className: "bg-slate-100 text-slate-300 cursor-not-allowed border border-slate-200" };
//   };

//   const dispatchAction = async (id, action, courierSlipInput = null) => {
//     let courierSlip = courierSlipInput;
//     if (!courierSlip && (action === "to_warehouse" || action === "dispatch")) {
//       const label = action === "to_warehouse" ? "Warehouse Courier Slip" : "Final Dispatch Slip";
//       courierSlip = prompt(`Enter ${label} number:`);
//       if (!courierSlip) return null;
//     }
//     return await axios.post(`http://localhost:8080/api/items/${id}/dispatch`, { action, courierSlip });
//   };

//   const handleSingleAction = async (id, action) => {
//     setLoadingId(id);
//     try {
//       const res = await dispatchAction(id, action);
//       if (res && res.data.success) {
//         setMsg({ type: "success", text: "Updated successfully!" });
//         if (socket) socket.emit("itemUpdated", res.data.data);
//         fetchItems();
//       }
//     } catch (err) { setMsg({ type: "error", text: "Update failed" }); }
//     finally { setLoadingId(null); }
//   };

//   const handleBulkAction = async (action) => {
//     if (selectedIds.length === 0) return alert("Please select items first!");
//     const selectedItemsData = items.filter(it => selectedIds.includes(it.id));
//     const cannotProcessIds = [];
//     const toProcessIds = [];
//     selectedItemsData.forEach(item => {
//         const state = getButtonStatus(item, action);
//         if (state.isDone || state.disabled || state.hidden) { 
//             cannotProcessIds.push(item.trackingId);
//         } else {
//             toProcessIds.push(item.id);
//         }
//     });
//     if (cannotProcessIds.length > 0) alert(`Check items again (Processed, Hidden or out of sequence)`);
//     if (toProcessIds.length === 0) return;
//     let courierSlip = null;
//     if (action === "to_warehouse" || action === "dispatch") {
//       courierSlip = prompt(`Enter common Slip number:`);
//       if (!courierSlip) return;
//     }
//     setLoadingId("bulk");
//     try {
//       await Promise.all(toProcessIds.map(id => dispatchAction(id, action, courierSlip)));
//       setMsg({ type: "success", text: `Bulk updated ${toProcessIds.length} items!` });
//       setSelectedIds([]);
//       fetchItems();
//     } catch (err) { setMsg({ type: "error", text: "Bulk failed" }); }
//     finally { setLoadingId(null); }
//   };

//   const handleSaveRemarks = async (id) => {
//     try {
//       setLoadingId(id);
//       const res = await axios.put(`http://localhost:8080/api/items/${id}`, { remarksWH: tempRemarks[id] });
//       if (res.data.success) {
//         setMsg({ type: "success", text: "Remarks saved!" });
//         setActiveRemarksId(null);
//         fetchItems();
//       }
//     } catch (err) { setMsg({ type: "error", text: "Failed to save remarks" }); }
//     finally { setLoadingId(null); }
//   };

//   const toggleSelect = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

//   const statuses = [
//     { key: "to_warehouse", label: "To WH", color: "bg-amber-500" },
//     { key: "to_production", label: "Recvd WH", color: "bg-blue-600" },
//     { key: "dispatch", label: "Dispatch", color: "bg-green-600" },
//     { key: "rec_store_wh", label: "Rec Store From W.H", color: "bg-purple-600" },
//     { key: "store_to_customer", label: "Store To Cust", color: "bg-rose-600" },
//   ];

//   return (
//     <div className="space-y-4 animate-fadeIn relative">
//       <div className="flex flex-col gap-3">
//         {/* Top Header & Date/Store Controls */}
//         <div className="flex flex-wrap justify-between items-center bg-white p-3 rounded-xl shadow-sm border border-gray-100 gap-3">
//           <div className="flex items-center gap-4">
//             <h2 className="text-xl font-bold text-slate-800 tracking-tight">Inventory Matrix</h2>
//             <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
//                <select value={selectedStore} onChange={(e) => setSelectedStore(e.target.value)} className="bg-white px-2 py-1 rounded text-[10px] font-bold border border-slate-200 outline-none">
//                  <option value="all">All Stores</option>
//                  {accessibleStores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
//                </select>
//                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-white px-1 py-1 rounded text-[10px] font-bold border border-slate-200 outline-none" />
//                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-white px-1 py-1 rounded text-[10px] font-bold border border-slate-200 outline-none" />
//             </div>
//              {/* Existing Multi-Select Toggle */}
//             <div className="flex items-center gap-2">
//                 <button onClick={() => { setMultiSelectMode(!multiSelectMode); setSelectedIds([]); }} className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase transition-all shadow-sm ${multiSelectMode ? 'bg-rose-500 text-white' : 'bg-sky-600 text-white'}`}>
//                     {multiSelectMode ? "✖ Exit Multi-Select" : "⚙ Option Multiple Select"}
//                 </button>
//                 {multiSelectMode && (
//                     <div className="flex items-center gap-4 bg-slate-50 px-4 py-1.5 rounded-full border border-slate-200">
//                     <label className="flex items-center gap-2 cursor-pointer">
//                         <input type="radio" name="filterMode" checked={filterType === 'store'} onChange={() => { setFilterType('store'); setSelectedIds([]); }} />
//                         <span className={`text-[11px] font-black uppercase ${filterType === 'store' ? 'text-sky-600' : 'text-slate-400'}`}>To Store</span>
//                     </label>
//                     <label className="flex items-center gap-2 cursor-pointer">
//                         <input type="radio" name="filterMode" checked={filterType === 'customer'} onChange={() => { setFilterType('customer'); setSelectedIds([]); }} />
//                         <span className={`text-[11px] font-black uppercase ${filterType === 'customer' ? 'text-rose-600' : 'text-slate-400'}`}>To Customer</span>
//                     </label>
//                     </div>
//                 )}
//             </div>
//           </div>
//           {msg && <div className={`text-xs font-bold ${msg.type === 'error' ? 'text-red-500' : 'text-green-600'}`}>{msg.text}</div>}
//         </div>

//         {/* ⭐ NEW: Action Filter Buttons (Dispatchables / Receivables) */}
//         <div className="flex justify-between items-center">
//             <div className="flex gap-2">
//                 <button 
//                   onClick={() => setActionFilter('all')} 
//                   className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wide transition-all ${actionFilter === 'all' ? 'bg-slate-800 text-white shadow-lg scale-105' : 'bg-white text-slate-400 border border-slate-200 hover:bg-slate-50'}`}
//                 >
//                   All Items
//                 </button>
//                 <button 
//                   onClick={() => setActionFilter('dispatchable')} 
//                   className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wide transition-all ${actionFilter === 'dispatchable' ? 'bg-indigo-600 text-white shadow-lg scale-105' : 'bg-white text-slate-400 border border-slate-200 hover:bg-indigo-50 hover:text-indigo-600'}`}
//                 >
//                   📤 Dispatchables
//                 </button>
//                 <button 
//                   onClick={() => setActionFilter('receivable')} 
//                   className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wide transition-all ${actionFilter === 'receivable' ? 'bg-emerald-600 text-white shadow-lg scale-105' : 'bg-white text-slate-400 border border-slate-200 hover:bg-emerald-50 hover:text-emerald-600'}`}
//                 >
//                   📥 Receivables
//                 </button>
//             </div>

           
//         </div>
//       </div>

//       {/* ⭐ 2. Bulk Action Bar (Context Aware) */}
//       {multiSelectMode && selectedIds.length > 0 && (
//         <div className="bg-slate-900 p-2 rounded-xl flex items-center justify-between shadow-2xl sticky top-2 z-10 border border-slate-700">
//           <span className="text-sky-400 text-[10px] font-black px-3 uppercase tracking-widest">{selectedIds.length} Selection Active</span>
//           <div className="flex gap-2">
//             {statuses.map(st => {
//               // Standard Permissions
//               if (user?.type === "Store") {
//                 const storeAllowed = ["to_warehouse", "rec_store_wh", "store_to_customer"];
//                 if (!storeAllowed.includes(st.key)) return null;
//               } else if (user?.type === "Warehouse") {
//                 const whAllowed = ["to_production", "dispatch"];
//                 if (!whAllowed.includes(st.key)) return null;
//               }

//               if (filterType === 'customer' && (st.key === "rec_store_wh" || st.key === "store_to_customer")) return null;
              
//               // ⭐ Filter Bulk Buttons based on Active Tab (Dispatch vs Receive)
//               if (actionFilter === 'dispatchable') {
//                   const dispatchKeys = ['to_warehouse', 'store_to_customer', 'dispatch'];
//                   if (!dispatchKeys.includes(st.key)) return null;
//               }
//               if (actionFilter === 'receivable') {
//                   const receiveKeys = ['rec_store_wh', 'to_production'];
//                   if (!receiveKeys.includes(st.key)) return null;
//               }

//               let bulkLabel = st.label;
//               if (st.key === "dispatch") bulkLabel = filterType === 'store' ? "Disp Store" : "Disp Cust";
//               return (
//                 <button key={st.key} onClick={() => handleBulkAction(st.key)} className={`${st.color} text-white text-[9px] font-black px-4 py-1.5 rounded-lg hover:scale-105 transition-all`}>
//                   BULK {bulkLabel}
//                 </button>
//               );
//             })}
//           </div>
//         </div>
//       )}

//       {/* 3. Table Section */}
//       <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
//         <div className="overflow-x-auto">
//           <table className="w-full text-left whitespace-nowrap">
//             <thead className="bg-slate-50 border-b border-slate-100">
//               <tr className="text-[10px] uppercase text-slate-400 font-black">
//                 {multiSelectMode && <th className="p-4 w-10 text-center">Select</th>}
//                 <th className="p-4">Tracking</th>
//                 <th className="p-4">Article</th>
//                 <th className="p-4">Return To</th>
//                 <th className="p-4">Status & Remarks</th>
//                 <th className="p-4 text-center">Actions / View</th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-slate-50">
//               {currentItems.map((it) => (
//                 <tr key={it.id} className={`hover:bg-sky-50/30 transition-colors ${selectedIds.includes(it.id) ? 'bg-sky-50/60' : ''}`}>
//                   {multiSelectMode && (
//                     <td className="p-4 text-center">
//                       <input type="checkbox" checked={selectedIds.includes(it.id)} onChange={() => toggleSelect(it.id)} className="w-4 h-4 rounded text-sky-600 cursor-pointer" />
//                     </td>
//                   )}
//                   <td className="p-4 font-black text-sky-900 text-xs">{it.trackingId}</td>
//                   <td className="p-4 font-bold text-slate-700 text-[11px]">{it.articleNo} ({it.size})</td>
//                   <td className="p-4">
//                     <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${it.returnto === 'To Store' ? 'text-indigo-600 bg-indigo-50' : 'text-rose-600 bg-rose-50'}`}>{it.returnto}</span>
//                   </td>
//                   <td className="p-4">
//                     <div className="flex flex-col">
//                         <span className="font-black text-[9px] text-slate-500 uppercase">{it.status}</span>
//                         {it.remarksWH && <span className="text-[9px] font-bold text-sky-600 italic">R: {it.remarksWH}</span>}
//                     </div>
//                   </td>
//                   <td className="p-4 text-center">
//                     <div className="flex justify-center items-center gap-1">
//                       {statuses.map((st) => {
//                         const state = getButtonStatus(it, st.key);
//                         if (state.hidden) return null;
                        
//                         // ⭐ If in Dispatchable/Receivable mode, HIDE non-clickable buttons
//                         if (actionFilter !== 'all') {
//                              if (state.disabled || state.isDone) return null;
//                         }

//                         let btnLbl = st.label;
//                         if (st.key === "dispatch") btnLbl = it.returnto === "To Store" ? "Disp Store" : "Disp Cust";
                        
//                         return (
//                           <button 
//                             key={st.key} 
//                             onClick={() => handleSingleAction(it.id, st.key)} 
//                             disabled={state.disabled || loadingId === it.id} 
//                             title={state.title}
//                             className={`px-2 py-1 rounded text-[9px] font-bold text-white transition-all ${state.disabled ? state.className : `${st.color} ${state.className}`}`}
//                           >
//                             {btnLbl}
//                           </button>
//                         );
//                       })}
//                       <button onClick={() => { setActiveRemarksId(activeRemarksId === it.id ? null : it.id); setTempRemarks({...tempRemarks, [it.id]: it.remarksWH || ""}); }} className={`p-1.5 rounded-full ${activeRemarksId === it.id ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-sky-200'}`}>💬</button>
//                       <button onClick={() => setViewingItem(it)} className="p-1.5 bg-slate-100 text-slate-600 rounded-full hover:bg-sky-100 shadow-sm">👁️</button>
//                     </div>
//                     {activeRemarksId === it.id && (
//                         <div className="mt-2 flex gap-1 animate-slideInRight">
//                             <input type="text" className="border border-sky-300 rounded px-2 py-1 text-[10px] w-full focus:ring-1 focus:ring-sky-500 outline-none" value={tempRemarks[it.id] || ""} onChange={(e) => setTempRemarks({...tempRemarks, [it.id]: e.target.value})} onKeyDown={(e) => e.key === 'Enter' && handleSaveRemarks(it.id)} />
//                             <button onClick={() => handleSaveRemarks(it.id)} className="bg-green-600 text-white px-2 py-1 rounded text-[9px] font-bold">SAVE</button>
//                         </div>
//                     )}
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       </div>

//       {/* ⭐ START: VIEW DETAILS MODAL ⭐ */}
//       {viewingItem && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
//           <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-slate-200">
            
//             {/* Modal Header */}
//             <div className="bg-slate-900 p-6 flex justify-between items-center sticky top-0 z-10 shadow-lg">
//               <div>
//                 <h3 className="text-3xl font-black text-white tracking-tight">{viewingItem.trackingId}</h3>
//                 <span className="text-sky-400 text-xs font-bold uppercase tracking-widest bg-sky-900/50 px-2 py-1 rounded">
//                   Status: {viewingItem.status}
//                 </span>
//               </div>
//               <button 
//                 onClick={() => setViewingItem(null)} 
//                 className="bg-white/10 hover:bg-rose-500 text-white w-10 h-10 rounded-full flex items-center justify-center transition-all text-xl font-bold"
//               >
//                 ✕
//               </button>
//             </div>

//             {/* Modal Body */}
//             <div className="p-8 space-y-8">
              
//               {/* Row 1: Primary Info */}
//               <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
//                 <h4 className="text-xs font-black text-sky-600 uppercase mb-4 border-b border-slate-200 pb-2">Product & Invoice</h4>
//                 <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
//                   <DetailBox label="Invoice No" value={viewingItem.invoiceNo} />
//                   <DetailBox label="Article" value={viewingItem.articleNo} />
//                   <DetailBox label="Size" value={viewingItem.size} />
//                   <DetailBox label="Color" value={viewingItem.color} />
//                   <DetailBox label="Category" value={viewingItem.category ? viewingItem.category.name : "N/A"} />
//                 </div>
//               </div>

//               {/* Row 2: Customer Info */}
//               <div>
//                 <h4 className="text-xs font-black text-slate-400 uppercase mb-4 border-b border-slate-100 pb-2">Customer Details</h4>
//                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//                   <DetailBox label="Customer Name" value={viewingItem.customerName} />
//                   <DetailBox label="Mobile" value={viewingItem.customerMobile} />
//                   <DetailBox label="Address" value={viewingItem.billingAddress} />
//                 </div>
//               </div>

//               {/* Row 3: Dates & Type */}
//               <div className="grid grid-cols-2 md:grid-cols-4 gap-6 bg-sky-50/50 p-5 rounded-2xl border border-sky-100">
//                 <DetailBox label="Service Type" value={viewingItem.type} />
//                 <DetailBox label="Receiving Date" value={viewingItem.receivingDate} />
//                 <DetailBox label="Est. Completion" value={viewingItem.estimatedCompletionDate} />
//                 <DetailBox label="Claim Amount" value={`PKR ${viewingItem.claimAmount}`} />
//               </div>

//               {/* Row 4: Problem Description */}
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
//                 <div>
//                    <h4 className="text-xs font-black text-slate-400 uppercase mb-2">Problem Description</h4>
//                    <p className="p-4 bg-slate-50 border-l-4 border-rose-400 text-sm font-medium text-slate-700 italic rounded-r-lg">
//                      "{viewingItem.problemDescription}"
//                    </p>
//                 </div>
//                 <div>
//                    <h4 className="text-xs font-black text-slate-400 uppercase mb-2">Identify Flags</h4>
//                    <div className="flex flex-wrap gap-2">
//                       {['upper', 'buckle', 'sole', 'inSocks', 'color', 'refinishing'].map(k => (
//                         viewingItem[k + 'Problem'] === 'Y' && (
//                           <span key={k} className="bg-slate-800 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wide">
//                             {k}
//                           </span>
//                         )
//                       ))}
//                       {!['upper', 'buckle', 'sole', 'inSocks', 'color', 'refinishing'].some(k => viewingItem[k + 'Problem'] === 'Y') && 
//                         <span className="text-xs text-slate-400">No specific flags marked.</span>
//                       }
//                    </div>
//                 </div>
//               </div>

//               {/* Row 5: Logistics / Warehouse Info */}
//               <div className="border-t-2 border-slate-100 pt-6">
//                 <h4 className="text-xs font-black text-slate-400 uppercase mb-4">Logistics & Tracking</h4>
//                 <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
//                   <DetailBox label="Store" value={viewingItem.store ? viewingItem.store.name : "Unknown"} />
//                   <DetailBox label="Warehouse" value={viewingItem.warehouse} />
//                   <DetailBox label="Return Route" value={viewingItem.returnto} />
//                   <DetailBox label="Current Remarks" value={viewingItem.remarksWH} />
//                 </div>
//                 <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-4">
//                   <DetailBox label="To WH Date" value={viewingItem.dispatchToWarehouseDate ? new Date(viewingItem.dispatchToWarehouseDate).toLocaleDateString() : '-'} />
//                   <DetailBox label="Rec @ WH Date" value={viewingItem.dispatchToProductionDate ? new Date(viewingItem.dispatchToProductionDate).toLocaleDateString() : '-'} />
//                   <DetailBox label="WH Slip" value={viewingItem.courierSlip} />
//                   <DetailBox label="Dispatch Slip" value={viewingItem.dispatchCourierSlip} />
//                 </div>
//               </div>

//             </div>
//           </div>
//         </div>
//       )}
//       {/* ⭐ END: VIEW DETAILS MODAL ⭐ */}
//     </div>
//   );
// }

// function DetailBox({ label, value }) {
//   return (
//     <div className="flex flex-col gap-0.5">
//       <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter block">{label}</span>
//       <span className="text-sm font-bold text-slate-800 break-words">{value || "---"}</span>
//     </div>
//   );
// }





























// import React, { useState, useEffect, useMemo } from "react";
// import axios from "axios";

// export default function ItemList({ refresh, socket, user: propUser }) {
//   const [items, setItems] = useState([]);
//   const [allUsers, setAllUsers] = useState([]);
//   const [msg, setMsg] = useState(null);
//   const [loadingId, setLoadingId] = useState(null);
//   const [currentPage, setCurrentPage] = useState(1);
//   const itemsPerPage = 20;

//   const [multiSelectMode, setMultiSelectMode] = useState(false);
//   const [selectedIds, setSelectedIds] = useState([]);
//   const [filterType, setFilterType] = useState('store'); 
//   const [viewingItem, setViewingItem] = useState(null);
  
//   const user = useMemo(() => {
//     if (propUser && propUser.id) return propUser;
//     const saved = localStorage.getItem("user");
//     return saved ? JSON.parse(saved) : null;
//   }, [propUser]);

//   const [selectedStore, setSelectedStore] = useState('all');
//   const today = new Date().toISOString().split('T')[0];
//   const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
//   const [startDate, setStartDate] = useState(firstDay); 
//   const [endDate, setEndDate] = useState(today);

//   const [activeRemarksId, setActiveRemarksId] = useState(null);
//   const [tempRemarks, setTempRemarks] = useState({});

//   useEffect(() => {
//     if (msg) {
//       const timer = setTimeout(() => setMsg(null), 5000);
//       return () => clearTimeout(timer);
//     }
//   }, [msg]);

//   const fetchItems = async () => {
//     if (!user || !user.id) return; 
//     try {
//       const res = await axios.get('http://localhost:8080/api/items', {
//         params: { userId: user.id, type: user.type, storeId: selectedStore, startDate: startDate, endDate: endDate }
//       });
//       if (res.data.success) setItems(res.data.data || []);
//       const userRes = await axios.get("http://localhost:8080/api/users");
//       setAllUsers(userRes.data || []);
//     } catch (err) { console.error("Fetch Error:", err); }
//   };

//   useEffect(() => { fetchItems(); }, [refresh, user, selectedStore, startDate, endDate]);

//   const accessibleStores = useMemo(() => {
//     if (user?.type === 'Admin') return allUsers;
//     const assignedIds = user?.assignedUsers ? user.assignedUsers.split(',').filter(id => id).map(id => parseInt(id)) : [];
//     const myIds = [user?.id, ...assignedIds];
//     return allUsers.filter(u => myIds.includes(u.id));
//   }, [allUsers, user]);

//   const filteredItems = useMemo(() => {
//     if (!multiSelectMode) return items;
//     const target = filterType === 'store' ? "To Store" : "To Customer";
//     return items.filter(it => it.returnto === target);
//   }, [items, multiSelectMode, filterType]);

//   const currentItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

//   // ⭐ Logic with User Permissions & Local Repair Check
//   const getButtonStatus = (item, btnKey) => {
//     const status = item.status;
//     const returnto = item.returnto;
//     const type = item.type; 
//     const userType = user?.type;

//     const S1 = "Received at Store";
//     const S2 = "Dispatched to Warehouse";
//     const S3 = "Received at Warehouse";
//     const S4 = "Dispatch";
//     const S5 = "Received at Store From WH";
//     const S6 = "Store To Customer"; 

//     // 1. Permission Logic for Single Buttons
//     if (userType === "Store") {
//       const storeAllowed = ["to_warehouse", "rec_store_wh", "store_to_customer"];
//       if (!storeAllowed.includes(btnKey)) return { hidden: true };
//     } else if (userType === "Warehouse") {
//       const whAllowed = ["to_production", "dispatch"];
//       if (!whAllowed.includes(btnKey)) return { hidden: true };
//     }

//     // 2. Flow Selection (Local Repair vs Standard)
//     let currentSeq = [];
//     let btnMap = {};
//     const isLocalRepair = type && type.toLowerCase().trim() === 'local repair';

//     if (isLocalRepair) {
//       currentSeq = [S1, S2, S5, S6]; 
//       btnMap = {
//         to_warehouse: S2,
//         to_production: null, 
//         dispatch: null,      
//         rec_store_wh: S5,
//         store_to_customer: S6
//       };
//     } else {
//       const seqStore = [S1, S2, S3, S4, S5, S6];
//       const seqCust = [S1, S2, S3, S4];
//       currentSeq = returnto === "To Store" ? seqStore : seqCust;
//       btnMap = {
//         to_warehouse: S2,
//         to_production: S3,
//         dispatch: S4,
//         rec_store_wh: returnto === "To Store" ? S5 : null,
//         store_to_customer: returnto === "To Store" ? S6 : null
//       };
//     }

//     const targetStatus = btnMap[btnKey];
//     if (!targetStatus) return { hidden: true };

//     const currentIndex = currentSeq.indexOf(status);
//     const targetIndex = currentSeq.indexOf(targetStatus);

//     if (currentIndex >= targetIndex) return { isDone: true, disabled: true, title: "Already Processed", className: "bg-gray-400 opacity-50 cursor-not-allowed" };
//     if (currentIndex === targetIndex - 1) return { isDone: false, disabled: false, title: "", className: "hover:brightness-110 shadow-sm" };
    
//     return { isDone: false, disabled: true, title: "Locked", className: "bg-slate-100 text-slate-300 cursor-not-allowed border border-slate-200" };
//   };

//   const dispatchAction = async (id, action, courierSlipInput = null) => {
//     let courierSlip = courierSlipInput;
//     if (!courierSlip && (action === "to_warehouse" || action === "dispatch")) {
//       const label = action === "to_warehouse" ? "Warehouse Courier Slip" : "Final Dispatch Slip";
//       courierSlip = prompt(`Enter ${label} number:`);
//       if (!courierSlip) return null;
//     }
//     return await axios.post(`http://localhost:8080/api/items/${id}/dispatch`, { action, courierSlip });
//   };

//   const handleSingleAction = async (id, action) => {
//     setLoadingId(id);
//     try {
//       const res = await dispatchAction(id, action);
//       if (res && res.data.success) {
//         setMsg({ type: "success", text: "Updated successfully!" });
//         if (socket) socket.emit("itemUpdated", res.data.data);
//         fetchItems();
//       }
//     } catch (err) { setMsg({ type: "error", text: "Update failed" }); }
//     finally { setLoadingId(null); }
//   };

//   const handleBulkAction = async (action) => {
//     if (selectedIds.length === 0) return alert("Please select items first!");
//     const selectedItemsData = items.filter(it => selectedIds.includes(it.id));
//     const cannotProcessIds = [];
//     const toProcessIds = [];
//     selectedItemsData.forEach(item => {
//         const state = getButtonStatus(item, action);
//         if (state.isDone || state.disabled || state.hidden) { 
//             cannotProcessIds.push(item.trackingId);
//         } else {
//             toProcessIds.push(item.id);
//         }
//     });
//     if (cannotProcessIds.length > 0) alert(`Check items again (Processed, Hidden or out of sequence)`);
//     if (toProcessIds.length === 0) return;
//     let courierSlip = null;
//     if (action === "to_warehouse" || action === "dispatch") {
//       courierSlip = prompt(`Enter common Slip number:`);
//       if (!courierSlip) return;
//     }
//     setLoadingId("bulk");
//     try {
//       await Promise.all(toProcessIds.map(id => dispatchAction(id, action, courierSlip)));
//       setMsg({ type: "success", text: `Bulk updated ${toProcessIds.length} items!` });
//       setSelectedIds([]);
//       fetchItems();
//     } catch (err) { setMsg({ type: "error", text: "Bulk failed" }); }
//     finally { setLoadingId(null); }
//   };

//   const handleSaveRemarks = async (id) => {
//     try {
//       setLoadingId(id);
//       const res = await axios.put(`http://localhost:8080/api/items/${id}`, { remarksWH: tempRemarks[id] });
//       if (res.data.success) {
//         setMsg({ type: "success", text: "Remarks saved!" });
//         setActiveRemarksId(null);
//         fetchItems();
//       }
//     } catch (err) { setMsg({ type: "error", text: "Failed to save remarks" }); }
//     finally { setLoadingId(null); }
//   };

//   const toggleSelect = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

//   const statuses = [
//     { key: "to_warehouse", label: "To WH", color: "bg-amber-500" },
//     { key: "to_production", label: "Recvd WH", color: "bg-blue-600" },
//     { key: "dispatch", label: "Dispatch", color: "bg-green-600" },
//     { key: "rec_store_wh", label: "Rec Store From W.H", color: "bg-purple-600" },
//     { key: "store_to_customer", label: "Store To Cust", color: "bg-rose-600" },
//   ];

//   return (
//     <div className="space-y-4 animate-fadeIn relative">
//       <div className="flex flex-wrap justify-between items-center bg-white p-3 rounded-xl shadow-sm border border-gray-100 gap-3">
//         <div className="flex items-center gap-4">
//           <h2 className="text-xl font-bold text-slate-800 tracking-tight">Inventory Matrix</h2>
//           <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
//              <select value={selectedStore} onChange={(e) => setSelectedStore(e.target.value)} className="bg-white px-2 py-1 rounded text-[10px] font-bold border border-slate-200 outline-none">
//                <option value="all">All Stores</option>
//                {accessibleStores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
//              </select>
//              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-white px-1 py-1 rounded text-[10px] font-bold border border-slate-200 outline-none" />
//              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-white px-1 py-1 rounded text-[10px] font-bold border border-slate-200 outline-none" />
//           </div>
//           <button onClick={() => { setMultiSelectMode(!multiSelectMode); setSelectedIds([]); }} className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase transition-all shadow-sm ${multiSelectMode ? 'bg-rose-500 text-white' : 'bg-sky-600 text-white'}`}>
//             {multiSelectMode ? "✖ Exit Multi-Select" : "⚙ Option Multiple Select"}
//           </button>
//           {multiSelectMode && (
//             <div className="flex items-center gap-4 bg-slate-50 px-4 py-1.5 rounded-full border border-slate-200">
//               <label className="flex items-center gap-2 cursor-pointer">
//                 <input type="radio" name="filterMode" checked={filterType === 'store'} onChange={() => { setFilterType('store'); setSelectedIds([]); }} />
//                 <span className={`text-[11px] font-black uppercase ${filterType === 'store' ? 'text-sky-600' : 'text-slate-400'}`}>To Store</span>
//               </label>
//               <label className="flex items-center gap-2 cursor-pointer">
//                 <input type="radio" name="filterMode" checked={filterType === 'customer'} onChange={() => { setFilterType('customer'); setSelectedIds([]); }} />
//                 <span className={`text-[11px] font-black uppercase ${filterType === 'customer' ? 'text-rose-600' : 'text-slate-400'}`}>To Customer</span>
//               </label>
//             </div>
//           )}
//         </div>
//         {msg && <div className={`text-xs font-bold ${msg.type === 'error' ? 'text-red-500' : 'text-green-600'}`}>{msg.text}</div>}
//       </div>

//       {/* ⭐ 2. Bulk Action Bar (Filtered by Permissions) */}
//       {multiSelectMode && selectedIds.length > 0 && (
//         <div className="bg-slate-900 p-2 rounded-xl flex items-center justify-between shadow-2xl sticky top-2 z-10 border border-slate-700">
//           <span className="text-sky-400 text-[10px] font-black px-3 uppercase tracking-widest">{selectedIds.length} Selection Active</span>
//           <div className="flex gap-2">
//             {statuses.map(st => {
//               // Same Permission Filter for Bulk
//               if (user?.type === "Store") {
//                 const storeAllowed = ["to_warehouse", "rec_store_wh", "store_to_customer"];
//                 if (!storeAllowed.includes(st.key)) return null;
//               } else if (user?.type === "Warehouse") {
//                 const whAllowed = ["to_production", "dispatch"];
//                 if (!whAllowed.includes(st.key)) return null;
//               }

//               if (filterType === 'customer' && (st.key === "rec_store_wh" || st.key === "store_to_customer")) return null;
              
//               let bulkLabel = st.label;
//               if (st.key === "dispatch") bulkLabel = filterType === 'store' ? "Disp Store" : "Disp Cust";
//               return (
//                 <button key={st.key} onClick={() => handleBulkAction(st.key)} className={`${st.color} text-white text-[9px] font-black px-4 py-1.5 rounded-lg hover:scale-105 transition-all`}>
//                   BULK {bulkLabel}
//                 </button>
//               );
//             })}
//           </div>
//         </div>
//       )}

//       {/* 3. Table Section */}
//       <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
//         <div className="overflow-x-auto">
//           <table className="w-full text-left whitespace-nowrap">
//             <thead className="bg-slate-50 border-b border-slate-100">
//               <tr className="text-[10px] uppercase text-slate-400 font-black">
//                 {multiSelectMode && <th className="p-4 w-10 text-center">Select</th>}
//                 <th className="p-4">Tracking</th>
//                 <th className="p-4">Article</th>
//                 <th className="p-4">Return To</th>
//                 <th className="p-4">Status & Remarks</th>
//                 <th className="p-4 text-center">Actions / View</th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-slate-50">
//               {currentItems.map((it) => (
//                 <tr key={it.id} className={`hover:bg-sky-50/30 transition-colors ${selectedIds.includes(it.id) ? 'bg-sky-50/60' : ''}`}>
//                   {multiSelectMode && (
//                     <td className="p-4 text-center">
//                       <input type="checkbox" checked={selectedIds.includes(it.id)} onChange={() => toggleSelect(it.id)} className="w-4 h-4 rounded text-sky-600 cursor-pointer" />
//                     </td>
//                   )}
//                   <td className="p-4 font-black text-sky-900 text-xs">{it.trackingId}</td>
//                   <td className="p-4 font-bold text-slate-700 text-[11px]">{it.articleNo} ({it.size})</td>
//                   <td className="p-4">
//                     <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${it.returnto === 'To Store' ? 'text-indigo-600 bg-indigo-50' : 'text-rose-600 bg-rose-50'}`}>{it.returnto}</span>
//                   </td>
//                   <td className="p-4">
//                     <div className="flex flex-col">
//                         <span className="font-black text-[9px] text-slate-500 uppercase">{it.status}</span>
//                         {it.remarksWH && <span className="text-[9px] font-bold text-sky-600 italic">R: {it.remarksWH}</span>}
//                     </div>
//                   </td>
//                   <td className="p-4 text-center">
//                     <div className="flex justify-center items-center gap-1">
//                       {statuses.map((st) => {
//                         const state = getButtonStatus(it, st.key);
//                         if (state.hidden) return null;
                        
//                         let btnLbl = st.label;
//                         if (st.key === "dispatch") btnLbl = it.returnto === "To Store" ? "Disp Store" : "Disp Cust";
                        
//                         return (
//                           <button 
//                             key={st.key} 
//                             onClick={() => handleSingleAction(it.id, st.key)} 
//                             disabled={state.disabled || loadingId === it.id} 
//                             title={state.title}
//                             className={`px-2 py-1 rounded text-[9px] font-bold text-white transition-all ${state.disabled ? state.className : `${st.color} ${state.className}`}`}
//                           >
//                             {btnLbl}
//                           </button>
//                         );
//                       })}
//                       <button onClick={() => { setActiveRemarksId(activeRemarksId === it.id ? null : it.id); setTempRemarks({...tempRemarks, [it.id]: it.remarksWH || ""}); }} className={`p-1.5 rounded-full ${activeRemarksId === it.id ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-sky-200'}`}>💬</button>
//                       <button onClick={() => setViewingItem(it)} className="p-1.5 bg-slate-100 text-slate-600 rounded-full hover:bg-sky-100 shadow-sm">👁️</button>
//                     </div>
//                     {activeRemarksId === it.id && (
//                         <div className="mt-2 flex gap-1 animate-slideInRight">
//                             <input type="text" className="border border-sky-300 rounded px-2 py-1 text-[10px] w-full focus:ring-1 focus:ring-sky-500 outline-none" value={tempRemarks[it.id] || ""} onChange={(e) => setTempRemarks({...tempRemarks, [it.id]: e.target.value})} onKeyDown={(e) => e.key === 'Enter' && handleSaveRemarks(it.id)} />
//                             <button onClick={() => handleSaveRemarks(it.id)} className="bg-green-600 text-white px-2 py-1 rounded text-[9px] font-bold">SAVE</button>
//                         </div>
//                     )}
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       </div>
//       {/* ... (Modal logic same as before) */}
//       {/* ⭐ START: VIEW DETAILS MODAL ⭐ */}
//       {viewingItem && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
//           <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-slate-200">
            
//             {/* Modal Header */}
//             <div className="bg-slate-900 p-6 flex justify-between items-center sticky top-0 z-10 shadow-lg">
//               <div>
//                 <h3 className="text-3xl font-black text-white tracking-tight">{viewingItem.trackingId}</h3>
//                 <span className="text-sky-400 text-xs font-bold uppercase tracking-widest bg-sky-900/50 px-2 py-1 rounded">
//                   Status: {viewingItem.status}
//                 </span>
//               </div>
//               <button 
//                 onClick={() => setViewingItem(null)} 
//                 className="bg-white/10 hover:bg-rose-500 text-white w-10 h-10 rounded-full flex items-center justify-center transition-all text-xl font-bold"
//               >
//                 ✕
//               </button>
//             </div>

//             {/* Modal Body */}
//             <div className="p-8 space-y-8">
              
//               {/* Row 1: Primary Info */}
//               <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
//                 <h4 className="text-xs font-black text-sky-600 uppercase mb-4 border-b border-slate-200 pb-2">Product & Invoice</h4>
//                 <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
//                   <DetailBox label="Invoice No" value={viewingItem.invoiceNo} />
//                   <DetailBox label="Article" value={viewingItem.articleNo} />
//                   <DetailBox label="Size" value={viewingItem.size} />
//                   <DetailBox label="Color" value={viewingItem.color} />
//                   {/* Category Show Karwa Raha Hoon */}
//                   <DetailBox label="Category" value={viewingItem.category ? viewingItem.category.name : "N/A"} />
//                 </div>
//               </div>

//               {/* Row 2: Customer Info */}
//               <div>
//                 <h4 className="text-xs font-black text-slate-400 uppercase mb-4 border-b border-slate-100 pb-2">Customer Details</h4>
//                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//                   <DetailBox label="Customer Name" value={viewingItem.customerName} />
//                   <DetailBox label="Mobile" value={viewingItem.customerMobile} />
//                   <DetailBox label="Address" value={viewingItem.billingAddress} />
//                 </div>
//               </div>

//               {/* Row 3: Dates & Type */}
//               <div className="grid grid-cols-2 md:grid-cols-4 gap-6 bg-sky-50/50 p-5 rounded-2xl border border-sky-100">
//                 <DetailBox label="Service Type" value={viewingItem.type} />
//                 <DetailBox label="Receiving Date" value={viewingItem.receivingDate} />
//                 <DetailBox label="Est. Completion" value={viewingItem.estimatedCompletionDate} />
//                 <DetailBox label="Claim Amount" value={`PKR ${viewingItem.claimAmount}`} />
//               </div>

//               {/* Row 4: Problem Description */}
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
//                 <div>
//                    <h4 className="text-xs font-black text-slate-400 uppercase mb-2">Problem Description</h4>
//                    <p className="p-4 bg-slate-50 border-l-4 border-rose-400 text-sm font-medium text-slate-700 italic rounded-r-lg">
//                      "{viewingItem.problemDescription}"
//                    </p>
//                 </div>
//                 <div>
//                    <h4 className="text-xs font-black text-slate-400 uppercase mb-2">Identify Flags</h4>
//                    <div className="flex flex-wrap gap-2">
//                       {['upper', 'buckle', 'sole', 'inSocks', 'color', 'refinishing'].map(k => (
//                         viewingItem[k + 'Problem'] === 'Y' && (
//                           <span key={k} className="bg-slate-800 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wide">
//                             {k}
//                           </span>
//                         )
//                       ))}
//                       {/* Agar koi flag na ho */}
//                       {!['upper', 'buckle', 'sole', 'inSocks', 'color', 'refinishing'].some(k => viewingItem[k + 'Problem'] === 'Y') && 
//                         <span className="text-xs text-slate-400">No specific flags marked.</span>
//                       }
//                    </div>
//                 </div>
//               </div>

//               {/* Row 5: Logistics / Warehouse Info */}
//               <div className="border-t-2 border-slate-100 pt-6">
//                 <h4 className="text-xs font-black text-slate-400 uppercase mb-4">Logistics & Tracking</h4>
//                 <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
//                   <DetailBox label="Store" value={viewingItem.store ? viewingItem.store.name : "Unknown"} />
//                   <DetailBox label="Warehouse" value={viewingItem.warehouse} />
//                   <DetailBox label="Return Route" value={viewingItem.returnto} />
//                   <DetailBox label="Current Remarks" value={viewingItem.remarksWH} />
//                 </div>
//                 <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-4">
//                   <DetailBox label="To WH Date" value={viewingItem.dispatchToWarehouseDate ? new Date(viewingItem.dispatchToWarehouseDate).toLocaleDateString() : '-'} />
//                   <DetailBox label="Rec @ WH Date" value={viewingItem.dispatchToProductionDate ? new Date(viewingItem.dispatchToProductionDate).toLocaleDateString() : '-'} />
//                   <DetailBox label="WH Slip" value={viewingItem.courierSlip} />
//                   <DetailBox label="Dispatch Slip" value={viewingItem.dispatchCourierSlip} />
//                 </div>
//               </div>

//             </div>
//           </div>
//         </div>
//       )}
//       {/* ⭐ END: VIEW DETAILS MODAL ⭐ */}
//     </div>
//   );
// }

// function DetailBox({ label, value }) {
//   return (
//     <div className="flex flex-col gap-0.5">
//       <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter block">{label}</span>
//       <span className="text-sm font-bold text-slate-800 break-words">{value || "---"}</span>
//     </div>
//   );
// }









// import React, { useState, useEffect, useMemo } from "react";
// import axios from "axios";

// export default function ItemList({ refresh, socket, user: propUser }) {
//   const [items, setItems] = useState([]);
//   const [allUsers, setAllUsers] = useState([]);
//   const [msg, setMsg] = useState(null);
//   const [loadingId, setLoadingId] = useState(null);
//   const [currentPage, setCurrentPage] = useState(1);
//   const itemsPerPage = 20;

//   const [multiSelectMode, setMultiSelectMode] = useState(false);
//   const [selectedIds, setSelectedIds] = useState([]);
//   const [filterType, setFilterType] = useState('store'); 
//   const [viewingItem, setViewingItem] = useState(null);
  
//   const user = useMemo(() => {
//     if (propUser && propUser.id) return propUser;
//     const saved = localStorage.getItem("user");
//     return saved ? JSON.parse(saved) : null;
//   }, [propUser]);

//   const [selectedStore, setSelectedStore] = useState('all');
//   const today = new Date().toISOString().split('T')[0];
//   const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
//   const [startDate, setStartDate] = useState(firstDay); 
//   const [endDate, setEndDate] = useState(today);

//   const [activeRemarksId, setActiveRemarksId] = useState(null);
//   const [tempRemarks, setTempRemarks] = useState({});

//   useEffect(() => {
//     if (msg) {
//       const timer = setTimeout(() => setMsg(null), 5000);
//       return () => clearTimeout(timer);
//     }
//   }, [msg]);

//   const fetchItems = async () => {
//     if (!user || !user.id) return; 
//     try {
//       const res = await axios.get('http://localhost:8080/api/items', {
//         params: { userId: user.id, type: user.type, storeId: selectedStore, startDate: startDate, endDate: endDate }
//       });
//       if (res.data.success) setItems(res.data.data || []);
//       const userRes = await axios.get("http://localhost:8080/api/users");
//       setAllUsers(userRes.data || []);
//     } catch (err) { console.error("Fetch Error:", err); }
//   };

//   useEffect(() => { fetchItems(); }, [refresh, user, selectedStore, startDate, endDate]);

//   const accessibleStores = useMemo(() => {
//     if (user?.type === 'Admin') return allUsers;
//     const assignedIds = user?.assignedUsers ? user.assignedUsers.split(',').filter(id => id).map(id => parseInt(id)) : [];
//     const myIds = [user?.id, ...assignedIds];
//     return allUsers.filter(u => myIds.includes(u.id));
//   }, [allUsers, user]);

//   const filteredItems = useMemo(() => {
//     if (!multiSelectMode) return items;
//     const target = filterType === 'store' ? "To Store" : "To Customer";
//     return items.filter(it => it.returnto === target);
//   }, [items, multiSelectMode, filterType]);

//   const currentItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

//   // ⭐ MODIFIED LOGIC HERE: Added Logic for 'local repair'
//   // const getButtonStatus = (item, btnKey) => {
//   //   const status = item.status;
//   //   const returnto = item.returnto;
//   //   const type = item.type; // Check item type

//   //   const S1 = "Received at Store";
//   //   const S2 = "Dispatched to Warehouse";
//   //   const S3 = "Received at Warehouse";
//   //   const S4 = "Dispatch";
//   //   const S5 = "Received at Store From WH";
//   //   const S6 = "Store To Customer"; 

//   //   let currentSeq = [];
//   //   let btnMap = {};

//   //   // ⭐ Logic for Local Repair (Skip Production & Dispatch)
//   //   if (type === 'Local Repair') {
//   //     currentSeq = [S1, S2, S5, S6]; // Custom Sequence
//   //     btnMap = {
//   //       to_warehouse: S2,
//   //       to_production: null, // HIDDEN
//   //       dispatch: null,      // HIDDEN
//   //       rec_store_wh: S5,
//   //       store_to_customer: S6
//   //     };
//   //   } else {
//   //     // ⭐ Existing Logic for others
//   //     const seqStore = [S1, S2, S3, S4, S5, S6];
//   //     const seqCust = [S1, S2, S3, S4];
//   //     currentSeq = returnto === "To Store" ? seqStore : seqCust;
//   //     btnMap = {
//   //       to_warehouse: S2,
//   //       to_production: S3,
//   //       dispatch: S4,
//   //       rec_store_wh: returnto === "To Store" ? S5 : null,
//   //       store_to_customer: returnto === "To Store" ? S6 : null
//   //     };
//   //   }

//   //   const targetStatus = btnMap[btnKey];
    
//   //   // If targetStatus is null, hide button
//   //   if (!targetStatus) return { hidden: true };

//   //   const currentIndex = currentSeq.indexOf(status);
//   //   const targetIndex = currentSeq.indexOf(targetStatus);

//   //   // Sequence Checks
//   //   if (currentIndex >= targetIndex) return { isDone: true, disabled: true, title: "Already Processed", className: "bg-gray-400 opacity-50 cursor-not-allowed" };
//   //   if (currentIndex === targetIndex - 1) return { isDone: false, disabled: false, title: "", className: "hover:brightness-110 shadow-sm" };
    
//   //   return { isDone: false, disabled: true, title: "Locked", className: "bg-slate-100 text-slate-300 cursor-not-allowed border border-slate-200" };
//   // };

//   const getButtonStatus = (item, btnKey) => {
//     const status = item.status;
//     const returnto = item.returnto;
//     const type = item.type; 
//     const userType = user?.type; // Current logged in user type

//     const S1 = "Received at Store";
//     const S2 = "Dispatched to Warehouse";
//     const S3 = "Received at Warehouse";
//     const S4 = "Dispatch";
//     const S5 = "Received at Store From WH";
//     const S6 = "Store To Customer"; 

//     // 1. Permission Logic: Kaun sa user kaun sa button dekh sakta hai
//     if (userType === "Store") {
//       const storeAllowed = ["to_warehouse", "rec_store_wh", "store_to_customer"];
//       if (!storeAllowed.includes(btnKey)) return { hidden: true };
//     } 
//     else if (userType === "Warehouse") {
//       const whAllowed = ["to_production", "dispatch"];
//       if (!whAllowed.includes(btnKey)) return { hidden: true };
//     }
//     // Admin ke liye koi 'hidden' return nahi hoga, sab nazar ayega

//     // 2. Local Repair Flow vs Standard Flow
//     let currentSeq = [];
//     let btnMap = {};
//     const isLocalRepair = type && type.toLowerCase().trim() === 'local repair';

//     if (isLocalRepair) {
//       currentSeq = [S1, S2, S5, S6]; 
//       btnMap = {
//         to_warehouse: S2,
//         to_production: null, 
//         dispatch: null,      
//         rec_store_wh: S5,
//         store_to_customer: S6
//       };
//     } else {
//       const seqStore = [S1, S2, S3, S4, S5, S6];
//       const seqCust = [S1, S2, S3, S4];
//       currentSeq = returnto === "To Store" ? seqStore : seqCust;
//       btnMap = {
//         to_warehouse: S2,
//         to_production: S3,
//         dispatch: S4,
//         rec_store_wh: returnto === "To Store" ? S5 : null,
//         store_to_customer: returnto === "To Store" ? S6 : null
//       };
//     }

//     const targetStatus = btnMap[btnKey];
//     if (!targetStatus) return { hidden: true };

//     const currentIndex = currentSeq.indexOf(status);
//     const targetIndex = currentSeq.indexOf(targetStatus);

//     // 3. Button State (Disabled/Enabled)
//     if (currentIndex >= targetIndex) return { isDone: true, disabled: true, title: "Already Processed", className: "bg-gray-400 opacity-50 cursor-not-allowed" };
//     if (currentIndex === targetIndex - 1) return { isDone: false, disabled: false, title: "", className: "hover:brightness-110 shadow-sm" };
    
//     return { isDone: false, disabled: true, title: "Locked", className: "bg-slate-100 text-slate-300 cursor-not-allowed border border-slate-200" };
//   };
//   //================= End New Code ==================//

//   const dispatchAction = async (id, action, courierSlipInput = null) => {
//     let courierSlip = courierSlipInput;
//     if (!courierSlip && (action === "to_warehouse" || action === "dispatch")) {
//       const label = action === "to_warehouse" ? "Warehouse Courier Slip" : "Final Dispatch Slip";
//       courierSlip = prompt(`Enter ${label} number:`);
//       if (!courierSlip) return null;
//     }
//     return await axios.post(`http://localhost:8080/api/items/${id}/dispatch`, { action, courierSlip });
//   };

//   const handleSingleAction = async (id, action) => {
//     setLoadingId(id);
//     try {
//       const res = await dispatchAction(id, action);
//       if (res && res.data.success) {
//         setMsg({ type: "success", text: "Updated successfully!" });
//         if (socket) socket.emit("itemUpdated", res.data.data);
//         fetchItems();
//       }
//     } catch (err) { setMsg({ type: "error", text: "Update failed" }); }
//     finally { setLoadingId(null); }
//   };

//   const handleBulkAction = async (action) => {
//     if (selectedIds.length === 0) return alert("Please select items first!");
//     const selectedItemsData = items.filter(it => selectedIds.includes(it.id));
//     const cannotProcessIds = [];
//     const toProcessIds = [];
//     selectedItemsData.forEach(item => {
//         const state = getButtonStatus(item, action);
//         if (state.isDone || state.disabled || state.hidden) { // Also check hidden
//             cannotProcessIds.push(item.trackingId);
//         } else {
//             toProcessIds.push(item.id);
//         }
//     });
//     if (cannotProcessIds.length > 0) alert(`We cannot process these items (Already processed or out of sequence):\n${cannotProcessIds.join(", ")}`);
//     if (toProcessIds.length === 0) return;
//     let courierSlip = null;
//     if (action === "to_warehouse" || action === "dispatch") {
//       courierSlip = prompt(`Enter common Slip number for valid items:`);
//       if (!courierSlip) return;
//     }
//     setLoadingId("bulk");
//     try {
//       await Promise.all(toProcessIds.map(id => dispatchAction(id, action, courierSlip)));
//       setMsg({ type: "success", text: `Bulk update successful for ${toProcessIds.length} items!` });
//       setSelectedIds([]);
//       fetchItems();
//     } catch (err) { setMsg({ type: "error", text: "Bulk failed" }); }
//     finally { setLoadingId(null); }
//   };

//   const handleSaveRemarks = async (id) => {
//     try {
//       setLoadingId(id);
//       const res = await axios.put(`http://localhost:8080/api/items/${id}`, { remarksWH: tempRemarks[id] });
//       if (res.data.success) {
//         setMsg({ type: "success", text: "Remarks saved!" });
//         setActiveRemarksId(null);
//         fetchItems();
//       }
//     } catch (err) { setMsg({ type: "error", text: "Failed to save remarks" }); }
//     finally { setLoadingId(null); }
//   };

//   const toggleSelect = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

//   const statuses = [
//     { key: "to_warehouse", label: "To WH", color: "bg-amber-500" },
//     { key: "to_production", label: "Recvd WH", color: "bg-blue-600" },
//     { key: "dispatch", label: "Dispatch", color: "bg-green-600" },
//     { key: "rec_store_wh", label: "Rec Store From W.H", color: "bg-purple-600" },
//     { key: "store_to_customer", label: "Store To Cust", color: "bg-rose-600" },
//   ];

//   return (
//     <div className="space-y-4 animate-fadeIn relative">
//       {/* 1. Header Controls */}
//       <div className="flex flex-wrap justify-between items-center bg-white p-3 rounded-xl shadow-sm border border-gray-100 gap-3">
//         <div className="flex items-center gap-4">
//           <h2 className="text-xl font-bold text-slate-800 tracking-tight">Inventory Matrix</h2>
//           <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
//              <select value={selectedStore} onChange={(e) => setSelectedStore(e.target.value)} className="bg-white px-2 py-1 rounded text-[10px] font-bold border border-slate-200 outline-none">
//                <option value="all">All Stores</option>
//                {accessibleStores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
//              </select>
//              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-white px-1 py-1 rounded text-[10px] font-bold border border-slate-200 outline-none" />
//              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-white px-1 py-1 rounded text-[10px] font-bold border border-slate-200 outline-none" />
//           </div>
//           <button onClick={() => { setMultiSelectMode(!multiSelectMode); setSelectedIds([]); }} className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase transition-all shadow-sm ${multiSelectMode ? 'bg-rose-500 text-white' : 'bg-sky-600 text-white'}`}>
//             {multiSelectMode ? "✖ Exit Multi-Select" : "⚙ Option Multiple Select"}
//           </button>
//           {multiSelectMode && (
//             <div className="flex items-center gap-4 bg-slate-50 px-4 py-1.5 rounded-full border border-slate-200">
//               <label className="flex items-center gap-2 cursor-pointer">
//                 <input type="radio" name="filterMode" checked={filterType === 'store'} onChange={() => { setFilterType('store'); setSelectedIds([]); }} />
//                 <span className={`text-[11px] font-black uppercase ${filterType === 'store' ? 'text-sky-600' : 'text-slate-400'}`}>To Store</span>
//               </label>
//               <label className="flex items-center gap-2 cursor-pointer">
//                 <input type="radio" name="filterMode" checked={filterType === 'customer'} onChange={() => { setFilterType('customer'); setSelectedIds([]); }} />
//                 <span className={`text-[11px] font-black uppercase ${filterType === 'customer' ? 'text-rose-600' : 'text-slate-400'}`}>To Customer</span>
//               </label>
//             </div>
//           )}
//         </div>
//         {msg && <div className={`text-xs font-bold ${msg.type === 'error' ? 'text-red-500' : 'text-green-600'}`}>{msg.text}</div>}
//       </div>

//       {/* 2. Bulk Action Bar */}
//       {multiSelectMode && selectedIds.length > 0 && (
//         <div className="bg-slate-900 p-2 rounded-xl flex items-center justify-between shadow-2xl sticky top-2 z-10 border border-slate-700">
//           <span className="text-sky-400 text-[10px] font-black px-3 uppercase tracking-widest">{selectedIds.length} Selection Active</span>
//           <div className="flex gap-2">
//             {statuses.map(st => {
//               if (filterType === 'customer' && (st.key === "rec_store_wh" || st.key === "store_to_customer")) return null;
//               let bulkLabel = st.label;
//               if (st.key === "dispatch") bulkLabel = filterType === 'store' ? "Disp Store" : "Disp Cust";
//               return (
//                 <button key={st.key} onClick={() => handleBulkAction(st.key)} className={`${st.color} text-white text-[9px] font-black px-4 py-1.5 rounded-lg hover:scale-105 transition-all`}>
//                   BULK {bulkLabel}
//                 </button>
//               );
//             })}
//           </div>
//         </div>
//       )}

//       {/* 3. Table Section */}
//       <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
//         <div className="overflow-x-auto">
//           <table className="w-full text-left whitespace-nowrap">
//             <thead className="bg-slate-50 border-b border-slate-100">
//               <tr className="text-[10px] uppercase text-slate-400 font-black">
//                 {multiSelectMode && <th className="p-4 w-10 text-center">Select</th>}
//                 <th className="p-4">Tracking</th>
//                 <th className="p-4">Article</th>
//                 <th className="p-4">Return To</th>
//                 <th className="p-4">Status & Remarks</th>
//                 <th className="p-4 text-center">Actions / View</th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-slate-50">
//               {currentItems.map((it) => (
//                 <tr key={it.id} className={`hover:bg-sky-50/30 transition-colors ${selectedIds.includes(it.id) ? 'bg-sky-50/60' : ''}`}>
//                   {multiSelectMode && (
//                     <td className="p-4 text-center">
//                       <input type="checkbox" checked={selectedIds.includes(it.id)} onChange={() => toggleSelect(it.id)} className="w-4 h-4 rounded text-sky-600 cursor-pointer" />
//                     </td>
//                   )}
//                   <td className="p-4 font-black text-sky-900 text-xs">{it.trackingId}</td>
//                   <td className="p-4 font-bold text-slate-700 text-[11px]">{it.articleNo} ({it.size})</td>
//                   <td className="p-4">
//                     <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${it.returnto === 'To Store' ? 'text-indigo-600 bg-indigo-50' : 'text-rose-600 bg-rose-50'}`}>{it.returnto}</span>
//                   </td>
//                   <td className="p-4">
//                     <div className="flex flex-col">
//                         <span className="font-black text-[9px] text-slate-500 uppercase">{it.status}</span>
//                         {it.remarksWH && <span className="text-[9px] font-bold text-sky-600 italic">R: {it.remarksWH}</span>}
//                     </div>
//                   </td>
//                   <td className="p-4 text-center">
//                     <div className="flex justify-center items-center gap-1">
//                       {statuses.map((st) => {
//                         // Pass 'it' to get specific status for this item
//                         const state = getButtonStatus(it, st.key);
//                         if (state.hidden) return null;
//                         let btnLbl = st.label;
//                         if (st.key === "dispatch") btnLbl = it.returnto === "To Store" ? "Disp Store" : "Disp Cust";
//                         return (
//                           <button 
//                             key={st.key} 
//                             onClick={() => handleSingleAction(it.id, st.key)} 
//                             disabled={state.disabled || loadingId === it.id} 
//                             title={state.title}
//                             className={`px-2 py-1 rounded text-[9px] font-bold text-white transition-all ${state.disabled ? state.className : `${st.color} ${state.className}`}`}
//                           >
//                             {btnLbl}
//                           </button>
//                         );
//                       })}
//                       <button onClick={() => { setActiveRemarksId(activeRemarksId === it.id ? null : it.id); setTempRemarks({...tempRemarks, [it.id]: it.remarksWH || ""}); }} className={`p-1.5 rounded-full ${activeRemarksId === it.id ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-sky-200'}`}>💬</button>
//                       <button onClick={() => setViewingItem(it)} className="p-1.5 bg-slate-100 text-slate-600 rounded-full hover:bg-sky-100 shadow-sm">👁️</button>
//                     </div>
//                     {activeRemarksId === it.id && (
//                         <div className="mt-2 flex gap-1 animate-slideInRight">
//                             <input type="text" className="border border-sky-300 rounded px-2 py-1 text-[10px] w-full focus:ring-1 focus:ring-sky-500 outline-none" value={tempRemarks[it.id] || ""} onChange={(e) => setTempRemarks({...tempRemarks, [it.id]: e.target.value})} onKeyDown={(e) => e.key === 'Enter' && handleSaveRemarks(it.id)} />
//                             <button onClick={() => handleSaveRemarks(it.id)} className="bg-green-600 text-white px-2 py-1 rounded text-[9px] font-bold">SAVE</button>
//                         </div>
//                     )}
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       </div>

//       {/* ⭐ 4. UPDATED Modal View with ALL details */}
//       {viewingItem && (
//         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
//           <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
//             <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
//               <div>
//                 <h3 className="text-xl font-black">{viewingItem.trackingId}</h3>
//                 <p className="text-sky-400 text-xs font-bold uppercase tracking-widest">Current Status: {viewingItem.status}</p>
//               </div>
//               <button onClick={() => setViewingItem(null)} className="bg-white/10 hover:bg-white/20 w-8 h-8 rounded-full transition-colors">✕</button>
//             </div>
            
//             <div className="p-8 overflow-y-auto space-y-8 bg-slate-50/30">
//               {/* Product Section */}
//               <section className="space-y-4">
//                 <h4 className="text-[10px] font-black text-sky-600 uppercase border-b border-sky-100 pb-1">Product Information</h4>
//                 <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
//                   <DetailBox label="Article No" value={viewingItem.articleNo} />
//                   <DetailBox label="Size" value={viewingItem.size} />
//                   <DetailBox label="Color" value={viewingItem.color} />
//                   <DetailBox label="Invoice No" value={viewingItem.invoiceNo} />
//                   <DetailBox label="Claim Amount" value={`PKR ${viewingItem.claimAmount}`} />
//                   <DetailBox label="Type" value={viewingItem.type} />
//                 </div>
//               </section>

//               {/* Customer Section */}
//               <section className="space-y-4">
//                 <h4 className="text-[10px] font-black text-rose-600 uppercase border-b border-rose-100 pb-1">Customer & Logistics</h4>
//                 <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
//                   <DetailBox label="Customer Name" value={viewingItem.customerName} />
//                   <DetailBox label="Contact No" value={viewingItem.customerMobile} />
//                   <DetailBox label="Return To" value={viewingItem.returnto} />
//                   <DetailBox label="Warehouse" value={viewingItem.warehouse} />
//                   <div className="col-span-2">
//                     <DetailBox label="Billing Address" value={viewingItem.billingAddress} />
//                   </div>
//                 </div>
//               </section>

//               {/* Courier Section */}
//               <section className="space-y-4">
//                 <h4 className="text-[10px] font-black text-slate-900 uppercase border-b border-slate-200 pb-1">Courier & Tracking</h4>
//                 <div className="grid grid-cols-2 gap-6">
//                   <DetailBox label="Warehouse Slip" value={viewingItem.courierSlip} />
//                   <DetailBox label="Final Dispatch Slip" value={viewingItem.dispatchCourierSlip} />
//                 </div>
//               </section>

//               {/* Description Section */}
//               <section className="space-y-4">
//                 <h4 className="text-[10px] font-black text-slate-900 uppercase border-b border-slate-200 pb-1">Technical Details</h4>
//                 <div className="p-4 bg-white rounded-xl border border-slate-200">
//                    <DetailBox label="Problem / Reason" value={viewingItem.problemDescription} />
//                    <div className="mt-4 grid grid-cols-2 gap-2">
//                       <span className="text-[9px] font-bold text-slate-500 uppercase">Remarks:</span>
//                       <p className="text-xs text-slate-700 italic">{viewingItem.remarksWH || "No remarks provided"}</p>
//                    </div>
//                 </div>
//               </section>
//             </div>

//             <div className="p-4 bg-white border-t flex justify-end">
//               <button onClick={() => setViewingItem(null)} className="px-8 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black uppercase shadow-lg hover:bg-black transition-all">Close Entry</button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// function DetailBox({ label, value }) {
//   return (
//     <div className="flex flex-col gap-0.5">
//       <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter block">{label}</span>
//       <span className="text-sm font-bold text-slate-800 break-words">{value || "---"}</span>
//     </div>
//   );
// }






























// import React, { useState, useEffect, useMemo } from "react";
// import axios from "axios";

// export default function ItemList({ refresh, socket, user: propUser }) {
//   const [items, setItems] = useState([]);
//   const [allUsers, setAllUsers] = useState([]);
//   const [msg, setMsg] = useState(null);
//   const [loadingId, setLoadingId] = useState(null);
//   const [currentPage, setCurrentPage] = useState(1);
//   const itemsPerPage = 20;

//   const [multiSelectMode, setMultiSelectMode] = useState(false);
//   const [selectedIds, setSelectedIds] = useState([]);
//   const [filterType, setFilterType] = useState('store'); 
//   const [viewingItem, setViewingItem] = useState(null);
  
//   const user = useMemo(() => {
//     if (propUser && propUser.id) return propUser;
//     const saved = localStorage.getItem("user");
//     return saved ? JSON.parse(saved) : null;
//   }, [propUser]);

//   const [selectedStore, setSelectedStore] = useState('all');
//   const today = new Date().toISOString().split('T')[0];
//   const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
//   const [startDate, setStartDate] = useState(firstDay); 
//   const [endDate, setEndDate] = useState(today);

//   const [activeRemarksId, setActiveRemarksId] = useState(null);
//   const [tempRemarks, setTempRemarks] = useState({});

//   useEffect(() => {
//     if (msg) {
//       const timer = setTimeout(() => setMsg(null), 5000);
//       return () => clearTimeout(timer);
//     }
//   }, [msg]);

//   const fetchItems = async () => {
//     if (!user || !user.id) return; 
//     try {
//       const res = await axios.get('http://localhost:8080/api/items', {
//         params: { userId: user.id, type: user.type, storeId: selectedStore, startDate: startDate, endDate: endDate }
//       });
//       if (res.data.success) setItems(res.data.data || []);
//       const userRes = await axios.get("http://localhost:8080/api/users");
//       setAllUsers(userRes.data || []);
//     } catch (err) { console.error("Fetch Error:", err); }
//   };

//   useEffect(() => { fetchItems(); }, [refresh, user, selectedStore, startDate, endDate]);

//   const accessibleStores = useMemo(() => {
//     if (user?.type === 'Admin') return allUsers;
//     const assignedIds = user?.assignedUsers ? user.assignedUsers.split(',').filter(id => id).map(id => parseInt(id)) : [];
//     const myIds = [user?.id, ...assignedIds];
//     return allUsers.filter(u => myIds.includes(u.id));
//   }, [allUsers, user]);

//   const filteredItems = useMemo(() => {
//     if (!multiSelectMode) return items;
//     const target = filterType === 'store' ? "To Store" : "To Customer";
//     return items.filter(it => it.returnto === target);
//   }, [items, multiSelectMode, filterType]);

//   const currentItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

//   const getButtonStatus = (item, btnKey) => {
//     const status = item.status;
//     const returnto = item.returnto;
//     const S1 = "Received at Store";
//     const S2 = "Dispatched to Warehouse";
//     const S3 = "Received at Warehouse";
//     const S4 = "Dispatch";
//     const S5 = "Received at Store From WH";
//     const S6 = "Store To Customer"; 
//     const seqStore = [S1, S2, S3, S4, S5, S6];
//     const seqCust = [S1, S2, S3, S4];
//     const currentSeq = returnto === "To Store" ? seqStore : seqCust;
//     const currentIndex = currentSeq.indexOf(status);
//     const btnMap = {
//       to_warehouse: S2,
//       to_production: S3,
//       dispatch: S4,
//       rec_store_wh: returnto === "To Store" ? S5 : null,
//       store_to_customer: returnto === "To Store" ? S6 : null
//     };
//     const targetStatus = btnMap[btnKey];
//     if (!targetStatus) return { hidden: true };
//     const targetIndex = currentSeq.indexOf(targetStatus);
//     if (currentIndex >= targetIndex) return { isDone: true, disabled: true, title: "Already Processed", className: "bg-gray-400 opacity-50 cursor-not-allowed" };
//     if (currentIndex === targetIndex - 1) return { isDone: false, disabled: false, title: "", className: "hover:brightness-110 shadow-sm" };
//     return { isDone: false, disabled: true, title: "Locked", className: "bg-slate-100 text-slate-300 cursor-not-allowed border border-slate-200" };
//   };

//   const dispatchAction = async (id, action, courierSlipInput = null) => {
//     let courierSlip = courierSlipInput;
//     if (!courierSlip && (action === "to_warehouse" || action === "dispatch")) {
//       const label = action === "to_warehouse" ? "Warehouse Courier Slip" : "Final Dispatch Slip";
//       courierSlip = prompt(`Enter ${label} number:`);
//       if (!courierSlip) return null;
//     }
//     return await axios.post(`http://localhost:8080/api/items/${id}/dispatch`, { action, courierSlip });
//   };

//   const handleSingleAction = async (id, action) => {
//     setLoadingId(id);
//     try {
//       const res = await dispatchAction(id, action);
//       if (res && res.data.success) {
//         setMsg({ type: "success", text: "Updated successfully!" });
//         if (socket) socket.emit("itemUpdated", res.data.data);
//         fetchItems();
//       }
//     } catch (err) { setMsg({ type: "error", text: "Update failed" }); }
//     finally { setLoadingId(null); }
//   };

//   const handleBulkAction = async (action) => {
//     if (selectedIds.length === 0) return alert("Please select items first!");
//     const selectedItemsData = items.filter(it => selectedIds.includes(it.id));
//     const cannotProcessIds = [];
//     const toProcessIds = [];
//     selectedItemsData.forEach(item => {
//         const state = getButtonStatus(item, action);
//         if (state.isDone || state.disabled) {
//             cannotProcessIds.push(item.trackingId);
//         } else {
//             toProcessIds.push(item.id);
//         }
//     });
//     if (cannotProcessIds.length > 0) alert(`We cannot process these items (Already processed or out of sequence):\n${cannotProcessIds.join(", ")}`);
//     if (toProcessIds.length === 0) return;
//     let courierSlip = null;
//     if (action === "to_warehouse" || action === "dispatch") {
//       courierSlip = prompt(`Enter common Slip number for valid items:`);
//       if (!courierSlip) return;
//     }
//     setLoadingId("bulk");
//     try {
//       await Promise.all(toProcessIds.map(id => dispatchAction(id, action, courierSlip)));
//       setMsg({ type: "success", text: `Bulk update successful for ${toProcessIds.length} items!` });
//       setSelectedIds([]);
//       fetchItems();
//     } catch (err) { setMsg({ type: "error", text: "Bulk failed" }); }
//     finally { setLoadingId(null); }
//   };

//   const handleSaveRemarks = async (id) => {
//     try {
//       setLoadingId(id);
//       const res = await axios.put(`http://localhost:8080/api/items/${id}`, { remarksWH: tempRemarks[id] });
//       if (res.data.success) {
//         setMsg({ type: "success", text: "Remarks saved!" });
//         setActiveRemarksId(null);
//         fetchItems();
//       }
//     } catch (err) { setMsg({ type: "error", text: "Failed to save remarks" }); }
//     finally { setLoadingId(null); }
//   };

//   const toggleSelect = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

//   const statuses = [
//     { key: "to_warehouse", label: "To WH", color: "bg-amber-500" },
//     { key: "to_production", label: "Recvd WH", color: "bg-blue-600" },
//     { key: "dispatch", label: "Dispatch", color: "bg-green-600" },
//     { key: "rec_store_wh", label: "Rec Store From W.H", color: "bg-purple-600" },
//     { key: "store_to_customer", label: "Store To Cust", color: "bg-rose-600" },
//   ];

//   return (
//     <div className="space-y-4 animate-fadeIn relative">
//       {/* 1. Header Controls */}
//       <div className="flex flex-wrap justify-between items-center bg-white p-3 rounded-xl shadow-sm border border-gray-100 gap-3">
//         <div className="flex items-center gap-4">
//           <h2 className="text-xl font-bold text-slate-800 tracking-tight">Inventory Matrix</h2>
//           <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
//              <select value={selectedStore} onChange={(e) => setSelectedStore(e.target.value)} className="bg-white px-2 py-1 rounded text-[10px] font-bold border border-slate-200 outline-none">
//                <option value="all">All Stores</option>
//                {accessibleStores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
//              </select>
//              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-white px-1 py-1 rounded text-[10px] font-bold border border-slate-200 outline-none" />
//              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-white px-1 py-1 rounded text-[10px] font-bold border border-slate-200 outline-none" />
//           </div>
//           <button onClick={() => { setMultiSelectMode(!multiSelectMode); setSelectedIds([]); }} className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase transition-all shadow-sm ${multiSelectMode ? 'bg-rose-500 text-white' : 'bg-sky-600 text-white'}`}>
//             {multiSelectMode ? "✖ Exit Multi-Select" : "⚙ Option Multiple Select"}
//           </button>
//           {multiSelectMode && (
//             <div className="flex items-center gap-4 bg-slate-50 px-4 py-1.5 rounded-full border border-slate-200">
//               <label className="flex items-center gap-2 cursor-pointer">
//                 <input type="radio" name="filterMode" checked={filterType === 'store'} onChange={() => { setFilterType('store'); setSelectedIds([]); }} />
//                 <span className={`text-[11px] font-black uppercase ${filterType === 'store' ? 'text-sky-600' : 'text-slate-400'}`}>To Store</span>
//               </label>
//               <label className="flex items-center gap-2 cursor-pointer">
//                 <input type="radio" name="filterMode" checked={filterType === 'customer'} onChange={() => { setFilterType('customer'); setSelectedIds([]); }} />
//                 <span className={`text-[11px] font-black uppercase ${filterType === 'customer' ? 'text-rose-600' : 'text-slate-400'}`}>To Customer</span>
//               </label>
//             </div>
//           )}
//         </div>
//         {msg && <div className={`text-xs font-bold ${msg.type === 'error' ? 'text-red-500' : 'text-green-600'}`}>{msg.text}</div>}
//       </div>

//       {/* 2. Bulk Action Bar */}
//       {multiSelectMode && selectedIds.length > 0 && (
//         <div className="bg-slate-900 p-2 rounded-xl flex items-center justify-between shadow-2xl sticky top-2 z-10 border border-slate-700">
//           <span className="text-sky-400 text-[10px] font-black px-3 uppercase tracking-widest">{selectedIds.length} Selection Active</span>
//           <div className="flex gap-2">
//             {statuses.map(st => {
//               if (filterType === 'customer' && (st.key === "rec_store_wh" || st.key === "store_to_customer")) return null;
//               let bulkLabel = st.label;
//               if (st.key === "dispatch") bulkLabel = filterType === 'store' ? "Disp Store" : "Disp Cust";
//               return (
//                 <button key={st.key} onClick={() => handleBulkAction(st.key)} className={`${st.color} text-white text-[9px] font-black px-4 py-1.5 rounded-lg hover:scale-105 transition-all`}>
//                   BULK {bulkLabel}
//                 </button>
//               );
//             })}
//           </div>
//         </div>
//       )}

//       {/* 3. Table Section */}
//       <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
//         <div className="overflow-x-auto">
//           <table className="w-full text-left whitespace-nowrap">
//             <thead className="bg-slate-50 border-b border-slate-100">
//               <tr className="text-[10px] uppercase text-slate-400 font-black">
//                 {multiSelectMode && <th className="p-4 w-10 text-center">Select</th>}
//                 <th className="p-4">Tracking</th>
//                 <th className="p-4">Article</th>
//                 <th className="p-4">Return To</th>
//                 <th className="p-4">Status & Remarks</th>
//                 <th className="p-4 text-center">Actions / View</th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-slate-50">
//               {currentItems.map((it) => (
//                 <tr key={it.id} className={`hover:bg-sky-50/30 transition-colors ${selectedIds.includes(it.id) ? 'bg-sky-50/60' : ''}`}>
//                   {multiSelectMode && (
//                     <td className="p-4 text-center">
//                       <input type="checkbox" checked={selectedIds.includes(it.id)} onChange={() => toggleSelect(it.id)} className="w-4 h-4 rounded text-sky-600 cursor-pointer" />
//                     </td>
//                   )}
//                   <td className="p-4 font-black text-sky-900 text-xs">{it.trackingId}</td>
//                   <td className="p-4 font-bold text-slate-700 text-[11px]">{it.articleNo} ({it.size})</td>
//                   <td className="p-4">
//                     <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${it.returnto === 'To Store' ? 'text-indigo-600 bg-indigo-50' : 'text-rose-600 bg-rose-50'}`}>{it.returnto}</span>
//                   </td>
//                   <td className="p-4">
//                     <div className="flex flex-col">
//                         <span className="font-black text-[9px] text-slate-500 uppercase">{it.status}</span>
//                         {it.remarksWH && <span className="text-[9px] font-bold text-sky-600 italic">R: {it.remarksWH}</span>}
//                     </div>
//                   </td>
//                   <td className="p-4 text-center">
//                     <div className="flex justify-center items-center gap-1">
//                       {statuses.map((st) => {
//                         const state = getButtonStatus(it, st.key);
//                         if (state.hidden) return null;
//                         let btnLbl = st.label;
//                         if (st.key === "dispatch") btnLbl = it.returnto === "To Store" ? "Disp Store" : "Disp Cust";
//                         return (
//                           <button 
//                             key={st.key} 
//                             onClick={() => handleSingleAction(it.id, st.key)} 
//                             disabled={state.disabled || loadingId === it.id} 
//                             title={state.title}
//                             className={`px-2 py-1 rounded text-[9px] font-bold text-white transition-all ${state.disabled ? state.className : `${st.color} ${state.className}`}`}
//                           >
//                             {btnLbl}
//                           </button>
//                         );
//                       })}
//                       <button onClick={() => { setActiveRemarksId(activeRemarksId === it.id ? null : it.id); setTempRemarks({...tempRemarks, [it.id]: it.remarksWH || ""}); }} className={`p-1.5 rounded-full ${activeRemarksId === it.id ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-sky-200'}`}>💬</button>
//                       <button onClick={() => setViewingItem(it)} className="p-1.5 bg-slate-100 text-slate-600 rounded-full hover:bg-sky-100 shadow-sm">👁️</button>
//                     </div>
//                     {activeRemarksId === it.id && (
//                         <div className="mt-2 flex gap-1 animate-slideInRight">
//                             <input type="text" className="border border-sky-300 rounded px-2 py-1 text-[10px] w-full focus:ring-1 focus:ring-sky-500 outline-none" value={tempRemarks[it.id] || ""} onChange={(e) => setTempRemarks({...tempRemarks, [it.id]: e.target.value})} onKeyDown={(e) => e.key === 'Enter' && handleSaveRemarks(it.id)} />
//                             <button onClick={() => handleSaveRemarks(it.id)} className="bg-green-600 text-white px-2 py-1 rounded text-[9px] font-bold">SAVE</button>
//                         </div>
//                     )}
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       </div>

//       {/* ⭐ 4. UPDATED Modal View with ALL details */}
//       {viewingItem && (
//         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
//           <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
//             <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
//               <div>
//                 <h3 className="text-xl font-black">{viewingItem.trackingId}</h3>
//                 <p className="text-sky-400 text-xs font-bold uppercase tracking-widest">Current Status: {viewingItem.status}</p>
//               </div>
//               <button onClick={() => setViewingItem(null)} className="bg-white/10 hover:bg-white/20 w-8 h-8 rounded-full transition-colors">✕</button>
//             </div>
            
//             <div className="p-8 overflow-y-auto space-y-8 bg-slate-50/30">
//               {/* Product Section */}
//               <section className="space-y-4">
//                 <h4 className="text-[10px] font-black text-sky-600 uppercase border-b border-sky-100 pb-1">Product Information</h4>
//                 <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
//                   <DetailBox label="Article No" value={viewingItem.articleNo} />
//                   <DetailBox label="Size" value={viewingItem.size} />
//                   <DetailBox label="Color" value={viewingItem.color} />
//                   <DetailBox label="Invoice No" value={viewingItem.invoiceNo} />
//                   <DetailBox label="Claim Amount" value={`PKR ${viewingItem.claimAmount}`} />
//                   <DetailBox label="Type" value={viewingItem.type} />
//                 </div>
//               </section>

//               {/* Customer Section */}
//               <section className="space-y-4">
//                 <h4 className="text-[10px] font-black text-rose-600 uppercase border-b border-rose-100 pb-1">Customer & Logistics</h4>
//                 <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
//                   <DetailBox label="Customer Name" value={viewingItem.customerName} />
//                   <DetailBox label="Contact No" value={viewingItem.customerMobile} />
//                   <DetailBox label="Return To" value={viewingItem.returnto} />
//                   <DetailBox label="Warehouse" value={viewingItem.warehouse} />
//                   <div className="col-span-2">
//                     <DetailBox label="Billing Address" value={viewingItem.billingAddress} />
//                   </div>
//                 </div>
//               </section>

//               {/* Courier Section */}
//               <section className="space-y-4">
//                 <h4 className="text-[10px] font-black text-slate-900 uppercase border-b border-slate-200 pb-1">Courier & Tracking</h4>
//                 <div className="grid grid-cols-2 gap-6">
//                   <DetailBox label="Warehouse Slip" value={viewingItem.courierSlip} />
//                   <DetailBox label="Final Dispatch Slip" value={viewingItem.dispatchCourierSlip} />
//                 </div>
//               </section>

//               {/* Description Section */}
//               <section className="space-y-4">
//                 <h4 className="text-[10px] font-black text-slate-900 uppercase border-b border-slate-200 pb-1">Technical Details</h4>
//                 <div className="p-4 bg-white rounded-xl border border-slate-200">
//                    <DetailBox label="Problem / Reason" value={viewingItem.problemDescription} />
//                    <div className="mt-4 grid grid-cols-2 gap-2">
//                       <span className="text-[9px] font-bold text-slate-500 uppercase">Remarks:</span>
//                       <p className="text-xs text-slate-700 italic">{viewingItem.remarksWH || "No remarks provided"}</p>
//                    </div>
//                 </div>
//               </section>
//             </div>

//             <div className="p-4 bg-white border-t flex justify-end">
//               <button onClick={() => setViewingItem(null)} className="px-8 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black uppercase shadow-lg hover:bg-black transition-all">Close Entry</button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// function DetailBox({ label, value }) {
//   return (
//     <div className="flex flex-col gap-0.5">
//       <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter block">{label}</span>
//       <span className="text-sm font-bold text-slate-800 break-words">{value || "---"}</span>
//     </div>
//   );
// }

























































// import React, { useState, useEffect, useMemo } from "react";
// import axios from "axios";

// export default function ItemList({ refresh, socket, user: propUser }) {
//   const [items, setItems] = useState([]);
//   const [allUsers, setAllUsers] = useState([]);
//   const [msg, setMsg] = useState(null);
//   const [loadingId, setLoadingId] = useState(null);
//   const [currentPage, setCurrentPage] = useState(1);
//   const itemsPerPage = 20;

//   const [multiSelectMode, setMultiSelectMode] = useState(false);
//   const [selectedIds, setSelectedIds] = useState([]);
//   const [filterType, setFilterType] = useState('store'); 
//   const [viewingItem, setViewingItem] = useState(null);
  
//   const user = useMemo(() => {
//     if (propUser && propUser.id) return propUser;
//     const saved = localStorage.getItem("user");
//     return saved ? JSON.parse(saved) : null;
//   }, [propUser]);

//   const [selectedStore, setSelectedStore] = useState('all');
//   const today = new Date().toISOString().split('T')[0];
//   const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
//   const [startDate, setStartDate] = useState(firstDay); 
//   const [endDate, setEndDate] = useState(today);

//   const [activeRemarksId, setActiveRemarksId] = useState(null);
//   const [tempRemarks, setTempRemarks] = useState({});

//   useEffect(() => {
//     if (msg) {
//       const timer = setTimeout(() => setMsg(null), 5000);
//       return () => clearTimeout(timer);
//     }
//   }, [msg]);

//   const fetchItems = async () => {
//     if (!user || !user.id) return; 
//     try {
//       const res = await axios.get('http://localhost:8080/api/items', {
//         params: { userId: user.id, type: user.type, storeId: selectedStore, startDate: startDate, endDate: endDate }
//       });
//       if (res.data.success) setItems(res.data.data || []);
//       const userRes = await axios.get("http://localhost:8080/api/users");
//       setAllUsers(userRes.data || []);
//     } catch (err) { console.error("Fetch Error:", err); }
//   };

//   useEffect(() => { fetchItems(); }, [refresh, user, selectedStore, startDate, endDate]);

//   const accessibleStores = useMemo(() => {
//     if (user?.type === 'Admin') return allUsers;
//     const assignedIds = user?.assignedUsers ? user.assignedUsers.split(',').filter(id => id).map(id => parseInt(id)) : [];
//     const myIds = [user?.id, ...assignedIds];
//     return allUsers.filter(u => myIds.includes(u.id));
//   }, [allUsers, user]);

//   const filteredItems = useMemo(() => {
//     if (!multiSelectMode) return items;
//     const target = filterType === 'store' ? "To Store" : "To Customer";
//     return items.filter(it => it.returnto === target);
//   }, [items, multiSelectMode, filterType]);

//   const currentItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

//   // ⭐ SEQUENCE LOGIC
//   const getButtonStatus = (item, btnKey) => {
//     const status = item.status;
//     const returnto = item.returnto;

//     const S1 = "Received at Store";
//     const S2 = "Dispatched to Warehouse";
//     const S3 = "Received at Warehouse";
//     const S4 = "Dispatch";
//     const S5 = "Received at Store From WH";
//     const S6 = "Store To Customer"; 

//     const seqStore = [S1, S2, S3, S4, S5, S6];
//     const seqCust = [S1, S2, S3, S4];

//     const currentSeq = returnto === "To Store" ? seqStore : seqCust;
//     const currentIndex = currentSeq.indexOf(status);

//     const btnMap = {
//       to_warehouse: S2,
//       to_production: S3,
//       dispatch: S4,
//       rec_store_wh: returnto === "To Store" ? S5 : null,
//       store_to_customer: returnto === "To Store" ? S6 : null
//     };

//     const targetStatus = btnMap[btnKey];
//     if (!targetStatus) return { hidden: true };

//     const targetIndex = currentSeq.indexOf(targetStatus);

//     if (currentIndex >= targetIndex) {
//       return { isDone: true, disabled: true, title: "Already Processed", className: "bg-gray-400 opacity-50 cursor-not-allowed" };
//     }
//     if (currentIndex === targetIndex - 1) {
//       return { isDone: false, disabled: false, title: "", className: "hover:brightness-110 shadow-sm" };
//     }
//     return { isDone: false, disabled: true, title: "Locked", className: "bg-slate-100 text-slate-300 cursor-not-allowed border border-slate-200" };
//   };

//   const dispatchAction = async (id, action, courierSlipInput = null) => {
//     let courierSlip = courierSlipInput;
//     if (!courierSlip && (action === "to_warehouse" || action === "dispatch")) {
//       const label = action === "to_warehouse" ? "Warehouse Courier Slip" : "Final Dispatch Slip";
//       courierSlip = prompt(`Enter ${label} number:`);
//       if (!courierSlip) return null;
//     }
//     return await axios.post(`http://localhost:8080/api/items/${id}/dispatch`, { action, courierSlip });
//   };

//   const handleSingleAction = async (id, action) => {
//     setLoadingId(id);
//     try {
//       const res = await dispatchAction(id, action);
//       if (res && res.data.success) {
//         setMsg({ type: "success", text: "Updated successfully!" });
//         if (socket) socket.emit("itemUpdated", res.data.data);
//         fetchItems();
//       }
//     } catch (err) { setMsg({ type: "error", text: "Update failed" }); }
//     finally { setLoadingId(null); }
//   };

//   // ⭐ IMPROVED BULK ACTION WITH YOUR EXACT REQUIREMENT
//   const handleBulkAction = async (action) => {
//     if (selectedIds.length === 0) return alert("Please select items first!");

//     const selectedItemsData = items.filter(it => selectedIds.includes(it.id));
    
//     const cannotProcessIds = [];
//     const toProcessIds = [];

//     selectedItemsData.forEach(item => {
//         const state = getButtonStatus(item, action);
//         // Agar item already processed hai ya rasta locked hai (not the next step)
//         if (state.isDone || state.disabled) {
//             cannotProcessIds.push(item.trackingId);
//         } else {
//             toProcessIds.push(item.id);
//         }
//     });

//     // 1. Show alert for items that cannot be processed
//     if (cannotProcessIds.length > 0) {
//         alert(`We cannot process these items (Already processed or out of sequence):\n${cannotProcessIds.join(", ")}`);
//     }

//     // 2. Stop if no valid items are left
//     if (toProcessIds.length === 0) {
//         return; // Message pehle hi alert mein aa chuka hai
//     }

//     let courierSlip = null;
//     if (action === "to_warehouse" || action === "dispatch") {
//       courierSlip = prompt(`Enter common Slip number for valid items:`);
//       if (!courierSlip) return;
//     }

//     setLoadingId("bulk");
//     try {
//       await Promise.all(toProcessIds.map(id => dispatchAction(id, action, courierSlip)));
//       setMsg({ type: "success", text: `Bulk update successful for ${toProcessIds.length} items!` });
//       setSelectedIds([]);
//       fetchItems();
//     } catch (err) { setMsg({ type: "error", text: "Bulk failed" }); }
//     finally { setLoadingId(null); }
//   };

//   const handleSaveRemarks = async (id) => {
//     try {
//       setLoadingId(id);
//       const res = await axios.put(`http://localhost:8080/api/items/${id}`, { remarksWH: tempRemarks[id] });
//       if (res.data.success) {
//         setMsg({ type: "success", text: "Remarks saved!" });
//         setActiveRemarksId(null);
//         fetchItems();
//       }
//     } catch (err) { setMsg({ type: "error", text: "Failed to save remarks" }); }
//     finally { setLoadingId(null); }
//   };

//   const toggleSelect = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

//   const statuses = [
//     { key: "to_warehouse", label: "To WH", color: "bg-amber-500" },
//     { key: "to_production", label: "Recvd WH", color: "bg-blue-600" },
//     { key: "dispatch", label: "Dispatch", color: "bg-green-600" },
//     { key: "rec_store_wh", label: "Rec Store From W.H", color: "bg-purple-600" },
//     { key: "store_to_customer", label: "Store To Cust", color: "bg-rose-600" },
//   ];

//   return (
//     <div className="space-y-4 animate-fadeIn relative">
//       {/* 1. Header Controls */}
//       <div className="flex flex-wrap justify-between items-center bg-white p-3 rounded-xl shadow-sm border border-gray-100 gap-3">
//         <div className="flex items-center gap-4">
//           <h2 className="text-xl font-bold text-slate-800 tracking-tight">Inventory Matrix</h2>
//           <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
//              <select value={selectedStore} onChange={(e) => setSelectedStore(e.target.value)} className="bg-white px-2 py-1 rounded text-[10px] font-bold border border-slate-200 outline-none">
//                <option value="all">All Stores</option>
//                {accessibleStores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
//              </select>
//              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-white px-1 py-1 rounded text-[10px] font-bold border border-slate-200 outline-none" />
//              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-white px-1 py-1 rounded text-[10px] font-bold border border-slate-200 outline-none" />
//           </div>
//           <button onClick={() => { setMultiSelectMode(!multiSelectMode); setSelectedIds([]); }} className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase transition-all shadow-sm ${multiSelectMode ? 'bg-rose-500 text-white' : 'bg-sky-600 text-white'}`}>
//             {multiSelectMode ? "✖ Exit Multi-Select" : "⚙ Option Multiple Select"}
//           </button>
//           {multiSelectMode && (
//             <div className="flex items-center gap-4 bg-slate-50 px-4 py-1.5 rounded-full border border-slate-200">
//               <label className="flex items-center gap-2 cursor-pointer">
//                 <input type="radio" name="filterMode" checked={filterType === 'store'} onChange={() => { setFilterType('store'); setSelectedIds([]); }} />
//                 <span className={`text-[11px] font-black uppercase ${filterType === 'store' ? 'text-sky-600' : 'text-slate-400'}`}>To Store</span>
//               </label>
//               <label className="flex items-center gap-2 cursor-pointer">
//                 <input type="radio" name="filterMode" checked={filterType === 'customer'} onChange={() => { setFilterType('customer'); setSelectedIds([]); }} />
//                 <span className={`text-[11px] font-black uppercase ${filterType === 'customer' ? 'text-rose-600' : 'text-slate-400'}`}>To Customer</span>
//               </label>
//             </div>
//           )}
//         </div>
//         {msg && <div className={`text-xs font-bold ${msg.type === 'error' ? 'text-red-500' : 'text-green-600'}`}>{msg.text}</div>}
//       </div>

//       {/* 2. Bulk Action Bar */}
//       {multiSelectMode && selectedIds.length > 0 && (
//         <div className="bg-slate-900 p-2 rounded-xl flex items-center justify-between shadow-2xl sticky top-2 z-10 border border-slate-700">
//           <span className="text-sky-400 text-[10px] font-black px-3 uppercase tracking-widest">{selectedIds.length} Selection Active</span>
//           <div className="flex gap-2">
//             {statuses.map(st => {
//               if (filterType === 'customer' && (st.key === "rec_store_wh" || st.key === "store_to_customer")) return null;
//               let bulkLabel = st.label;
//               if (st.key === "dispatch") bulkLabel = filterType === 'store' ? "Disp Store" : "Disp Cust";
//               return (
//                 <button key={st.key} onClick={() => handleBulkAction(st.key)} className={`${st.color} text-white text-[9px] font-black px-4 py-1.5 rounded-lg hover:scale-105 transition-all`}>
//                   BULK {bulkLabel}
//                 </button>
//               );
//             })}
//           </div>
//         </div>
//       )}

//       {/* 3. Table Section */}
//       <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
//         <div className="overflow-x-auto">
//           <table className="w-full text-left whitespace-nowrap">
//             <thead className="bg-slate-50 border-b border-slate-100">
//               <tr className="text-[10px] uppercase text-slate-400 font-black">
//                 {multiSelectMode && <th className="p-4 w-10 text-center">Select</th>}
//                 <th className="p-4">Tracking</th>
//                 <th className="p-4">Article</th>
//                 <th className="p-4">Return To</th>
//                 <th className="p-4">Status & Remarks</th>
//                 <th className="p-4 text-center">Actions / View</th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-slate-50">
//               {currentItems.map((it) => (
//                 <tr key={it.id} className={`hover:bg-sky-50/30 transition-colors ${selectedIds.includes(it.id) ? 'bg-sky-50/60' : ''}`}>
//                   {multiSelectMode && (
//                     <td className="p-4 text-center">
//                       <input type="checkbox" checked={selectedIds.includes(it.id)} onChange={() => toggleSelect(it.id)} className="w-4 h-4 rounded text-sky-600 cursor-pointer" />
//                     </td>
//                   )}
//                   <td className="p-4 font-black text-sky-900 text-xs">{it.trackingId}</td>
//                   <td className="p-4 font-bold text-slate-700 text-[11px]">{it.articleNo} ({it.size})</td>
//                   <td className="p-4">
//                     <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${it.returnto === 'To Store' ? 'text-indigo-600 bg-indigo-50' : 'text-rose-600 bg-rose-50'}`}>{it.returnto}</span>
//                   </td>
//                   <td className="p-4">
//                     <div className="flex flex-col">
//                         <span className="font-black text-[9px] text-slate-500 uppercase">{it.status}</span>
//                         {it.remarksWH && <span className="text-[9px] font-bold text-sky-600 italic">R: {it.remarksWH}</span>}
//                     </div>
//                   </td>
//                   <td className="p-4 text-center">
//                     <div className="flex justify-center items-center gap-1">
//                       {statuses.map((st) => {
//                         const state = getButtonStatus(it, st.key);
//                         if (state.hidden) return null;
//                         let btnLbl = st.label;
//                         if (st.key === "dispatch") btnLbl = it.returnto === "To Store" ? "Disp Store" : "Disp Cust";
//                         return (
//                           <button 
//                             key={st.key} 
//                             onClick={() => handleSingleAction(it.id, st.key)} 
//                             disabled={state.disabled || loadingId === it.id} 
//                             title={state.title}
//                             className={`px-2 py-1 rounded text-[9px] font-bold text-white transition-all ${state.disabled ? state.className : `${st.color} ${state.className}`}`}
//                           >
//                             {btnLbl}
//                           </button>
//                         );
//                       })}
//                       <button onClick={() => { setActiveRemarksId(activeRemarksId === it.id ? null : it.id); setTempRemarks({...tempRemarks, [it.id]: it.remarksWH || ""}); }} className={`p-1.5 rounded-full ${activeRemarksId === it.id ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-sky-200'}`}>💬</button>
//                       <button onClick={() => setViewingItem(it)} className="p-1.5 bg-slate-100 text-slate-600 rounded-full hover:bg-sky-100 shadow-sm">👁️</button>
//                     </div>

//                     {activeRemarksId === it.id && (
//                         <div className="mt-2 flex gap-1 animate-slideInRight">
//                             <input type="text" className="border border-sky-300 rounded px-2 py-1 text-[10px] w-full focus:ring-1 focus:ring-sky-500 outline-none" value={tempRemarks[it.id] || ""} onChange={(e) => setTempRemarks({...tempRemarks, [it.id]: e.target.value})} onKeyDown={(e) => e.key === 'Enter' && handleSaveRemarks(it.id)} />
//                             <button onClick={() => handleSaveRemarks(it.id)} className="bg-green-600 text-white px-2 py-1 rounded text-[9px] font-bold">SAVE</button>
//                         </div>
//                     )}
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       </div>

//       {/* 4. Modal View */}
//       {viewingItem && (
//         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
//           <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
//             <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
//               <div>
//                 <h3 className="text-xl font-black">{viewingItem.trackingId}</h3>
//                 <p className="text-sky-400 text-xs font-bold uppercase">{viewingItem.status}</p>
//               </div>
//               <button onClick={() => setViewingItem(null)} className="bg-white/10 hover:bg-white/20 w-8 h-8 rounded-full">✕</button>
//             </div>
//             <div className="p-8 overflow-y-auto space-y-6">
//               <div className="grid grid-cols-2 gap-6">
//                 <DetailBox label="Article No" value={viewingItem.articleNo} />
//                 <DetailBox label="Return To" value={viewingItem.returnto} />
//                 <DetailBox label="WH Slip" value={viewingItem.courierSlip} />
//                 <DetailBox label="Final Slip" value={viewingItem.dispatchCourierSlip} />
//               </div>
//             </div>
//             <div className="p-4 bg-slate-50 border-t flex justify-end">
//               <button onClick={() => setViewingItem(null)} className="px-6 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase shadow-lg">Close</button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// function DetailBox({ label, value }) {
//   return (
//     <div>
//       <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter block">{label}</span>
//       <span className="text-sm font-bold text-slate-800">{value || "---"}</span>
//     </div>
//   );
// }








































































// import React, { useState, useEffect, useMemo } from "react";
// import axios from "axios";

// export default function ItemList({ refresh, socket, user: propUser }) {
//   const [items, setItems] = useState([]);
//   const [allUsers, setAllUsers] = useState([]);
//   const [msg, setMsg] = useState(null);
//   const [loadingId, setLoadingId] = useState(null);
//   const [currentPage, setCurrentPage] = useState(1);
//   const itemsPerPage = 20;

//   const [multiSelectMode, setMultiSelectMode] = useState(false);
//   const [selectedIds, setSelectedIds] = useState([]);
//   const [filterType, setFilterType] = useState('store'); 
//   const [viewingItem, setViewingItem] = useState(null);
  
//   const user = useMemo(() => {
//     if (propUser && propUser.id) return propUser;
//     const saved = localStorage.getItem("user");
//     return saved ? JSON.parse(saved) : null;
//   }, [propUser]);

//   const [selectedStore, setSelectedStore] = useState('all');
//   const today = new Date().toISOString().split('T')[0];
//   const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
//   const [startDate, setStartDate] = useState(firstDay); 
//   const [endDate, setEndDate] = useState(today);

//   const [activeRemarksId, setActiveRemarksId] = useState(null);
//   const [tempRemarks, setTempRemarks] = useState({});

//   useEffect(() => {
//     if (msg) {
//       const timer = setTimeout(() => setMsg(null), 5000);
//       return () => clearTimeout(timer);
//     }
//   }, [msg]);

//   const fetchItems = async () => {
//     if (!user || !user.id) return; 
//     try {
//       const res = await axios.get('http://localhost:8080/api/items', {
//         params: { userId: user.id, type: user.type, storeId: selectedStore, startDate: startDate, endDate: endDate }
//       });
//       if (res.data.success) setItems(res.data.data || []);
//       const userRes = await axios.get("http://localhost:8080/api/users");
//       setAllUsers(userRes.data || []);
//     } catch (err) { console.error("Fetch Error:", err); }
//   };

//   useEffect(() => { fetchItems(); }, [refresh, user, selectedStore, startDate, endDate]);

//   const accessibleStores = useMemo(() => {
//     if (user?.type === 'Admin') return allUsers;
//     const assignedIds = user?.assignedUsers ? user.assignedUsers.split(',').filter(id => id).map(id => parseInt(id)) : [];
//     const myIds = [user?.id, ...assignedIds];
//     return allUsers.filter(u => myIds.includes(u.id));
//   }, [allUsers, user]);

//   const filteredItems = useMemo(() => {
//     if (!multiSelectMode) return items;
//     const target = filterType === 'store' ? "To Store" : "To Customer";
//     return items.filter(it => it.returnto === target);
//   }, [items, multiSelectMode, filterType]);

//   const currentItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

//   // ⭐ Logic for Sequencing and Button States
//   const getButtonStatus = (item, btnKey) => {
//     const status = item.status;
//     const returnto = item.returnto;

//     // Standard sequence strings from your Model
//     const S1 = "Received at Store";
//     const S2 = "Dispatched to Warehouse";
//     const S3 = "Received at Warehouse";
//     const S4 = "Dispatch";
//     const S5 = "Received at Store From WH";
//     const S6 = "Store To Customer"; // Exact match with Model ENUM

//     const seqStore = [S1, S2, S3, S4, S5, S6];
//     const seqCust = [S1, S2, S3, S4];

//     const currentSeq = returnto === "To Store" ? seqStore : seqCust;
//     const currentIndex = currentSeq.indexOf(status);

//     const btnMap = {
//       to_warehouse: S2,
//       to_production: S3,
//       dispatch: S4,
//       rec_store_wh: returnto === "To Store" ? S5 : null,
//       store_to_customer: returnto === "To Store" ? S6 : null
//     };

//     const targetStatus = btnMap[btnKey];
//     if (!targetStatus) return { hidden: true };

//     const targetIndex = currentSeq.indexOf(targetStatus);

//     if (currentIndex >= targetIndex) {
//       return { disabled: true, title: "Already Processed", className: "bg-gray-400 opacity-50 cursor-not-allowed" };
//     }
//     if (currentIndex === targetIndex - 1) {
//       return { disabled: false, title: "", className: "hover:brightness-110" };
//     }
//     return { disabled: true, title: "Locked", className: "bg-slate-100 text-slate-300 cursor-not-allowed" };
//   };

//   const dispatchAction = async (id, action, courierSlipInput = null) => {
//     let courierSlip = courierSlipInput;
//     if (!courierSlip && (action === "to_warehouse" || action === "dispatch")) {
//       const label = action === "to_warehouse" ? "Warehouse Courier Slip" : "Final Dispatch Slip";
//       courierSlip = prompt(`Enter ${label} number:`);
//       if (!courierSlip) return null;
//     }
//     return await axios.post(`http://localhost:8080/api/items/${id}/dispatch`, { action, courierSlip });
//   };

//   const handleSingleAction = async (id, action) => {
//     setLoadingId(id);
//     try {
//       const res = await dispatchAction(id, action);
//       if (res && res.data.success) {
//         setMsg({ type: "success", text: "Updated successfully!" });
//         if (socket) socket.emit("itemUpdated", res.data.data);
//         fetchItems();
//       }
//     } catch (err) { setMsg({ type: "error", text: "Update failed" }); }
//     finally { setLoadingId(null); }
//   };

//   const handleSaveRemarks = async (id) => {
//     try {
//       setLoadingId(id);
//       const res = await axios.put(`http://localhost:8080/api/items/${id}`, { remarksWH: tempRemarks[id] });
//       if (res.data.success) {
//         setMsg({ type: "success", text: "Remarks saved!" });
//         setActiveRemarksId(null);
//         fetchItems();
//       }
//     } catch (err) { setMsg({ type: "error", text: "Failed to save remarks" }); }
//     finally { setLoadingId(null); }
//   };

//   const handleBulkAction = async (action) => {
//     if (selectedIds.length === 0) return alert("Please select items first!");
    
//     let courierSlip = null;
//     if (action === "to_warehouse" || action === "dispatch") {
//       courierSlip = prompt(`Enter common Slip number:`);
//       if (!courierSlip) return;
//     }

//     setLoadingId("bulk");
//     try {
//       await Promise.all(selectedIds.map(id => {
//         const item = items.find(it => it.id === id);
//         const state = getButtonStatus(item, action);
//         if (!state.disabled) return dispatchAction(id, action, courierSlip);
//         return Promise.resolve();
//       }));
//       setMsg({ type: "success", text: "Bulk update successful!" });
//       setSelectedIds([]);
//       fetchItems();
//     } catch (err) { setMsg({ type: "error", text: "Bulk failed" }); }
//     finally { setLoadingId(null); }
//   };

//   const toggleSelect = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

//   const statuses = [
//     { key: "to_warehouse", label: "To WH", color: "bg-amber-500" },
//     { key: "to_production", label: "Recvd WH", color: "bg-blue-600" },
//     { key: "dispatch", label: "Dispatch", color: "bg-green-600" },
//     { key: "rec_store_wh", label: "Rec Store From W.H", color: "bg-purple-600" },
//     { key: "store_to_customer", label: "Store To Cust", color: "bg-rose-600" }, // Added
//   ];

//   return (
//     <div className="space-y-4 animate-fadeIn relative">
//       {/* 1. Header Controls */}
//       <div className="flex flex-wrap justify-between items-center bg-white p-3 rounded-xl shadow-sm border border-gray-100 gap-3">
//         <div className="flex items-center gap-4">
//           <h2 className="text-xl font-bold text-slate-800 tracking-tight">Inventory Matrix</h2>
//           <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
//              <select value={selectedStore} onChange={(e) => setSelectedStore(e.target.value)} className="bg-white px-2 py-1 rounded text-[10px] font-bold border border-slate-200 outline-none">
//                <option value="all">All Stores</option>
//                {accessibleStores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
//              </select>
//              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-white px-1 py-1 rounded text-[10px] font-bold border border-slate-200 outline-none" />
//              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-white px-1 py-1 rounded text-[10px] font-bold border border-slate-200 outline-none" />
//           </div>

//           <button onClick={() => { setMultiSelectMode(!multiSelectMode); setSelectedIds([]); }} className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase transition-all shadow-sm ${multiSelectMode ? 'bg-rose-500 text-white' : 'bg-sky-600 text-white'}`}>
//             {multiSelectMode ? "✖ Exit Multi-Select" : "⚙ Option Multiple Select"}
//           </button>

//           {multiSelectMode && (
//             <div className="flex items-center gap-4 bg-slate-50 px-4 py-1.5 rounded-full border border-slate-200">
//               <label className="flex items-center gap-2 cursor-pointer">
//                 <input type="radio" name="filterMode" checked={filterType === 'store'} onChange={() => { setFilterType('store'); setSelectedIds([]); }} />
//                 <span className={`text-[11px] font-black uppercase ${filterType === 'store' ? 'text-sky-600' : 'text-slate-400'}`}>To Store</span>
//               </label>
//               <label className="flex items-center gap-2 cursor-pointer">
//                 <input type="radio" name="filterMode" checked={filterType === 'customer'} onChange={() => { setFilterType('customer'); setSelectedIds([]); }} />
//                 <span className={`text-[11px] font-black uppercase ${filterType === 'customer' ? 'text-rose-600' : 'text-slate-400'}`}>To Customer</span>
//               </label>
//             </div>
//           )}
//         </div>
//         {msg && <div className={`text-xs font-bold ${msg.type === 'error' ? 'text-red-500' : 'text-green-600'}`}>{msg.text}</div>}
//       </div>

//       {/* 2. Bulk Action Bar */}
//       {multiSelectMode && selectedIds.length > 0 && (
//         <div className="bg-slate-900 p-2 rounded-xl flex items-center justify-between shadow-2xl sticky top-2 z-10 border border-slate-700">
//           <span className="text-sky-400 text-[10px] font-black px-3 uppercase tracking-widest">{selectedIds.length} Selection Active</span>
//           <div className="flex gap-2">
//             {statuses.map(st => {
//               if (filterType === 'customer' && (st.key === "rec_store_wh" || st.key === "store_to_customer")) return null;
//               let bulkLabel = st.label;
//               if (st.key === "dispatch") bulkLabel = filterType === 'store' ? "Disp Store" : "Disp Cust";
//               return (
//                 <button key={st.key} onClick={() => handleBulkAction(st.key)} className={`${st.color} text-white text-[9px] font-black px-4 py-1.5 rounded-lg hover:scale-105 transition-transform`}>
//                   BULK {bulkLabel}
//                 </button>
//               );
//             })}
//           </div>
//         </div>
//       )}

//       {/* 3. Table Section */}
//       <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
//         <div className="overflow-x-auto">
//           <table className="w-full text-left whitespace-nowrap">
//             <thead className="bg-slate-50 border-b border-slate-100">
//               <tr className="text-[10px] uppercase text-slate-400 font-black">
//                 {multiSelectMode && <th className="p-4 w-10 text-center">Select</th>}
//                 <th className="p-4">Tracking</th>
//                 <th className="p-4">Article</th>
//                 <th className="p-4">Return To</th>
//                 <th className="p-4">Status & Remarks</th>
//                 <th className="p-4 text-center">Actions / View</th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-slate-50">
//               {currentItems.map((it) => (
//                 <tr key={it.id} className={`hover:bg-sky-50/30 transition-colors ${selectedIds.includes(it.id) ? 'bg-sky-50/60' : ''}`}>
//                   {multiSelectMode && (
//                     <td className="p-4 text-center">
//                       <input type="checkbox" checked={selectedIds.includes(it.id)} onChange={() => toggleSelect(it.id)} className="w-4 h-4 rounded text-sky-600 cursor-pointer" />
//                     </td>
//                   )}
//                   <td className="p-4 font-black text-sky-900 text-xs">{it.trackingId}</td>
//                   <td className="p-4 font-bold text-slate-700 text-[11px]">{it.articleNo} ({it.size})</td>
//                   <td className="p-4">
//                     <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${it.returnto === 'To Store' ? 'text-indigo-600 bg-indigo-50' : 'text-rose-600 bg-rose-50'}`}>{it.returnto}</span>
//                   </td>
//                   <td className="p-4">
//                     <div className="flex flex-col">
//                         <span className="font-black text-[9px] text-slate-500">{it.status}</span>
//                         {it.remarksWH && <span className="text-[9px] font-bold text-sky-600 italic">R: {it.remarksWH}</span>}
//                     </div>
//                   </td>
//                   <td className="p-4 text-center">
//                     <div className="flex justify-center items-center gap-1">
//                       {statuses.map((st) => {
//                         const state = getButtonStatus(it, st.key);
//                         if (state.hidden) return null;
                        
//                         let btnLbl = st.label;
//                         if (st.key === "dispatch") btnLbl = it.returnto === "To Store" ? "Disp Store" : "Disp Cust";
                        
//                         return (
//                           <button 
//                             key={st.key} 
//                             onClick={() => handleSingleAction(it.id, st.key)} 
//                             disabled={state.disabled || loadingId === it.id} 
//                             title={state.title}
//                             className={`px-2 py-1 rounded text-[9px] font-bold text-white transition-all shadow-sm ${state.disabled ? state.className : `${st.color} ${state.className}`}`}
//                           >
//                             {btnLbl}
//                           </button>
//                         );
//                       })}
//                       <button onClick={() => { setActiveRemarksId(activeRemarksId === it.id ? null : it.id); setTempRemarks({...tempRemarks, [it.id]: it.remarksWH || ""}); }} className={`p-1.5 rounded-full ${activeRemarksId === it.id ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-sky-200'}`}>💬</button>
//                       <button onClick={() => setViewingItem(it)} className="p-1.5 bg-slate-100 text-slate-600 rounded-full hover:bg-sky-100 shadow-sm">👁️</button>
//                     </div>

//                     {activeRemarksId === it.id && (
//                         <div className="mt-2 flex gap-1 animate-slideInRight">
//                             <input type="text" className="border border-sky-300 rounded px-2 py-1 text-[10px] w-full focus:ring-1 focus:ring-sky-500 outline-none" value={tempRemarks[it.id] || ""} onChange={(e) => setTempRemarks({...tempRemarks, [it.id]: e.target.value})} onKeyDown={(e) => e.key === 'Enter' && handleSaveRemarks(it.id)} />
//                             <button onClick={() => handleSaveRemarks(it.id)} className="bg-green-600 text-white px-2 py-1 rounded text-[9px] font-bold uppercase">Save</button>
//                         </div>
//                     )}
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       </div>

//       {/* 4. Modal Section */}
//       {viewingItem && (
//         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
//           <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
//             <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
//               <div>
//                 <h3 className="text-xl font-black">{viewingItem.trackingId}</h3>
//                 <p className="text-sky-400 text-xs font-bold uppercase">{viewingItem.status}</p>
//               </div>
//               <button onClick={() => setViewingItem(null)} className="bg-white/10 hover:bg-white/20 w-8 h-8 rounded-full">✕</button>
//             </div>
//             <div className="p-8 overflow-y-auto space-y-6">
//               <div className="grid grid-cols-2 gap-6">
//                 <DetailBox label="Article No" value={viewingItem.articleNo} />
//                 <DetailBox label="Return To" value={viewingItem.returnto} />
//                 <DetailBox label="WH Slip" value={viewingItem.courierSlip} />
//                 <DetailBox label="Final Slip" value={viewingItem.dispatchCourierSlip} />
//               </div>
//               <div className="border-t border-slate-100 pt-4">
//                 <h4 className="text-[10px] font-black text-slate-400 uppercase mb-2">Problem</h4>
//                 <p className="text-sm text-slate-700 italic">{viewingItem.problemDescription || "---"}</p>
//               </div>
//             </div>
//             <div className="p-4 bg-slate-50 border-t flex justify-end">
//               <button onClick={() => setViewingItem(null)} className="px-6 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold">Close</button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// function DetailBox({ label, value }) {
//   return (
//     <div>
//       <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter block">{label}</span>
//       <span className="text-sm font-bold text-slate-800">{value || "---"}</span>
//     </div>
//   );
// }

























// import React, { useState, useEffect, useMemo } from "react";
// import axios from "axios";

// export default function ItemList({ refresh, socket, user: propUser }) {
//   const [items, setItems] = useState([]);
//   const [allUsers, setAllUsers] = useState([]); // Store list ke liye
//   const [msg, setMsg] = useState(null);
//   const [loadingId, setLoadingId] = useState(null);
//   const [currentPage, setCurrentPage] = useState(1);
//   const itemsPerPage = 20;

//   // States for Multi-Select, Filters & Modal
//   const [multiSelectMode, setMultiSelectMode] = useState(false);
//   const [selectedIds, setSelectedIds] = useState([]);
//   const [filterType, setFilterType] = useState('store'); 
//   const [viewingItem, setViewingItem] = useState(null);
  
//   // ✅ Robust User Logic (Blank screen se bachne ke liye)
//   const user = useMemo(() => {
//     if (propUser && propUser.id) return propUser;
//     const saved = localStorage.getItem("user");
//     return saved ? JSON.parse(saved) : null;
//   }, [propUser]);

//   // ✅ New Filter States (MTD Logic)
//   const [selectedStore, setSelectedStore] = useState('all');
//   const today = new Date().toISOString().split('T')[0];
//   const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
//   const [startDate, setStartDate] = useState(firstDay); 
//   const [endDate, setEndDate] = useState(today);

//   // Remarks States
//   const [activeRemarksId, setActiveRemarksId] = useState(null);
//   const [tempRemarks, setTempRemarks] = useState({});

//   useEffect(() => {
//     if (msg) {
//       const timer = setTimeout(() => setMsg(null), 5000);
//       return () => clearTimeout(timer);
//     }
//   }, [msg]);

//   // ✅ Main Fetch Function (With Store & Date logic)
//   const fetchItems = async () => {
//     if (!user || !user.id) return; 

//     try {
//       const res = await axios.get('http://localhost:8080/api/items', {
//         params: { 
//           userId: user.id, 
//           type: user.type,
//           storeId: selectedStore,
//           startDate: startDate,
//           endDate: endDate
//         }
//       });
//       if (res.data.success) {
//         setItems(res.data.data || []);
//       }

//       // Dropdown ke liye users
//       const userRes = await axios.get("http://localhost:8080/api/users");
//       setAllUsers(userRes.data || []);
//     } catch (err) {
//       console.error("Frontend Fetch Error:", err);
//     }
//   };

//   useEffect(() => { 
//     fetchItems(); 
//   }, [refresh, user, selectedStore, startDate, endDate]);

//   // ✅ Accessible stores nikalne ki logic (Dashboard wali)
//   const accessibleStores = useMemo(() => {
//     if (user?.type === 'Admin') return allUsers;
//     const assignedIds = user?.assignedUsers ? user.assignedUsers.split(',').filter(id => id).map(id => parseInt(id)) : [];
//     const myIds = [user?.id, ...assignedIds];
//     return allUsers.filter(u => myIds.includes(u.id));
//   }, [allUsers, user]);

//   // Filtering based on Radio Selection
//   const filteredItems = useMemo(() => {
//     if (!multiSelectMode) return items;
//     const target = filterType === 'store' ? "To Store" : "To Customer";
//     return items.filter(it => it.returnto === target);
//   }, [items, multiSelectMode, filterType]);

//   const currentItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

//   const dispatchAction = async (id, action, courierSlipInput = null) => {
//     let courierSlip = courierSlipInput;
//     if (!courierSlip && (action === "to_warehouse" || action === "dispatch")) {
//       const label = action === "to_warehouse" ? "Warehouse Courier Slip" : "Final Dispatch Slip";
//       courierSlip = prompt(`Enter ${label} number:`);
//       if (!courierSlip) return;
//     }
//     return await axios.post(`http://localhost:8080/api/items/${id}/dispatch`, { action, courierSlip });
//   };

//   const handleSingleAction = async (id, action) => {
//     setLoadingId(id);
//     try {
//       const res = await dispatchAction(id, action);
//       if (res.data.success) {
//         setMsg({ type: "success", text: "Updated successfully!" });
//         if (socket) socket.emit("itemUpdated", res.data.data);
//         fetchItems();
//       }
//     } catch (err) { setMsg({ type: "error", text: "Update failed" }); }
//     finally { setLoadingId(null); }
//   };

//   const handleSaveRemarks = async (id) => {
//     const remarkValue = tempRemarks[id];
//     try {
//       setLoadingId(id);
//       const res = await axios.put(`http://localhost:8080/api/items/${id}`, { remarksWH: remarkValue });
//       if (res.data.success) {
//         setMsg({ type: "success", text: "Remarks saved!" });
//         setActiveRemarksId(null);
//         fetchItems();
//       }
//     } catch (err) {
//       setMsg({ type: "error", text: "Failed to save remarks" });
//     } finally {
//       setLoadingId(null);
//     }
//   };

//   const handleBulkAction = async (action) => {
//     if (selectedIds.length === 0) return alert("Please select items first!");
//     const toProcess = selectedIds.filter(id => {
//       const item = items.find(it => it.id === id);
//       return !checkStatusIsDone(item.status, action);
//     });

//     if (toProcess.length === 0) return alert("Selected items are already processed.");

//     let courierSlip = null;
//     if (action === "to_warehouse" || action === "dispatch") {
//       courierSlip = prompt(`Enter common Slip number:`);
//       if (!courierSlip) return;
//     }

//     setLoadingId("bulk");
//     try {
//       await Promise.all(toProcess.map(id => dispatchAction(id, action, courierSlip)));
//       setMsg({ type: "success", text: "Bulk update successful!" });
//       setSelectedIds([]);
//       fetchItems();
//     } catch (err) { setMsg({ type: "error", text: "Bulk failed" }); }
//     finally { setLoadingId(null); }
//   };

//   const checkStatusIsDone = (currentStatus, action) => {
//     const sequence = ["Received at Store", "Dispatched to Warehouse", "Received at Warehouse", "Dispatch", "Received at Store From WH"];
//     const currentIndex = sequence.indexOf(currentStatus);
//     let targetStatus = "";
//     if (action === "to_warehouse") targetStatus = "Dispatched to Warehouse";
//     if (action === "to_production") targetStatus = "Received at Warehouse";
//     if (action === "dispatch") targetStatus = "Dispatch";
//     if (action === "rec_store_wh") targetStatus = "Received at Store From WH";
//     return currentIndex >= sequence.indexOf(targetStatus);
//   };

//   const toggleSelect = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

//   const statuses = [
//     { key: "to_warehouse", label: "To WH", color: "bg-amber-500" },
//     { key: "to_production", label: "Recvd WH", color: "bg-blue-600" },
//     { key: "dispatch", label: "Dispatch", color: "bg-green-600" },
//     { key: "rec_store_wh", label: "Rec Store From W.H", color: "bg-purple-600" },
//   ];

//   return (
//     <div className="space-y-4 animate-fadeIn relative">
//       {/* 1. Header Controls with Original UI + NEW Filters */}
//       <div className="flex flex-wrap justify-between items-center bg-white p-3 rounded-xl shadow-sm border border-gray-100 gap-3">
//         <div className="flex items-center gap-4">
//           <h2 className="text-xl font-bold text-slate-800 tracking-tight">Inventory Matrix</h2>
          
//           {/* ✅ Addition: Store & Date Filters */}
//           <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
//              <select 
//                value={selectedStore} 
//                onChange={(e) => setSelectedStore(e.target.value)} 
//                className="bg-white px-2 py-1 rounded text-[10px] font-bold border border-slate-200 outline-none focus:ring-1 focus:ring-sky-500"
//              >
//                <option value="all">All Stores</option>
//                {accessibleStores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
//              </select>
//              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-white px-1 py-1 rounded text-[10px] font-bold border border-slate-200 outline-none" title="Start Date" />
//              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-white px-1 py-1 rounded text-[10px] font-bold border border-slate-200 outline-none" title="End Date" />
//           </div>

//           <button 
//             onClick={() => { setMultiSelectMode(!multiSelectMode); setSelectedIds([]); }}
//             className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase transition-all shadow-sm ${multiSelectMode ? 'bg-rose-500 text-white' : 'bg-sky-600 text-white'}`}
//           >
//             {multiSelectMode ? "✖ Exit Multi-Select" : "⚙ Option Multiple Select"}
//           </button>

//           {multiSelectMode && (
//             <div className="flex items-center gap-4 bg-slate-50 px-4 py-1.5 rounded-full border border-slate-200">
//               <label className="flex items-center gap-2 cursor-pointer">
//                 <input type="radio" name="filterMode" checked={filterType === 'store'} onChange={() => { setFilterType('store'); setSelectedIds([]); }} className="w-3.5 h-3.5" />
//                 <span className={`text-[11px] font-black uppercase ${filterType === 'store' ? 'text-sky-600' : 'text-slate-400'}`}>To Store</span>
//               </label>
//               <div className="w-px h-3 bg-slate-300"></div>
//               <label className="flex items-center gap-2 cursor-pointer">
//                 <input type="radio" name="filterMode" checked={filterType === 'customer'} onChange={() => { setFilterType('customer'); setSelectedIds([]); }} className="w-3.5 h-3.5" />
//                 <span className={`text-[11px] font-black uppercase ${filterType === 'customer' ? 'text-rose-600' : 'text-slate-400'}`}>To Customer</span>
//               </label>
//             </div>
//           )}
//         </div>
//         {msg && <div className="text-xs font-bold text-green-600">{msg.text}</div>}
//       </div>

//       {/* 2. Bulk Action Bar (Your Original) */}
//       {multiSelectMode && selectedIds.length > 0 && (
//         <div className="bg-slate-900 p-2 rounded-xl flex items-center justify-between shadow-2xl sticky top-2 z-10 border border-slate-700">
//           <span className="text-sky-400 text-[10px] font-black px-3 uppercase tracking-widest">{selectedIds.length} Selection Active</span>
//           <div className="flex gap-2">
//             {statuses.map(st => {
//               if (filterType === 'customer' && st.key === "rec_store_wh") return null;
//               let bulkLabel = st.label;
//               if (st.key === "dispatch") bulkLabel = filterType === 'store' ? "Disp Store" : "Disp Cust";
//               return (
//                 <button key={st.key} onClick={() => handleBulkAction(st.key)} className={`${st.color} text-white text-[9px] font-black px-4 py-1.5 rounded-lg shadow-lg hover:scale-105`}>
//                   BULK {bulkLabel}
//                 </button>
//               );
//             })}
//           </div>
//         </div>
//       )}

//       {/* 3. Table Section (Your Original UI) */}
//       <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
//         <div className="overflow-x-auto">
//           <table className="w-full text-left whitespace-nowrap">
//             <thead className="bg-slate-50 border-b border-slate-100">
//               <tr className="text-[10px] uppercase text-slate-400 font-black">
//                 {multiSelectMode && <th className="p-4 w-10 text-center">Select</th>}
//                 <th className="p-4">Tracking</th>
//                 <th className="p-4">Article</th>
//                 <th className="p-4">Return To</th>
//                 <th className="p-4">Status & Remarks</th>
//                 <th className="p-4 text-center">Actions / View</th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-slate-50">
//               {currentItems.map((it) => (
//                 <tr key={it.id} className={`hover:bg-sky-50/30 transition-colors ${selectedIds.includes(it.id) ? 'bg-sky-50/60' : ''}`}>
//                   {multiSelectMode && (
//                     <td className="p-4 text-center">
//                       <input type="checkbox" checked={selectedIds.includes(it.id)} onChange={() => toggleSelect(it.id)} className="w-4 h-4 rounded text-sky-600 cursor-pointer" />
//                     </td>
//                   )}
//                   <td className="p-4 font-black text-sky-900 text-xs">{it.trackingId}</td>
//                   <td className="p-4 font-bold text-slate-700 text-[11px]">{it.articleNo} ({it.size})</td>
//                   <td className="p-4">
//                     <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${it.returnto === 'To Store' ? 'text-indigo-600 bg-indigo-50' : 'text-rose-600 bg-rose-50'}`}>{it.returnto}</span>
//                   </td>
//                   <td className="p-4">
//                     <div className="flex flex-col">
//                         <span className="font-black text-[9px] text-slate-500">{it.status}</span>
//                         {it.remarksWH && <span className="text-[9px] font-bold text-sky-600 italic">R: {it.remarksWH}</span>}
//                     </div>
//                   </td>
//                   <td className="p-4 text-center">
//                     <div className="flex justify-center items-center gap-1">
//                       {statuses.map((st) => {
//                         if (it.returnto === "To Customer" && st.key === "rec_store_wh") return null;
//                         const isDone = checkStatusIsDone(it.status, st.key);
//                         const isDisabled = loadingId === it.id || isDone;
//                         let btnLbl = st.label;
//                         if (st.key === "dispatch") btnLbl = it.returnto === "To Store" ? "Disp Store" : "Disp Cust";
//                         return (
//                           <button key={st.key} onClick={() => handleSingleAction(it.id, st.key)} disabled={isDisabled} className={`px-2 py-1 rounded text-[9px] font-bold text-white ${isDisabled ? 'bg-slate-100 text-slate-300' : `${st.color} hover:brightness-110 shadow-sm`}`}>
//                             {btnLbl}
//                           </button>
//                         );
//                       })}
//                       <button 
//                         onClick={() => {
//                             setActiveRemarksId(activeRemarksId === it.id ? null : it.id);
//                             setTempRemarks({...tempRemarks, [it.id]: it.remarksWH || ""});
//                         }} 
//                         className={`p-1.5 rounded-full transition-colors ${activeRemarksId === it.id ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-sky-200'}`}
//                       >
//                         💬
//                       </button>
//                       <button onClick={() => setViewingItem(it)} className="ml-1 p-1.5 bg-slate-100 text-slate-600 rounded-full hover:bg-sky-100 shadow-sm transition-colors">👁️</button>
//                     </div>

//                     {activeRemarksId === it.id && (
//                         <div className="mt-2 flex gap-1 animate-slideInRight">
//                             <input 
//                                 type="text" 
//                                 className="border border-sky-300 rounded px-2 py-1 text-[10px] w-full focus:ring-1 focus:ring-sky-500 outline-none" 
//                                 placeholder="Warehouse Remarks..."
//                                 value={tempRemarks[it.id] || ""}
//                                 onChange={(e) => setTempRemarks({...tempRemarks, [it.id]: e.target.value})}
//                                 onKeyDown={(e) => e.key === 'Enter' && handleSaveRemarks(it.id)}
//                             />
//                             <button onClick={() => handleSaveRemarks(it.id)} className="bg-green-600 text-white px-2 py-1 rounded text-[9px] font-bold">SAVE</button>
//                         </div>
//                     )}
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//           {items.length === 0 && <div className="p-10 text-center text-slate-400 font-bold">No items found for the selected filters.</div>}
//         </div>
//       </div>

//       {/* 4. Modal Section (Your Original UI) */}
//       {viewingItem && (
//         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
//           <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
//             <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
//               <div>
//                 <h3 className="text-xl font-black tracking-tight">{viewingItem.trackingId}</h3>
//                 <p className="text-sky-400 text-xs font-bold uppercase tracking-widest">{viewingItem.status}</p>
//               </div>
//               <button onClick={() => setViewingItem(null)} className="bg-white/10 hover:bg-white/20 w-8 h-8 rounded-full flex items-center justify-center font-bold">✕</button>
//             </div>

//             <div className="p-8 overflow-y-auto space-y-6">
//               <div className="grid grid-cols-2 gap-6">
//                 <DetailBox label="Article No" value={viewingItem.articleNo} />
//                 <DetailBox label="Size / Color" value={`${viewingItem.size} / ${viewingItem.color}`} />
//                 <DetailBox label="Customer Name" value={viewingItem.customerName} />
//                 <DetailBox label="Mobile" value={viewingItem.customerMobile} />
//                 <DetailBox label="Invoice No" value={viewingItem.invoiceNo} />
//                 <DetailBox label="Warehouse" value={viewingItem.warehouse} />
//               </div>

//               <div className="border-t border-slate-100 pt-4">
//                 <h4 className="text-[10px] font-black text-slate-400 uppercase mb-2">Problem Description</h4>
//                 <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 italic">{viewingItem.problemDescription || "No description provided."}</p>
//               </div>

//               <div className="border-t border-sky-100 pt-4 bg-sky-50/50 p-2 rounded-lg">
//                 <h4 className="text-[10px] font-black text-sky-600 uppercase mb-1">Warehouse Remarks</h4>
//                 <p className="text-sm text-slate-800 font-bold">{viewingItem.remarksWH || "No remarks added yet."}</p>
//               </div>

//               <div className="grid grid-cols-3 gap-4 border-t border-slate-100 pt-4">
//                 <DetailBox label="Repair Charge" value={`Rs. ${viewingItem.repairChargeEstimate || 0}`} />
//                 <DetailBox label="Claim Amount" value={`Rs. ${viewingItem.claimAmount || 0}`} />
//                 <DetailBox label="Return To" value={viewingItem.returnto} />
//               </div>
//             </div>

//             <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
//               <button onClick={() => setViewingItem(null)} className="px-6 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold shadow-lg hover:bg-slate-800 transition-colors">Close Detail View</button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// function DetailBox({ label, value }) {
//   return (
//     <div>
//       <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter block">{label}</span>
//       <span className="text-sm font-bold text-slate-800">{value || "---"}</span>
//     </div>
//   );
// }













































// import React, { useState, useEffect, useMemo } from "react";
// import axios from "axios";

// export default function ItemList({ refresh, socket, user }) {
//   const [items, setItems] = useState([]);
//   const [msg, setMsg] = useState(null);
//   const [loadingId, setLoadingId] = useState(null);
//   const [currentPage, setCurrentPage] = useState(1);
//   const itemsPerPage = 20;

//   // States for Multi-Select, Filters & Modal
//   const [multiSelectMode, setMultiSelectMode] = useState(false);
//   const [selectedIds, setSelectedIds] = useState([]);
//   const [filterType, setFilterType] = useState('store'); // 'store' or 'customer'
//   const [viewingItem, setViewingItem] = useState(null);
  
//   // Remarks States
//   const [activeRemarksId, setActiveRemarksId] = useState(null);
//   const [tempRemarks, setTempRemarks] = useState({});

//   useEffect(() => {
//     if (msg) {
//       const timer = setTimeout(() => setMsg(null), 5000);
//       return () => clearTimeout(timer);
//     }
//   }, [msg]);

//   // ItemList.jsx mein fetch function aisa hona chahiye
// const fetchItems = async () => {
//   if (!currentUser) return; // User login nahi hai toh return ho jao

//   try {
//     const res = await axios.get('http://localhost:8080/api/items', {
//       params: { 
//         userId: currentUser.id, 
//         type: currentUser.type 
//       }
//     });
//     setItems(res.data.data);
//   } catch (err) {
//     console.error("Frontend Fetch Error:", err);
//   }
// };

//   useEffect(() => { fetchItems(); }, [refresh]);

//   // Filtering based on Radio Selection
//   const filteredItems = useMemo(() => {
//     if (!multiSelectMode) return items;
//     const target = filterType === 'store' ? "To Store" : "To Customer";
//     return items.filter(it => it.returnto === target);
//   }, [items, multiSelectMode, filterType]);

//   const currentItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

//   const dispatchAction = async (id, action, courierSlipInput = null) => {
//     let courierSlip = courierSlipInput;
//     if (!courierSlip && (action === "to_warehouse" || action === "dispatch")) {
//       const label = action === "to_warehouse" ? "Warehouse Courier Slip" : "Final Dispatch Slip";
//       courierSlip = prompt(`Enter ${label} number:`);
//       if (!courierSlip) return;
//     }
//     return await axios.post(`http://localhost:8080/api/items/${id}/dispatch`, { action, courierSlip });
//   };

//   const handleSingleAction = async (id, action) => {
//     setLoadingId(id);
//     try {
//       const res = await dispatchAction(id, action);
//       if (res.data.success) {
//         setMsg({ type: "success", text: "Updated successfully!" });
//         if (socket) socket.emit("itemUpdated", res.data.data);
//         fetchItems();
//       }
//     } catch (err) { setMsg({ type: "error", text: "Update failed" }); }
//     finally { setLoadingId(null); }
//   };

//   // ⭐ Logic: Save Remarks only
//   const handleSaveRemarks = async (id) => {
//     const remarkValue = tempRemarks[id];
//     try {
//       setLoadingId(id);
//       const res = await axios.put(`http://localhost:8080/api/items/${id}`, { remarksWH: remarkValue });
//       if (res.data.success) {
//         setMsg({ type: "success", text: "Remarks saved!" });
//         setActiveRemarksId(null);
//         fetchItems();
//       }
//     } catch (err) {
//       setMsg({ type: "error", text: "Failed to save remarks" });
//     } finally {
//       setLoadingId(null);
//     }
//   };

//   // ⭐ Restored Logic: Bulk alert for already processed items
//   const handleBulkAction = async (action) => {
//     if (selectedIds.length === 0) return alert("Please select items first!");
    
//     const alreadyDone = [];
//     const toProcess = [];

//     selectedIds.forEach(id => {
//       const item = items.find(it => it.id === id);
//       if (checkStatusIsDone(item.status, action)) {
//         alreadyDone.push(item.trackingId);
//       } else {
//         toProcess.push(id);
//       }
//     });

//     if (alreadyDone.length > 0) {
//       alert(`The following items are already processed for this action:\n${alreadyDone.join(", ")}`);
//     }

//     if (toProcess.length === 0) return;

//     let courierSlip = null;
//     if (action === "to_warehouse" || action === "dispatch") {
//       courierSlip = prompt(`Enter common Slip number:`);
//       if (!courierSlip) return;
//     }

//     setLoadingId("bulk");
//     try {
//       await Promise.all(toProcess.map(id => dispatchAction(id, action, courierSlip)));
//       setMsg({ type: "success", text: "Bulk update successful!" });
//       setSelectedIds([]);
//       fetchItems();
//     } catch (err) { setMsg({ type: "error", text: "Bulk failed" }); }
//     finally { setLoadingId(null); }
//   };

//   const checkStatusIsDone = (currentStatus, action) => {
//     const sequence = ["Received at Store", "Dispatched to Warehouse", "Received at Warehouse", "Dispatch", "Received at Store From WH"];
//     const currentIndex = sequence.indexOf(currentStatus);
//     let targetStatus = "";
//     if (action === "to_warehouse") targetStatus = "Dispatched to Warehouse";
//     if (action === "to_production") targetStatus = "Received at Warehouse";
//     if (action === "dispatch") targetStatus = "Dispatch";
//     if (action === "rec_store_wh") targetStatus = "Received at Store From WH";
//     return currentIndex >= sequence.indexOf(targetStatus);
//   };

//   const toggleSelect = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

//   const statuses = [
//     { key: "to_warehouse", label: "To WH", color: "bg-amber-500" },
//     { key: "to_production", label: "Recvd WH", color: "bg-blue-600" },
//     { key: "dispatch", label: "Dispatch", color: "bg-green-600" },
//     { key: "rec_store_wh", label: "Rec Store From W.H", color: "bg-purple-600" },
//   ];

//   return (
//     <div className="space-y-4 animate-fadeIn relative">
//       {/* 1. Header Controls with Radio Buttons */}
//       <div className="flex flex-wrap justify-between items-center bg-white p-3 rounded-xl shadow-sm border border-gray-100 gap-3">
//         <div className="flex items-center gap-4">
//           <h2 className="text-xl font-bold text-slate-800 tracking-tight">Inventory Matrix</h2>
//           <button 
//             onClick={() => { setMultiSelectMode(!multiSelectMode); setSelectedIds([]); }}
//             className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase transition-all shadow-sm ${multiSelectMode ? 'bg-rose-500 text-white' : 'bg-sky-600 text-white'}`}
//           >
//             {multiSelectMode ? "✖ Exit Multi-Select" : "⚙ Option Multiple Select"}
//           </button>

//           {multiSelectMode && (
//             <div className="flex items-center gap-4 bg-slate-50 px-4 py-1.5 rounded-full border border-slate-200">
//               <label className="flex items-center gap-2 cursor-pointer">
//                 <input type="radio" name="filterMode" checked={filterType === 'store'} onChange={() => { setFilterType('store'); setSelectedIds([]); }} className="w-3.5 h-3.5" />
//                 <span className={`text-[11px] font-black uppercase ${filterType === 'store' ? 'text-sky-600' : 'text-slate-400'}`}>To Store</span>
//               </label>
//               <div className="w-px h-3 bg-slate-300"></div>
//               <label className="flex items-center gap-2 cursor-pointer">
//                 <input type="radio" name="filterMode" checked={filterType === 'customer'} onChange={() => { setFilterType('customer'); setSelectedIds([]); }} className="w-3.5 h-3.5" />
//                 <span className={`text-[11px] font-black uppercase ${filterType === 'customer' ? 'text-rose-600' : 'text-slate-400'}`}>To Customer</span>
//               </label>
//             </div>
//           )}
//         </div>
//         {msg && <div className="text-xs font-bold text-green-600">{msg.text}</div>}
//       </div>

//       {/* 2. Bulk Action Bar */}
//       {multiSelectMode && selectedIds.length > 0 && (
//         <div className="bg-slate-900 p-2 rounded-xl flex items-center justify-between shadow-2xl sticky top-2 z-10 border border-slate-700">
//           <span className="text-sky-400 text-[10px] font-black px-3 uppercase tracking-widest">{selectedIds.length} Selection Active</span>
//           <div className="flex gap-2">
//             {statuses.map(st => {
//               if (filterType === 'customer' && st.key === "rec_store_wh") return null;
//               let bulkLabel = st.label;
//               if (st.key === "dispatch") bulkLabel = filterType === 'store' ? "Disp Store" : "Disp Cust";
//               return (
//                 <button key={st.key} onClick={() => handleBulkAction(st.key)} className={`${st.color} text-white text-[9px] font-black px-4 py-1.5 rounded-lg shadow-lg hover:scale-105`}>
//                   BULK {bulkLabel}
//                 </button>
//               );
//             })}
//           </div>
//         </div>
//       )}

//       {/* 3. Table Section */}
//       <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
//         <div className="overflow-x-auto">
//           <table className="w-full text-left whitespace-nowrap">
//             <thead className="bg-slate-50 border-b border-slate-100">
//               <tr className="text-[10px] uppercase text-slate-400 font-black">
//                 {multiSelectMode && <th className="p-4 w-10 text-center">Select</th>}
//                 <th className="p-4">Tracking</th>
//                 <th className="p-4">Article</th>
//                 <th className="p-4">Return To</th>
//                 <th className="p-4">Status & Remarks</th>
//                 <th className="p-4 text-center">Actions / View</th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-slate-50">
//               {currentItems.map((it) => (
//                 <tr key={it.id} className={`hover:bg-sky-50/30 transition-colors ${selectedIds.includes(it.id) ? 'bg-sky-50/60' : ''}`}>
//                   {multiSelectMode && (
//                     <td className="p-4 text-center">
//                       <input type="checkbox" checked={selectedIds.includes(it.id)} onChange={() => toggleSelect(it.id)} className="w-4 h-4 rounded text-sky-600 cursor-pointer" />
//                     </td>
//                   )}
//                   <td className="p-4 font-black text-sky-900 text-xs">{it.trackingId}</td>
//                   <td className="p-4 font-bold text-slate-700 text-[11px]">{it.articleNo} ({it.size})</td>
//                   <td className="p-4">
//                     <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${it.returnto === 'To Store' ? 'text-indigo-600 bg-indigo-50' : 'text-rose-600 bg-rose-50'}`}>{it.returnto}</span>
//                   </td>
//                   <td className="p-4">
//                     <div className="flex flex-col">
//                         <span className="font-black text-[9px] text-slate-500">{it.status}</span>
//                         {it.remarksWH && <span className="text-[9px] font-bold text-sky-600 italic">R: {it.remarksWH}</span>}
//                     </div>
//                   </td>
//                   <td className="p-4">
//                     <div className="flex justify-center items-center gap-1">
//                       {statuses.map((st) => {
//                         if (it.returnto === "To Customer" && st.key === "rec_store_wh") return null;
//                         const isDone = checkStatusIsDone(it.status, st.key);
//                         const isDisabled = loadingId === it.id || isDone;
//                         let btnLbl = st.label;
//                         if (st.key === "dispatch") btnLbl = it.returnto === "To Store" ? "Disp Store" : "Disp Cust";
//                         return (
//                           <button key={st.key} onClick={() => handleSingleAction(it.id, st.key)} disabled={isDisabled} className={`px-2 py-1 rounded text-[9px] font-bold text-white ${isDisabled ? 'bg-slate-100 text-slate-300' : `${st.color} hover:brightness-110 shadow-sm`}`}>
//                             {btnLbl}
//                           </button>
//                         );
//                       })}
//                       {/* ⭐ Remarks Logic */}
//                       <button 
//                         onClick={() => {
//                             setActiveRemarksId(activeRemarksId === it.id ? null : it.id);
//                             setTempRemarks({...tempRemarks, [it.id]: it.remarksWH || ""});
//                         }} 
//                         className={`p-1.5 rounded-full transition-colors ${activeRemarksId === it.id ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-sky-200'}`}
//                       >
//                         💬
//                       </button>
                      
//                       <button onClick={() => setViewingItem(it)} className="ml-1 p-1.5 bg-slate-100 text-slate-600 rounded-full hover:bg-sky-100 shadow-sm transition-colors">👁️</button>
//                     </div>

//                     {/* ⭐ Remarks Input Box */}
//                     {activeRemarksId === it.id && (
//                         <div className="mt-2 flex gap-1 animate-slideInRight">
//                             <input 
//                                 type="text" 
//                                 className="border border-sky-300 rounded px-2 py-1 text-[10px] w-full focus:ring-1 focus:ring-sky-500 outline-none" 
//                                 placeholder="Warehouse Remarks..."
//                                 value={tempRemarks[it.id] || ""}
//                                 onChange={(e) => setTempRemarks({...tempRemarks, [it.id]: e.target.value})}
//                                 onKeyDown={(e) => e.key === 'Enter' && handleSaveRemarks(it.id)}
//                             />
//                             <button 
//                                 onClick={() => handleSaveRemarks(it.id)}
//                                 className="bg-green-600 text-white px-2 py-1 rounded text-[9px] font-bold"
//                             >
//                                 SAVE
//                             </button>
//                         </div>
//                     )}
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       </div>

//       {/* 4. ⭐ COMPLETE VIEW DETAIL MODAL ⭐ */}
//       {viewingItem && (
//         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
//           <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-modalIn">
//             {/* Modal Header */}
//             <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
//               <div>
//                 <h3 className="text-xl font-black tracking-tight">{viewingItem.trackingId}</h3>
//                 <p className="text-sky-400 text-xs font-bold uppercase tracking-widest">{viewingItem.status}</p>
//               </div>
//               <button onClick={() => setViewingItem(null)} className="bg-white/10 hover:bg-white/20 w-8 h-8 rounded-full flex items-center justify-center font-bold">✕</button>
//             </div>

//             {/* Modal Content */}
//             <div className="p-8 overflow-y-auto space-y-6">
//               <div className="grid grid-cols-2 gap-6">
//                 <DetailBox label="Article No" value={viewingItem.articleNo} />
//                 <DetailBox label="Size / Color" value={`${viewingItem.size} / ${viewingItem.color}`} />
//                 <DetailBox label="Customer Name" value={viewingItem.customerName} />
//                 <DetailBox label="Mobile" value={viewingItem.customerMobile} />
//                 <DetailBox label="Invoice No" value={viewingItem.invoiceNo} />
//                 <DetailBox label="Warehouse" value={viewingItem.warehouse} />
//               </div>

//               <div className="border-t border-slate-100 pt-4">
//                 <h4 className="text-[10px] font-black text-slate-400 uppercase mb-2">Problem Description</h4>
//                 <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 italic">{viewingItem.problemDescription || "No description provided."}</p>
//               </div>

//               {/* ⭐ WH Remarks in Modal */}
//               <div className="border-t border-sky-100 pt-4 bg-sky-50/50 p-2 rounded-lg">
//                 <h4 className="text-[10px] font-black text-sky-600 uppercase mb-1">Warehouse Remarks</h4>
//                 <p className="text-sm text-slate-800 font-bold">{viewingItem.remarksWH || "No remarks added yet."}</p>
//               </div>

//               <div className="grid grid-cols-3 gap-4 border-t border-slate-100 pt-4">
//                 <DetailBox label="Repair Charge" value={`Rs. ${viewingItem.repairChargeEstimate || 0}`} />
//                 <DetailBox label="Claim Amount" value={`Rs. ${viewingItem.claimAmount || 0}`} />
//                 <DetailBox label="Return To" value={viewingItem.returnto} />
//               </div>

//               {/* Slips and Dates Section */}
//               <div className="bg-sky-50 p-4 rounded-2xl grid grid-cols-2 gap-4 border border-sky-100">
//                 <div>
//                   <h4 className="text-[9px] font-black text-sky-600 uppercase">WH Courier Slip</h4>
//                   <p className="text-sm font-bold text-sky-900">{viewingItem.courierSlip || "N/A"}</p>
//                 </div>
//                 <div>
//                   <h4 className="text-[9px] font-black text-sky-600 uppercase">Final Dispatch Slip</h4>
//                   <p className="text-sm font-bold text-sky-900">{viewingItem.dispatchCourierSlip || "N/A"}</p>
//                 </div>
//               </div>
//             </div>

//             {/* Modal Footer */}
//             <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
//               <button onClick={() => setViewingItem(null)} className="px-6 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold shadow-lg hover:bg-slate-800 transition-colors">Close Detail View</button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// // ⭐ Helper Component for Modal
// function DetailBox({ label, value }) {
//   return (
//     <div>
//       <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter block">{label}</span>
//       <span className="text-sm font-bold text-slate-800">{value || "---"}</span>
//     </div>
//   );
// }
































// import React, { useState, useEffect, useMemo } from "react";
// import axios from "axios";

// export default function ItemList({ refresh, socket, user }) {
//   const [items, setItems] = useState([]);
//   const [msg, setMsg] = useState(null);
//   const [loadingId, setLoadingId] = useState(null);
//   const [currentPage, setCurrentPage] = useState(1);
//   const itemsPerPage = 20;

//   // States for Multi-Select, Filters & Modal
//   const [multiSelectMode, setMultiSelectMode] = useState(false);
//   const [selectedIds, setSelectedIds] = useState([]);
//   const [filterType, setFilterType] = useState('store'); // 'store' or 'customer'
//   const [viewingItem, setViewingItem] = useState(null);

//   useEffect(() => {
//     if (msg) {
//       const timer = setTimeout(() => setMsg(null), 5000);
//       return () => clearTimeout(timer);
//     }
//   }, [msg]);

//   const fetchItems = async () => {
//     try {
//       const res = await axios.get("http://localhost:8080/api/items");
//       setItems(res.data.data);
//     } catch (err) { console.error("Error:", err); }
//   };

//   useEffect(() => { fetchItems(); }, [refresh]);

//   // Filtering based on Radio Selection
//   const filteredItems = useMemo(() => {
//     if (!multiSelectMode) return items;
//     const target = filterType === 'store' ? "To Store" : "To Customer";
//     return items.filter(it => it.returnto === target);
//   }, [items, multiSelectMode, filterType]);

//   const currentItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

//   const dispatchAction = async (id, action, courierSlipInput = null) => {
//     let courierSlip = courierSlipInput;
//     if (!courierSlip && (action === "to_warehouse" || action === "dispatch")) {
//       const label = action === "to_warehouse" ? "Warehouse Courier Slip" : "Final Dispatch Slip";
//       courierSlip = prompt(`Enter ${label} number:`);
//       if (!courierSlip) return;
//     }
//     return await axios.post(`http://localhost:8080/api/items/${id}/dispatch`, { action, courierSlip });
//   };

//   const handleSingleAction = async (id, action) => {
//     setLoadingId(id);
//     try {
//       const res = await dispatchAction(id, action);
//       if (res.data.success) {
//         setMsg({ type: "success", text: "Updated successfully!" });
//         if (socket) socket.emit("itemUpdated", res.data.data);
//         fetchItems();
//       }
//     } catch (err) { setMsg({ type: "error", text: "Update failed" }); }
//     finally { setLoadingId(null); }
//   };

//   const handleBulkAction = async (action) => {
//     if (selectedIds.length === 0) return alert("Please select items first!");
//     let courierSlip = null;
//     if (action === "to_warehouse" || action === "dispatch") {
//       courierSlip = prompt(`Enter common Slip number:`);
//       if (!courierSlip) return;
//     }
//     setLoadingId("bulk");
//     try {
//       await Promise.all(selectedIds.map(id => dispatchAction(id, action, courierSlip)));
//       setMsg({ type: "success", text: "Bulk update successful!" });
//       fetchItems();
//     } catch (err) { setMsg({ type: "error", text: "Bulk failed" }); }
//     finally { setLoadingId(null); }
//   };

//   const checkStatusIsDone = (currentStatus, action) => {
//     const sequence = ["Received at Store", "Dispatched to Warehouse", "Received at Warehouse", "Dispatch", "Received at Store From WH"];
//     const currentIndex = sequence.indexOf(currentStatus);
//     let targetStatus = "";
//     if (action === "to_warehouse") targetStatus = "Dispatched to Warehouse";
//     if (action === "to_production") targetStatus = "Received at Warehouse";
//     if (action === "dispatch") targetStatus = "Dispatch";
//     if (action === "rec_store_wh") targetStatus = "Received at Store From WH";
//     return currentIndex >= sequence.indexOf(targetStatus);
//   };

//   const toggleSelect = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

//   const statuses = [
//     { key: "to_warehouse", label: "To WH", color: "bg-amber-500" },
//     { key: "to_production", label: "Recvd WH", color: "bg-blue-600" },
//     { key: "dispatch", label: "Dispatch", color: "bg-green-600" },
//     { key: "rec_store_wh", label: "Rec Store From W.H", color: "bg-purple-600" },
//   ];

//   return (
//     <div className="space-y-4 animate-fadeIn relative">
//       {/* 1. Header Controls with Radio Buttons */}
//       <div className="flex flex-wrap justify-between items-center bg-white p-3 rounded-xl shadow-sm border border-gray-100 gap-3">
//         <div className="flex items-center gap-4">
//           <h2 className="text-xl font-bold text-slate-800 tracking-tight">Inventory Matrix</h2>
//           <button 
//             onClick={() => { setMultiSelectMode(!multiSelectMode); setSelectedIds([]); }}
//             className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase transition-all shadow-sm ${multiSelectMode ? 'bg-rose-500 text-white' : 'bg-sky-600 text-white'}`}
//           >
//             {multiSelectMode ? "✖ Exit Multi-Select" : "⚙ Option Multiple Select"}
//           </button>

//           {multiSelectMode && (
//             <div className="flex items-center gap-4 bg-slate-50 px-4 py-1.5 rounded-full border border-slate-200">
//               <label className="flex items-center gap-2 cursor-pointer">
//                 <input type="radio" name="filterMode" checked={filterType === 'store'} onChange={() => { setFilterType('store'); setSelectedIds([]); }} className="w-3.5 h-3.5" />
//                 <span className={`text-[11px] font-black uppercase ${filterType === 'store' ? 'text-sky-600' : 'text-slate-400'}`}>To Store</span>
//               </label>
//               <div className="w-px h-3 bg-slate-300"></div>
//               <label className="flex items-center gap-2 cursor-pointer">
//                 <input type="radio" name="filterMode" checked={filterType === 'customer'} onChange={() => { setFilterType('customer'); setSelectedIds([]); }} className="w-3.5 h-3.5" />
//                 <span className={`text-[11px] font-black uppercase ${filterType === 'customer' ? 'text-rose-600' : 'text-slate-400'}`}>To Customer</span>
//               </label>
//             </div>
//           )}
//         </div>
//         {msg && <div className="text-xs font-bold text-green-600">{msg.text}</div>}
//       </div>

//       {/* 2. Bulk Action Bar */}
//       {multiSelectMode && selectedIds.length > 0 && (
//         <div className="bg-slate-900 p-2 rounded-xl flex items-center justify-between shadow-2xl sticky top-2 z-10 border border-slate-700">
//           <span className="text-sky-400 text-[10px] font-black px-3 uppercase tracking-widest">{selectedIds.length} Selection Active</span>
//           <div className="flex gap-2">
//             {statuses.map(st => {
//               if (filterType === 'customer' && st.key === "rec_store_wh") return null;
//               let bulkLabel = st.label;
//               if (st.key === "dispatch") bulkLabel = filterType === 'store' ? "Disp Store" : "Disp Cust";
//               return (
//                 <button key={st.key} onClick={() => handleBulkAction(st.key)} className={`${st.color} text-white text-[9px] font-black px-4 py-1.5 rounded-lg shadow-lg hover:scale-105`}>
//                   BULK {bulkLabel}
//                 </button>
//               );
//             })}
//           </div>
//         </div>
//       )}

//       {/* 3. Table Section */}
//       <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
//         <div className="overflow-x-auto">
//           <table className="w-full text-left whitespace-nowrap">
//             <thead className="bg-slate-50 border-b border-slate-100">
//               <tr className="text-[10px] uppercase text-slate-400 font-black">
//                 {multiSelectMode && <th className="p-4 w-10 text-center">Select</th>}
//                 <th className="p-4">Tracking</th>
//                 <th className="p-4">Article</th>
//                 <th className="p-4">Return To</th>
//                 <th className="p-4">Status</th>
//                 <th className="p-4 text-center">Actions / View</th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-slate-50">
//               {currentItems.map((it) => (
//                 <tr key={it.id} className={`hover:bg-sky-50/30 transition-colors ${selectedIds.includes(it.id) ? 'bg-sky-50/60' : ''}`}>
//                   {multiSelectMode && (
//                     <td className="p-4 text-center">
//                       <input type="checkbox" checked={selectedIds.includes(it.id)} onChange={() => toggleSelect(it.id)} className="w-4 h-4 rounded text-sky-600 cursor-pointer" />
//                     </td>
//                   )}
//                   <td className="p-4 font-black text-sky-900 text-xs">{it.trackingId}</td>
//                   <td className="p-4 font-bold text-slate-700 text-[11px]">{it.articleNo} ({it.size})</td>
//                   <td className="p-4">
//                     <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${it.returnto === 'To Store' ? 'text-indigo-600 bg-indigo-50' : 'text-rose-600 bg-rose-50'}`}>{it.returnto}</span>
//                   </td>
//                   <td className="p-4 font-black text-[9px] text-slate-500">{it.status}</td>
//                   <td className="p-4">
//                     <div className="flex justify-center items-center gap-1">
//                       {statuses.map((st) => {
//                         if (it.returnto === "To Customer" && st.key === "rec_store_wh") return null;
//                         const isDone = checkStatusIsDone(it.status, st.key);
//                         const isDisabled = loadingId === it.id || isDone;
//                         let btnLbl = st.label;
//                         if (st.key === "dispatch") btnLbl = it.returnto === "To Store" ? "Disp Store" : "Disp Cust";
//                         return (
//                           <button key={st.key} onClick={() => handleSingleAction(it.id, st.key)} disabled={isDisabled} className={`px-2 py-1 rounded text-[9px] font-bold text-white ${isDisabled ? 'bg-slate-100 text-slate-300' : `${st.color} hover:brightness-110 shadow-sm`}`}>
//                             {btnLbl}
//                           </button>
//                         );
//                       })}
//                       <button onClick={() => setViewingItem(it)} className="ml-2 p-1.5 bg-slate-100 text-slate-600 rounded-full hover:bg-sky-100 shadow-sm transition-colors">👁️</button>
//                     </div>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       </div>

//       {/* 4. ⭐ COMPLETE VIEW DETAIL MODAL ⭐ */}
//       {viewingItem && (
//         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
//           <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-modalIn">
//             {/* Modal Header */}
//             <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
//               <div>
//                 <h3 className="text-xl font-black tracking-tight">{viewingItem.trackingId}</h3>
//                 <p className="text-sky-400 text-xs font-bold uppercase tracking-widest">{viewingItem.status}</p>
//               </div>
//               <button onClick={() => setViewingItem(null)} className="bg-white/10 hover:bg-white/20 w-8 h-8 rounded-full flex items-center justify-center font-bold">✕</button>
//             </div>

//             {/* Modal Content */}
//             <div className="p-8 overflow-y-auto space-y-6">
//               <div className="grid grid-cols-2 gap-6">
//                 <DetailBox label="Article No" value={viewingItem.articleNo} />
//                 <DetailBox label="Size / Color" value={`${viewingItem.size} / ${viewingItem.color}`} />
//                 <DetailBox label="Customer Name" value={viewingItem.customerName} />
//                 <DetailBox label="Mobile" value={viewingItem.customerMobile} />
//                 <DetailBox label="Invoice No" value={viewingItem.invoiceNo} />
//                 <DetailBox label="Warehouse" value={viewingItem.warehouse} />
//               </div>

//               <div className="border-t border-slate-100 pt-4">
//                 <h4 className="text-[10px] font-black text-slate-400 uppercase mb-2">Problem Description</h4>
//                 <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 italic">{viewingItem.problemDescription || "No description provided."}</p>
//               </div>

//               <div className="grid grid-cols-3 gap-4 border-t border-slate-100 pt-4">
//                 <DetailBox label="Repair Charge" value={`Rs. ${viewingItem.repairChargeEstimate || 0}`} />
//                 <DetailBox label="Claim Amount" value={`Rs. ${viewingItem.claimAmount || 0}`} />
//                 <DetailBox label="Return To" value={viewingItem.returnto} />
//               </div>

//               {/* Slips and Dates Section */}
//               <div className="bg-sky-50 p-4 rounded-2xl grid grid-cols-2 gap-4 border border-sky-100">
//                 <div>
//                   <h4 className="text-[9px] font-black text-sky-600 uppercase">WH Courier Slip</h4>
//                   <p className="text-sm font-bold text-sky-900">{viewingItem.courierSlip || "N/A"}</p>
//                 </div>
//                 <div>
//                   <h4 className="text-[9px] font-black text-sky-600 uppercase">Final Dispatch Slip</h4>
//                   <p className="text-sm font-bold text-sky-900">{viewingItem.dispatchCourierSlip || "N/A"}</p>
//                 </div>
//               </div>
//             </div>

//             {/* Modal Footer */}
//             <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
//               <button onClick={() => setViewingItem(null)} className="px-6 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold shadow-lg hover:bg-slate-800 transition-colors">Close Detail View</button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// // ⭐ Helper Component for Modal
// function DetailBox({ label, value }) {
//   return (
//     <div>
//       <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter block">{label}</span>
//       <span className="text-sm font-bold text-slate-800">{value || "---"}</span>
//     </div>
//   );
// }



















// import React, { useState, useEffect, useMemo } from "react";
// import axios from "axios";

// export default function ItemList({ refresh, socket, user }) {
//   const [items, setItems] = useState([]);
//   const [msg, setMsg] = useState(null);
//   const [loadingId, setLoadingId] = useState(null);
//   const [currentPage, setCurrentPage] = useState(1);
//   const itemsPerPage = 20;

//   // States for Multi-Select & Filters
//   const [multiSelectMode, setMultiSelectMode] = useState(false);
//   const [selectedIds, setSelectedIds] = useState([]);
//   const [filterToStore, setFilterToStore] = useState(true);
//   const [filterToCustomer, setFilterToCustomer] = useState(true);

//   // ⭐ State for View Modal
//   const [viewingItem, setViewingItem] = useState(null);

//   useEffect(() => {
//     if (msg) {
//       const timer = setTimeout(() => setMsg(null), 5000);
//       return () => clearTimeout(timer);
//     }
//   }, [msg]);

//   const fetchItems = async () => {
//     try {
//       const res = await axios.get("http://localhost:8080/api/items");
//       setItems(res.data.data);
//     } catch (err) { console.error("Error:", err); }
//   };

//   useEffect(() => { fetchItems(); }, [refresh]);

//   const filteredItems = useMemo(() => {
//     if (!multiSelectMode) return items;
//     return items.filter(it => {
//       if (filterToStore && it.returnto === "To Store") return true;
//       if (filterToCustomer && it.returnto === "To Customer") return true;
//       return false;
//     });
//   }, [items, multiSelectMode, filterToStore, filterToCustomer]);

//   const currentItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

//   const dispatchAction = async (id, action, courierSlipInput = null) => {
//     let courierSlip = courierSlipInput;
//     if (!courierSlip && (action === "to_warehouse" || action === "dispatch")) {
//       const label = action === "to_warehouse" ? "Warehouse Courier Slip" : "Final Dispatch Slip";
//       courierSlip = prompt(`Enter ${label} number:`);
//       if (!courierSlip) return;
//     }
//     return await axios.post(`http://localhost:8080/api/items/${id}/dispatch`, { action, courierSlip });
//   };

//   const handleSingleAction = async (id, action) => {
//     setLoadingId(id);
//     try {
//       const res = await dispatchAction(id, action);
//       if (res.data.success) {
//         setMsg({ type: "success", text: "Updated successfully!" });
//         if (socket) socket.emit("itemUpdated", res.data.data);
//         fetchItems();
//       }
//     } catch (err) { setMsg({ type: "error", text: "Update failed" }); }
//     finally { setLoadingId(null); }
//   };

//   // ⭐ FIXED: Bulk Action now persists selection
//   const handleBulkAction = async (action) => {
//     if (selectedIds.length === 0) return alert("Please select items first!");
//     let courierSlip = null;
//     if (action === "to_warehouse" || action === "dispatch") {
//       courierSlip = prompt(`Enter common Slip number:`);
//       if (!courierSlip) return;
//     }

//     const alreadyDone = [];
//     const toProcess = [];

//     selectedIds.forEach(id => {
//       const item = items.find(it => it.id === id);
//       if (checkStatusIsDone(item.status, action)) alreadyDone.push(item.trackingId);
//       else toProcess.push(id);
//     });

//     if (alreadyDone.length > 0) alert(`Skipped (Already Done): ${alreadyDone.join(", ")}`);
//     if (toProcess.length === 0) return;

//     setLoadingId("bulk");
//     try {
//       await Promise.all(toProcess.map(id => dispatchAction(id, action, courierSlip)));
//       setMsg({ type: "success", text: `${toProcess.length} items updated! Mode & Selection kept active.` });
//       // Note: We are NOT clearing selectedIds or setting multiSelectMode to false anymore
//       fetchItems();
//     } catch (err) { setMsg({ type: "error", text: "Bulk failed" }); }
//     finally { setLoadingId(null); }
//   };

//   const checkStatusIsDone = (currentStatus, action) => {
//     const sequence = ["Received at Store", "Dispatched to Warehouse", "Received at Warehouse", "Dispatch", "Received at Store From WH"];
//     const currentIndex = sequence.indexOf(currentStatus);
//     let targetStatus = "";
//     if (action === "to_warehouse") targetStatus = "Dispatched to Warehouse";
//     if (action === "to_production") targetStatus = "Received at Warehouse";
//     if (action === "dispatch") targetStatus = "Dispatch";
//     if (action === "rec_store_wh") targetStatus = "Received at Store From WH";
//     return currentIndex >= sequence.indexOf(targetStatus);
//   };

//   const toggleSelect = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

//   const statuses = [
//     { key: "to_warehouse", label: "To WH", color: "bg-amber-500" },
//     { key: "to_production", label: "Recvd WH", color: "bg-blue-600" },
//     { key: "dispatch", label: "Dispatch", color: "bg-green-600" },
//     { key: "rec_store_wh", label: "Rec Store From W.H", color: "bg-purple-600" },
//   ];

//   return (
//     <div className="space-y-4 animate-fadeIn relative">
//       {/* Header Controls */}
//       <div className="flex flex-wrap justify-between items-center bg-white p-3 rounded-xl shadow-sm border border-gray-100 gap-3">
//         <div className="flex items-center gap-4">
//           <h2 className="text-xl font-bold text-slate-800 tracking-tight">Inventory Matrix</h2>
//           <button 
//             onClick={() => { setMultiSelectMode(!multiSelectMode); setSelectedIds([]); }}
//             className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase transition-all shadow-sm ${multiSelectMode ? 'bg-rose-500 text-white' : 'bg-sky-600 text-white'}`}
//           >
//             {multiSelectMode ? "✖ Exit Multi-Select" : "⚙ Option Multiple Select"}
//           </button>

//           {multiSelectMode && (
//             <div className="flex items-center gap-3 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 animate-slideInRight">
//               <label className="flex items-center gap-1.5 cursor-pointer"><input type="checkbox" checked={filterToStore} onChange={() => setFilterToStore(!filterToStore)} className="w-3.5 h-3.5" /><span className="text-[11px] font-bold">To Store</span></label>
//               <label className="flex items-center gap-1.5 cursor-pointer"><input type="checkbox" checked={filterToCustomer} onChange={() => setFilterToCustomer(!filterToCustomer)} className="w-3.5 h-3.5" /><span className="text-[11px] font-bold">To Customer</span></label>
//             </div>
//           )}
//         </div>
//         {msg && <div className="text-xs font-bold text-green-600">{msg.text}</div>}
//       </div>

//       {/* Bulk Action Bar */}
//       {multiSelectMode && selectedIds.length > 0 && (
//         <div className="bg-slate-900 p-2 rounded-xl flex items-center justify-between shadow-2xl sticky top-2 z-10 border border-slate-700">
//           <span className="text-sky-400 text-[10px] font-black px-3 uppercase tracking-widest">{selectedIds.length} Selection Active</span>
//           <div className="flex gap-2">
//             {statuses.map(st => (
//               <button key={st.key} onClick={() => handleBulkAction(st.key)} className={`${st.color} text-white text-[9px] font-black px-4 py-1.5 rounded-lg shadow-lg hover:scale-105`}>
//                 BULK {st.label}
//               </button>
//             ))}
//           </div>
//         </div>
//       )}

//       {/* Table */}
//       <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
//         <div className="overflow-x-auto">
//           <table className="w-full text-left whitespace-nowrap">
//             <thead className="bg-slate-50 border-b border-slate-100">
//               <tr className="text-[10px] uppercase text-slate-400 font-black">
//                 {multiSelectMode && <th className="p-4 w-10 text-center">Select</th>}
//                 <th className="p-4">Tracking</th>
//                 <th className="p-4">Article</th>
//                 <th className="p-4">Return To</th>
//                 <th className="p-4">Status</th>
//                 <th className="p-4 text-center">Actions / View</th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-slate-50">
//               {currentItems.map((it) => (
//                 <tr key={it.id} className={`hover:bg-sky-50/30 transition-colors ${selectedIds.includes(it.id) ? 'bg-sky-50/60' : ''}`}>
//                   {multiSelectMode && (
//                     <td className="p-4 text-center">
//                       <input type="checkbox" checked={selectedIds.includes(it.id)} onChange={() => toggleSelect(it.id)} className="w-4 h-4 rounded text-sky-600 cursor-pointer" />
//                     </td>
//                   )}
//                   <td className="p-4 font-black text-sky-900 text-xs">{it.trackingId}</td>
//                   <td className="p-4 font-bold text-slate-700 text-[11px]">{it.articleNo} (Sz: {it.size})</td>
//                   <td className="p-4">
//                     <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${it.returnto === 'To Store' ? 'text-indigo-600 bg-indigo-50' : 'text-rose-600 bg-rose-50'}`}>{it.returnto}</span>
//                   </td>
//                   <td className="p-4 font-black text-[9px] text-slate-500">{it.status}</td>
//                   <td className="p-4">
//                     <div className="flex justify-center items-center gap-1">
//                       {statuses.map((st) => {
//                         const isDone = checkStatusIsDone(it.status, st.key);
//                         const isDisabled = loadingId === it.id || isDone;
//                         let btnLbl = st.label;
//                         if (st.key === "dispatch") btnLbl = it.returnto === "To Store" ? "Disp Store" : "Disp Cust";
//                         return (
//                           <button key={st.key} onClick={() => handleSingleAction(it.id, st.key)} disabled={isDisabled} className={`px-2 py-1 rounded text-[9px] font-bold text-white ${isDisabled ? 'bg-slate-100 text-slate-300' : `${st.color} hover:brightness-110 shadow-sm`}`}>{btnLbl}</button>
//                         );
//                       })}
//                       {/* ⭐ View Icon */}
//                       <button 
//                         onClick={() => setViewingItem(it)}
//                         className="ml-2 p-1.5 bg-slate-100 text-slate-600 rounded-full hover:bg-sky-100 hover:text-sky-600 transition-colors shadow-sm"
//                         title="View Details"
//                       >
//                         👁️
//                       </button>
//                     </div>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       </div>

//       {/* ⭐ VIEW DETAIL MODAL ⭐ */}
//       {viewingItem && (
//         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
//           <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-modalIn">
//             {/* Modal Header */}
//             <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
//               <div>
//                 <h3 className="text-xl font-black tracking-tight">{viewingItem.trackingId}</h3>
//                 <p className="text-sky-400 text-xs font-bold uppercase tracking-widest">{viewingItem.status}</p>
//               </div>
//               <button onClick={() => setViewingItem(null)} className="bg-white/10 hover:bg-white/20 w-8 h-8 rounded-full flex items-center justify-center font-bold">✕</button>
//             </div>

//             {/* Modal Content */}
//             <div className="p-8 overflow-y-auto custom-scrollbar space-y-6">
//               <div className="grid grid-cols-2 gap-6">
//                 <DetailBox label="Article No" value={viewingItem.articleNo} />
//                 <DetailBox label="Size / Color" value={`${viewingItem.size} / ${viewingItem.color}`} />
//                 <DetailBox label="Customer Name" value={viewingItem.customerName} />
//                 <DetailBox label="Mobile" value={viewingItem.customerMobile} />
//                 <DetailBox label="Invoice No" value={viewingItem.invoiceNo} />
//                 <DetailBox label="Warehouse" value={viewingItem.warehouse} />
//               </div>

//               <div className="border-t border-slate-100 pt-4">
//                 <h4 className="text-[10px] font-black text-slate-400 uppercase mb-2">Problem Description</h4>
//                 <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 italic">{viewingItem.problemDescription || "No description provided."}</p>
//               </div>

//               <div className="grid grid-cols-3 gap-4 border-t border-slate-100 pt-4">
//                 <DetailBox label="Repair Charge" value={`Rs. ${viewingItem.repairChargeEstimate || 0}`} />
//                 <DetailBox label="Claim Amount" value={`Rs. ${viewingItem.claimAmount || 0}`} />
//                 <DetailBox label="Return To" value={viewingItem.returnto} />
//               </div>

//               {/* Slips and Dates Section */}
//               <div className="bg-sky-50 p-4 rounded-2xl grid grid-cols-2 gap-4 border border-sky-100">
//                 <div>
//                   <h4 className="text-[9px] font-black text-sky-600 uppercase">WH Courier Slip</h4>
//                   <p className="text-sm font-bold text-sky-900">{viewingItem.courierSlip || "N/A"}</p>
//                 </div>
//                 <div>
//                   <h4 className="text-[9px] font-black text-sky-600 uppercase">Final Dispatch Slip</h4>
//                   <p className="text-sm font-bold text-sky-900">{viewingItem.dispatchCourierSlip || "N/A"}</p>
//                 </div>
//               </div>
//             </div>

//             {/* Modal Footer */}
//             <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
//               <button onClick={() => setViewingItem(null)} className="px-6 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold shadow-lg hover:bg-slate-800">Close Detail View</button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// // ⭐ Helper Component for Modal
// function DetailBox({ label, value }) {
//   return (
//     <div>
//       <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter block">{label}</span>
//       <span className="text-sm font-bold text-slate-800">{value || "---"}</span>
//     </div>
//   );
// }

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
    const [searchTerm, setSearchTerm] = useState(''); // For Article, Color, Size
    const [searchTrackingId, setSearchTrackingId] = useState('');
    const [searchStoreName, setSearchStoreName] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedFilterCourier, setSelectedFilterCourier] = useState('all');
    const [viewingItem, setViewingItem] = useState(null);
    const [actionFilter, setActionFilter] = useState('all'); 
    const [selectedStore, setSelectedStore] = useState('all');
    const [selectedItemType, setSelectedItemType] = useState('all');
    const [searchInvoice, setSearchInvoice] = useState('');
    
    const today = new Date().toISOString().split('T')[0];
    const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const [startDate, setStartDate] = useState(firstDay); 
    const [endDate, setEndDate] = useState(today);

    const [activeRemarksId, setActiveRemarksId] = useState(null);
    const [tempRemarks, setTempRemarks] = useState({});
    const [couriersList, setCouriersList] = useState([]);
    const [isCourierModalOpen, setIsCourierModalOpen] = useState(false);
    const [selectedItemId, setSelectedItemId] = useState(null);
    const [selectedAction, setSelectedAction] = useState(null);
    const [selectedCourierName, setSelectedCourierName] = useState('');
    const [enteredSlip, setEnteredSlip] = useState('');

    const user = useMemo(() => {
      if (propUser && propUser.id) return propUser;
      const saved = localStorage.getItem("user");
      return saved ? JSON.parse(saved) : null;
    }, [propUser]);

    const uniqueCategories = useMemo(() => {
     const cats = new Map();
       items.forEach(it => {
         if (it.categoryId && it.category?.name) {
           cats.set(it.categoryId, it.category.name);
         }
    });
  return Array.from(cats.entries()).map(([id, name]) => ({ id, name }));
}, [items]);

    useEffect(() => {
      if (user?.type === 'Store') setActionFilter('dispatchable');
      else if (user?.type === 'Warehouse') setActionFilter('receivable');
      else setActionFilter('all');
    }, [user?.type]);
    useEffect(() => {
    const fetchCouriers = async () => {
      try {
        const res = await axios.get('/couriers/active'); 
        setCouriersList(res.data || []);
      } catch (err) {
        console.error("Failed to fetch couriers", err);
      }
    };
    fetchCouriers();
  }, []);
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

    useEffect(() => {
      if (user?.type === 'Store' && accessibleStores.length > 0 && selectedStore === 'all') {
        setSelectedStore(accessibleStores[0].id);
      }
    }, [user, accessibleStores, selectedStore]);

const filteredItems = useMemo(() => {
  let result = items;

  if (actionFilter !== 'all') {
    result = result.filter(it => {
      const s = it.status;
      const isLocal = it.type?.toLowerCase().trim() === 'local repair';
      const isClaim = it.type?.toLowerCase().trim() === 'claim'; 
      const isToCustomer = it.returnto === 'To Customer'; // Yeh check add kiya

      if (user?.type === 'Store') {
        if (actionFilter === 'dispatchable') return s === "Received at Store" || s === "Received at Store From WH";
        
        if (actionFilter === 'receivable') {
          if (s === "Dispatch" && isToCustomer) return false; 
          return s === "Dispatch" || (isLocal && s === "Dispatched to Warehouse");
        }
      }
      
      if (user?.type === 'Warehouse') {
        // Fix 1: Warehouse ko Claim ab Dispatchable list mein show nahi hoga
        if (actionFilter === 'dispatchable') return s === "Received at Warehouse" && !isClaim;
        if (actionFilter === 'receivable') return s === "Dispatched to Warehouse";
      }
      
      return false; 
    });
  }

  // ⭐ Safe Filter for Courier Name
  if (selectedFilterCourier !== 'all') {
    result = result.filter(it => {
      if (selectedFilterCourier === 'none') {
        return !it.courierName;
      }
      return it.courierName?.toLowerCase() === selectedFilterCourier.toLowerCase();
    });
  }

  // 2. Search by Tracking ID
  if (searchTrackingId.trim()) {
    result = result.filter(it => 
      it.trackingId?.toLowerCase().includes(searchTrackingId.toLowerCase().trim())
    );
  }

  // 3. Search by Article, Color, or Size
  if (searchTerm.trim()) {
    const term = searchTerm.toLowerCase().trim();
    result = result.filter(it => 
      it.articleNo?.toLowerCase().includes(term) || 
      it.color?.toLowerCase().includes(term) || 
      it.size?.toLowerCase().includes(term)
    );
  }

  // 4. Search by Store Name Text
  if (searchStoreName.trim()) {
    const storeTerm = searchStoreName.toLowerCase().trim();
    result = result.filter(it => {
      const nameFromUserList = allUsers.find(u => u.id === it.storeId)?.name || "";
      const nameFromItemObj = it.store?.name || "";
      return nameFromUserList.toLowerCase().includes(storeTerm) || nameFromItemObj.toLowerCase().includes(storeTerm);
    });
  }

  // 5. Filter by Category ID
  if (selectedCategory !== 'all') {
    result = result.filter(it => it.categoryId == selectedCategory);
  }

  // 6. Filter by Item Type
  if (selectedItemType !== 'all') {
    result = result.filter(it => it.type?.toLowerCase().trim() === selectedItemType.toLowerCase());
  }

  // 7. WHLHR aur WHFSD Local Repair Filter
  if (user?.type === 'Warehouse') {
    result = result.filter(it => {
      const isLocal = it.type?.toLowerCase().trim() === 'local repair';
      const storeName = (allUsers.find(u => u.id === it.storeId)?.name || it.store?.name || "").toLowerCase();
      if (isLocal && (storeName.includes('whlhr') || storeName.includes('whfsd'))) {
        return false; 
      }
      return true;
    });
  }
  if (searchInvoice.trim()) {
    const invTerm = searchInvoice.toLowerCase().trim();
    result = result.filter(it => 
      // Note: Agar aapke database mein field ka naam 'invoice' ya 'invoiceNumber' hai, toh usko yahan update kar lein. Main standard 'invoiceNo' use kar raha hoon.
      it.invoiceNo?.toLowerCase().includes(invTerm) || 
      it.invoice?.toLowerCase().includes(invTerm)
    );
  }

  return result;
}, [items, actionFilter, user, searchTrackingId, searchTerm, searchStoreName, selectedCategory, allUsers, selectedFilterCourier, selectedItemType, searchInvoice]);
const pendingCounts = useMemo(() => {
  let dispatchable = 0;
  let receivable = 0;
  
  items.forEach(it => {
      const s = it.status;
      const isLocal = it.type?.toLowerCase().trim() === 'local repair';
      const isClaim = it.type?.toLowerCase().trim() === 'claim';
      const isToCustomer = it.returnto === 'To Customer'; // Yeh check count ke liye bhi lazmi hai
      
      if (user?.type === 'Store') {
          if (s === "Received at Store" || s === "Received at Store From WH") dispatchable++;
          
          if ((s === "Dispatch" && !isToCustomer) || (isLocal && s === "Dispatched to Warehouse")) receivable++;
          
      } else if (user?.type === 'Warehouse') {
          // Claim ko count mat karo dispatchable mein
          if (s === "Received at Warehouse" && !isClaim) dispatchable++;
          if (s === "Dispatched to Warehouse") receivable++;
      }
  });
  
  return { dispatchable, receivable };
}, [items, user]);

    const getButtonStatus = (item, btnKey) => {
      const status = item.status, returnto = item.returnto, type = item.type, userType = user?.type;
        if (userType === "User") {
    return { 
      isDone: false, 
      disabled: true, 
      className: "bg-slate-100 text-slate-300 opacity-60 cursor-not-allowed pointer-events-none" 
    };
  }
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

      // For claim (To WH aur Recvd WH)
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
    const handleSingleAction = async (id, action) => {
      const item = items.find(i => i.id === id);
      const isLocal = item?.type?.toLowerCase().trim() === 'local repair';
      
      // Agar action to_warehouse ya dispatch hai aur local repair nahi hai, toh Modal open karo
      if (!isLocal && (action === "to_warehouse" || action === "dispatch")) {
        setSelectedItemId(id);
        setSelectedAction(action);
        setSelectedCourierName('');
        setEnteredSlip('');
        setIsCourierModalOpen(true);
        return; // Yahan ruk jao, baaki kaam Modal ka Save button karega
      }

      // Agar modal ki zaroorat nahi hai (jaise receive karna ya local repair), toh direct API call
      setLoadingId(id);
      try {
        const res = await axios.post(`/items/${id}/dispatch`, { action });
        if (res?.data.success) {
          setMsg({ type: "success", text: "Updated!" });
          fetchItems();
        }
      } catch (err) { setMsg({ type: "error", text: "Failed" }); }
      finally { setLoadingId(null); }
    };

    const submitCourierModal = async () => {
      if (!selectedCourierName) return alert("Please select a Courier!");
      if (!enteredSlip) return alert("Please enter Courier Slip No!");

      setIsCourierModalOpen(false);
      setLoadingId(selectedItemId);

      // ⭐ Dynamic Payload: Action ke mutabik alag keys banayenge
      const payload = { action: selectedAction };

      if (selectedAction === "to_warehouse") {
        // Store to WH
        payload.courierName = selectedCourierName;
        payload.courierSlip = enteredSlip;
      } else if (selectedAction === "dispatch") {
        // WH to Store/Customer
        payload.dispatchCourierName = selectedCourierName;
        payload.dispatchCourierSlip = enteredSlip;
      }

      try {
        const res = await axios.post(`/items/${selectedItemId}/dispatch`, payload);
        if (res?.data.success) {
          setMsg({ type: "success", text: "Updated!" });
          fetchItems();
        }
      } catch (err) { 
        setMsg({ type: "error", text: "Failed" }); 
      }
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
      const item = items.find(i => i.id === id);
  
      if (user?.type !== 'Warehouse' || item?.remarksWH) {
        alert("Permission denied or remarks are already locked!");
        return;
      }
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
                {user?.type!== 'Store' && <option value="all">All Stores</option>}
                {accessibleStores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="text-[10px] font-bold" />
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="text-[10px] font-bold" />
            </div>
          </div>
          {msg && <div className={`text-xs font-bold ${msg.type === 'error' ? 'text-red-500' : 'text-green-600'}`}>{msg.text}</div>}
        </div>

        <div className="flex gap-2">
            <button onClick={() => setActionFilter('dispatchable')} className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${actionFilter === 'dispatchable' ? 'bg-indigo-600 text-white shadow-lg scale-105' : 'bg-white border text-slate-400'}`}>📤 SENDING (DISPATCHABLES) ({pendingCounts.dispatchable})</button>
            <button onClick={() => setActionFilter('receivable')} className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${actionFilter === 'receivable' ? 'bg-emerald-600 text-white shadow-lg scale-105' : 'bg-white border text-slate-400'}`}>📥 RECEIVING (RECEIVABLES) ({pendingCounts.receivable})</button>
            <button onClick={() => setActionFilter('all')} className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${actionFilter === 'all' ? 'bg-slate-800 text-white shadow-lg scale-105' : 'bg-white border text-slate-400'}`}>ALL HISTORY</button>
        </div>
<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
  
<div>
  <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Search Invoice</label>
  <input 
    type="text" 
    value={searchInvoice} 
    onChange={(e) => setSearchInvoice(e.target.value)} 
    placeholder="e.g. INV-1024" 
    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold outline-none focus:border-indigo-500" 
  />
</div>
  
  <div>
    <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Search Tracking ID</label>
    <input type="text" value={searchTrackingId} onChange={(e) => setSearchTrackingId(e.target.value)} placeholder="e.g. TRX-1234" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold outline-none focus:border-indigo-500" />
  </div>
  <div>
    <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Article / Color / Size</label>
    <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Type Article, Color or Size..." className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold outline-none focus:border-indigo-500" />
  </div>
  <div>
    <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Search Store Name</label>
    <input type="text" value={searchStoreName} onChange={(e) => setSearchStoreName(e.target.value)} placeholder="Type Store Name..." className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold outline-none focus:border-indigo-500" />
  </div>
  <div>
    <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Filter Category</label>
    <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold outline-none focus:border-indigo-500">
      <option value="all">All Categories</option>
      {uniqueCategories.map(cat => (
        <option key={cat.id} value={cat.id}>{cat.name}</option>
      ))}
    </select>
  </div>
  
  <div>
  <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Filter Type</label>
  <select 
    value={selectedItemType} 
    onChange={(e) => setSelectedItemType(e.target.value)} 
    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold outline-none focus:border-indigo-500"
  >
    <option value="all">All Types</option>
    <option value="Repair">Repair</option>
    <option value="Local Repair">Local Repair</option>
    <option value="Claim">Claim</option>
  </select>
</div>

  <div>
    <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Filter Courier</label>
    <select 
      value={selectedFilterCourier} 
      onChange={(e) => setSelectedFilterCourier(e.target.value)} 
      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold outline-none focus:border-indigo-500"
    >
      <option value="all">All Couriers (Show All)</option>
      <option value="none">Without Courier (Old Records)</option>
      {couriersList.map(c => (
        <option key={c.id} value={c.name}>{c.name}</option>
      ))}
    </select>
  </div>
</div>
        <ItemTable 
          user={user}
          items={filteredItems}
          multiSelectMode={false}
          selectedIds={[]}
          toggleSelect={() => {}}
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
{/* COURIER SLIP MODAL */}
        {isCourierModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md border border-slate-200">
              <h3 className="text-lg font-black text-slate-800 mb-4 border-b pb-2">Dispatch Details</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Select Courier *</label>
                  <select 
                    value={selectedCourierName} 
                    onChange={(e) => setSelectedCourierName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm font-semibold outline-none focus:border-indigo-500"
                  >
                    <option value="">-- Choose Courier --</option>
                    {couriersList.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Courier Slip / Tracking No *</label>
                  <input 
                    type="text" 
                    value={enteredSlip} 
                    onChange={(e) => setEnteredSlip(e.target.value)}
                    placeholder="Enter slip number..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm font-semibold outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button 
                  onClick={() => setIsCourierModalOpen(false)} 
                  className="px-4 py-2 bg-slate-100 text-slate-600 font-bold rounded-lg hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
                <button 
                  onClick={submitCourierModal} 
                  className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg shadow hover:bg-indigo-700 transition"
                >
                  Save & Dispatch
                </button>
              </div>
            </div>
          </div>
        )}

        <ItemViewModal item={viewingItem} onClose={() => setViewingItem(null)} />
      </div>
    );
  }
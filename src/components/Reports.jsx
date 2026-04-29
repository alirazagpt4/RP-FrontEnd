import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import * as XLSX from 'xlsx';
import { FaFileExcel, FaFilter, FaSyncAlt } from 'react-icons/fa';

export default function AuditReport({ user: propUser }) {
  const [items, setItems] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const [sort1, setSort1] = useState({ key: 'createdAt', direction: 'desc' });
  const [sort2, setSort2] = useState({ key: 'createdAt', direction: 'desc' });

  const today = new Date().toISOString().split('T')[0];
  const initialFilters = { startDate: today, endDate: today, storeId: 'all', type: 'all', warehouse: 'all' };
  const [filters, setFilters] = useState(initialFilters);

  const [colFilters, setColFilters] = useState({
    trackingId: { val: "", op: "contains" },
    status: { val: "all", op: "is" },
    articleNo: { val: "", op: "contains" }
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [itemsRes, usersRes] = await Promise.all([
        axios.get('http://194.163.190.100:8080/api/items/report', { params: { ...filters } }),
        axios.get('http://194.163.190.100:8080/api/users')
      ]);
      setItems(itemsRes.data?.data || []);
      setAllUsers(usersRes.data || []);
    } catch (err) { 
      console.error("Fetch Error:", err);
      setItems([]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const getStoreName = (id) => {
    const s = (allUsers || []).find(u => String(u.id || u._id) === String(id));
    return s ? s.name : `ID: ${id}`;
  };

  const fmtDate = (date) => {
    if (!date) return "-";
    const d = new Date(date);
    return isNaN(d.getTime()) ? "-" : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-');
  };

  const processData = (dataList, sortConfig) => {
    if (!dataList) return [];
    let temp = [...dataList];
    
    // ================= SECURITY LOGIC BASED ON USER MODEL =================
    const userRole = propUser?.type;
    const currentUserId = String(propUser?.id || propUser?._id);

    if (userRole === 'Store') {
      temp = temp.filter(it => String(it.storeId) === currentUserId);
    } 
    else if (userRole === 'User') {
      // ✅ assignedUsers is a comma-separated string in your model
      const assignedIds = propUser?.assignedUsers 
        ? propUser.assignedUsers.split(',').map(id => id.trim()) 
        : [];
      temp = temp.filter(it => assignedIds.includes(String(it.storeId)));
    }
    else if (userRole === 'Warehouse') {
      // ✅ Warehouse sees only their entries
      temp = temp.filter(it => it.warehouse === propUser?.shortName);
    }
    // ======================================================================

    if (filters.warehouse !== 'all') temp = temp.filter(it => it.warehouse === filters.warehouse);
    if (filters.type !== 'all') temp = temp.filter(it => it.type === filters.type);

    temp = temp.filter(item => {
      return Object.keys(colFilters).every(key => {
        const { val, op } = colFilters[key];
        if (!val || val === "all") return true;
        const itemVal = String(item[key] || "").toLowerCase();
        return op === "is" ? itemVal === val.toLowerCase() : itemVal.includes(val.toLowerCase());
      });
    });

    temp.sort((a, b) => {
      let aVal = a[sortConfig.key] || '';
      let bVal = b[sortConfig.key] || '';
      const dateKeys = ['createdAt', 'dispatchToWarehouseDate', 'dispatchToProductionDate', 'receivedAtStoreDate', 'storeToCustomer', 'dispatch'];
      if (dateKeys.includes(sortConfig.key)) {
        aVal = aVal ? new Date(aVal).getTime() : 0;
        bVal = bVal ? new Date(bVal).getTime() : 0;
      }
      return sortConfig.direction === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
    });
    return temp;
  };

  const table1Data = useMemo(() => 
    processData(items.filter(it => it.status === "Received at Store" || it.status === "Received at Store From WH"), sort1), 
    [items, colFilters, sort1, filters, propUser, allUsers]
  );

  const table2Data = useMemo(() => processData(items, sort2), [items, colFilters, sort2, filters, propUser, allUsers]);

  const downloadExcel = (data, baseName) => {
    const now = new Date().toISOString().split('T')[0];
    const exportData = data.map(it => ({
      "Store Name": getStoreName(it.storeId),
      "Tracking ID": it.trackingId,
      "Article": `${it.articleNo}-${it.color}-${it.size}`,
      "Status": it.status,
      "Type": it.type,
      "Warehouse": it.warehouse,
      "Return To": it.returnto,
      "Claim Amount": it.claimAmount || 0,
      "Rec at Store": fmtDate(it.createdAt),
      "To WH": fmtDate(it.dispatchToWarehouseDate),
      "Rec @ WH": fmtDate(it.dispatchToProductionDate),
      "Disp Cust/Store": fmtDate(it.dispatch),
      "To Customer": fmtDate(it.storeToCustomer || it.dispatch)
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Audit");
    XLSX.writeFile(workbook, `${baseName}_${now}.xlsx`);
  };

  const getVisibleStores = () => {
    const allStores = allUsers.filter(u => u.type === 'Store');
    if (propUser?.type === 'Admin') return allStores;
    if (propUser?.type === 'Store') {
      return allStores.filter(u => String(u.id || u._id) === String(propUser.id || propUser._id));
    }
    if (propUser?.type === 'User') {
      const assignedIds = propUser?.assignedUsers 
        ? propUser.assignedUsers.split(',').map(id => id.trim()) 
        : [];
      return allStores.filter(u => assignedIds.includes(String(u.id || u._id)));
    }
    return [];
  };

  return (
    <div className="p-4 bg-slate-50 min-h-screen font-sans text-slate-900">
      
      <div className="bg-white p-4 rounded shadow border-t-4 border-blue-600 mb-6 flex flex-wrap items-end gap-3">
        {/* Store Dropdown Security */}
        <div className="flex flex-col min-w-[140px]">
          <label className="text-[10px] font-black mb-1 uppercase">Store Name</label>
          <select className="border-2 p-1.5 rounded font-bold text-xs" value={filters.storeId} onChange={e => setFilters({...filters, storeId: e.target.value})}>
            <option value="all">ALL STORES</option>
            {getVisibleStores().map(u => <option key={u.id || u._id} value={u.id || u._id}>{u.name}</option>)}
          </select>
        </div>

        <div className="flex flex-col min-w-[120px]">
          <label className="text-[10px] font-black mb-1 uppercase">Type</label>
          <select className="border-2 p-1.5 rounded font-bold text-xs" value={filters.type} onChange={e => setFilters({...filters, type: e.target.value})}>
            <option value="all">ALL TYPES</option>
            <option value="Repair">Repair</option><option value="Claim">Claim</option><option value="Local Repair">Local Repair</option>
          </select>
        </div>

        {/* Warehouse Dropdown Security */}
        <div className="flex flex-col min-w-[120px]">
          <label className="text-[10px] font-black mb-1 uppercase">Warehouse</label>
          <select className="border-2 p-1.5 rounded font-bold text-xs" value={filters.warehouse} onChange={e => setFilters({...filters, warehouse: e.target.value})}>
            <option value="all">ALL WAREHOUSES</option>
            {propUser?.type === 'Warehouse' ? (
               <option value={propUser.shortName}>{propUser.shortName}</option>
            ) : (
              <>
                <option value="WHLHR">WHLHR</option>
                <option value="WHFSD">WHFSD</option>
                <option value="LOCAL">LOCAL</option>
              </>
            )}
          </select>
        </div>

        <div className="flex flex-col"><label className="text-[10px] font-black mb-1">START</label><input type="date" className="border-2 p-1 rounded font-bold text-xs" value={filters.startDate} onChange={e => setFilters({...filters, startDate: e.target.value})} /></div>
        <div className="flex flex-col"><label className="text-[10px] font-black mb-1">END</label><input type="date" className="border-2 p-1 rounded font-bold text-xs" value={filters.endDate} onChange={e => setFilters({...filters, endDate: e.target.value})} /></div>
        
        <div className="flex gap-2">
          <button onClick={fetchData} className="bg-blue-700 text-white px-4 py-2 rounded font-black hover:bg-blue-800 flex items-center gap-2 shadow-md"><FaFilter /> APPLY FILTERS</button>
          <button onClick={() => setFilters(initialFilters)} className="bg-slate-400 text-white px-4 py-2 rounded font-black hover:bg-slate-500 flex items-center gap-2 shadow-md"><FaSyncAlt /> CLEAR</button>
        </div>
      </div>

      {/* Table 1 */}
      <div className="mb-8">
        <div className="bg-slate-800 text-white p-2 flex justify-between items-center rounded-t shadow-md">
          <span className="font-black uppercase tracking-widest text-[11px]">1. Stuck Items (At Store Level)</span>
          <button onClick={() => downloadExcel(table1Data, "Stuck_At_Store")} className="bg-emerald-600 px-3 py-1.5 rounded text-[10px] font-black flex items-center gap-1 hover:bg-emerald-700"><FaFileExcel /> DOWNLOAD EXCEL</button>
        </div>
        <div className="bg-white border-2 border-slate-300 overflow-auto" style={{ height: '4in' }}>
          <table className="w-full text-[11px] text-left border-collapse">
            <thead className="sticky top-0 bg-slate-200 z-10 border-b-2 border-slate-400 font-black uppercase text-slate-700">
              <tr>
                <SortTh label="Tracking ID" col="trackingId" sort={sort1} onSort={setSort1} />
                <SortTh label="Store" col="storeId" sort={sort1} onSort={setSort1} />
                <SortTh label="Article" col="articleNo" sort={sort1} onSort={setSort1} />
                <SortTh label="Status" col="status" sort={sort1} onSort={setSort1} />
                <SortTh label="Warehouse" col="warehouse" sort={sort1} onSort={setSort1} />
                <SortTh label="Rec Date" col="createdAt" sort={sort1} onSort={setSort1} />
              </tr>
            </thead>
            <tbody>
              {table1Data.map(it => (
                <tr key={it.id || it._id} className="border-b hover:bg-blue-50 font-bold whitespace-nowrap">
                  <td className="p-2 border-r text-blue-800 font-black">{it.trackingId}</td>
                  <td className="p-2 border-r uppercase">{getStoreName(it.storeId)}</td>
                  <td className="p-2 border-r">{it.articleNo}-{it.color}-{it.size}</td>
                  <td className="p-2 border-r text-orange-600 font-black uppercase">{it.status}</td>
                  <td className="p-2 border-r font-black">{it.warehouse}</td>
                  <td className="p-2 font-black text-slate-900">{fmtDate(it.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Table 2 */}
      <div className="bg-white border-2 border-slate-300 rounded overflow-hidden shadow-lg">
        <div className="bg-blue-900 text-white p-2 flex justify-between items-center">
          <span className="font-black uppercase tracking-widest text-[11px]">2. Master Lifecycle Tracking & Timeline</span>
          <button onClick={() => downloadExcel(table2Data, "Master_Report")} className="bg-emerald-600 px-3 py-1.5 rounded text-[10px] font-black flex items-center gap-1 hover:bg-emerald-700"><FaFileExcel /> DOWNLOAD EXCEL</button>
        </div>
        <div className="overflow-auto" style={{ height: '4in' }}>
          <table className="w-full text-[11px] text-left border-collapse">
            <thead className="sticky top-0 bg-slate-200 z-20 border-b-2 border-slate-400 font-black uppercase text-slate-800">
              <tr>
                <SortTh label="Store Name" col="storeId" sort={sort2} onSort={setSort2} />
                <SortTh label="Tracking ID" col="trackingId" sort={sort2} onSort={setSort2} />
                <SortTh label="Article" col="articleNo" sort={sort2} onSort={setSort2} />
                <SortTh label="Status" col="status" sort={sort2} onSort={setSort2} />
                <SortTh label="Type" col="type" sort={sort2} onSort={setSort2} />
                <SortTh label="WH" col="warehouse" sort={sort2} onSort={setSort2} />
                <SortTh label="Return To" col="returnto" sort={sort2} onSort={setSort2} />
                <SortTh label="Amount" col="claimAmount" sort={sort2} onSort={setSort2} />
                <SortTh label="Rec Store" col="createdAt" sort={sort2} onSort={setSort2} bg="bg-slate-300" />
                <SortTh label="To WH" col="dispatchToWarehouseDate" sort={sort2} onSort={setSort2} bg="bg-slate-300" />
                <SortTh label="Rec WH" col="dispatchToProductionDate" sort={sort2} onSort={setSort2} bg="bg-slate-300" />
                <SortTh label="Disp Cust/Store" col="dispatch" sort={sort2} onSort={setSort2} bg="bg-slate-300" />
                <SortTh label="To Customer" col="storeToCustomer" sort={sort2} onSort={setSort2} bg="bg-slate-300" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {table2Data.map(it => (
                <tr key={it.id || it._id} className="hover:bg-blue-50 whitespace-nowrap font-bold text-slate-800">
                  <td className="p-2 border-r uppercase">{getStoreName(it.storeId)}</td>
                  <td className="p-2 border-r text-blue-700 font-black">{it.trackingId}</td>
                  <td className="p-2 border-r">{it.articleNo}-{it.color}-{it.size}</td>
                  <td className="p-2 border-r uppercase text-orange-600 font-black text-[10px]">{it.status}</td>
                  <td className="p-2 border-r">{it.type}</td>
                  <td className="p-2 border-r text-purple-700 font-black">{it.warehouse}</td>
                  <td className="p-2 border-r text-emerald-700 font-black">{it.returnto}</td>
                  <td className="p-2 border-r font-black">{it.claimAmount || 0}</td>
                  <td className="p-2 border-r text-center font-black text-slate-900">{fmtDate(it.createdAt)}</td>
                  <td className="p-2 border-r text-center font-black text-slate-900">{fmtDate(it.dispatchToWarehouseDate)}</td>
                  <td className="p-2 border-r text-center font-black text-slate-900">{fmtDate(it.dispatchToProductionDate)}</td>
                  <td className="p-2 border-r text-center font-black text-purple-800">{fmtDate(it.dispatch)}</td>
                  <td className="p-2 text-center font-black text-emerald-900">{fmtDate(it.storeToCustomer || it.dispatch)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SortTh({ label, col, sort, onSort, bg="bg-slate-200" }) {
  const active = sort.key === col;
  return (
    <th className={`p-2 border-r border-slate-300 cursor-pointer ${bg} hover:bg-slate-400 transition-colors`} onClick={() => onSort({key: col, direction: active && sort.direction === 'asc' ? 'desc' : 'asc'})}>
      <div className="flex justify-between items-center gap-1">{label} <span className="text-[9px]">{active ? (sort.direction === 'asc' ? '▲' : '▼') : '↕'}</span></div>
    </th>
  );
}







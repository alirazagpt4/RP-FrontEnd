import React from 'react';
import axios from '../axiosConfig';

export default function ItemTable({ 
  user, items, multiSelectMode, selectedIds, toggleSelect, statuses, 
  getButtonStatus, handleSingleAction, loadingId, setViewingItem, 
  activeRemarksId, setActiveRemarksId, tempRemarks, setTempRemarks, 
  handleSaveRemarks, actionFilter 
}) {
  return (
    <div className="bg-white rounded-2xl shadow-xl border border-black overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left whitespace-nowrap border-collapse">
          <thead className="bg-slate-50">
            <tr className="text-[10px] uppercase text-slate-600 font-black">
              {multiSelectMode && <th className="p-4 w-10 text-center border border-black">Select</th>}
              <th className="p-4 border border-black">Tracking</th>
              <th className="p-4 border border-black">Invoice No</th> {/* 🆕 Invoice Column Header */}
              <th className="p-4 border border-black">Store Dispatch Date</th>
              <th className="p-4 border border-black">Store Courier Info</th>
              <th className="p-4 border border-black">Store</th>
              <th className="p-4 border border-black">Article</th>
              <th className="p-4 border border-black">Return To</th>
              <th className="p-4 border border-black">Status & Remarks</th>
              <th className="p-4 text-center border border-black">Actions / View</th>
            </tr>
          </thead>
          <tbody>
            {!Array.isArray(items) || items.length === 0 ? (
              <tr>
                <td colSpan="10" className="p-10 text-center font-bold text-slate-400 border border-black">
                  No records found for this category.
                </td>
              </tr>
            ) : (
              (Array.isArray(items) ? items : []).map((it) => (
                <tr 
                  key={it.id} 
                  className={`hover:bg-sky-50/30 transition-colors ${selectedIds.includes(it.id) ? 'bg-sky-50/60' : ''}`}
                >
                  {multiSelectMode && (
                    <td className="p-4 text-center border border-black">
                      <input 
                        type="checkbox" 
                        checked={selectedIds.includes(it.id)} 
                        onChange={() => toggleSelect(it.id)} 
                        className="w-4 h-4 rounded text-sky-600 cursor-pointer" 
                      />
                    </td>
                  )}
                  
                  {/* Tracking Column */}
                  <td className="p-4 border border-black">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-sky-900 text-xs">{it.trackingId}</span>
                      {it.attachments && JSON.parse(it.attachments).length > 0 && (
                        <span className="text-[10px] animate-pulse">📎</span>
                      )}
                    </div>
                  </td>

                  {/* 🆕 Invoice No Column Data */}
                  <td className="p-4 font-bold text-slate-700 text-xs border border-black">
                    {it.invoiceNo || it.invoice || <span className="text-slate-300">-</span>}
                  </td>
                  
                  {/* Store Dispatch Date Column */}
                  <td className="p-4 font-bold text-slate-500 text-[11px] border border-black">
                    {it.dispatchToWarehouseDate 
                      ? new Date(it.dispatchToWarehouseDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) 
                      : <span className="text-slate-300">-</span>}
                  </td>

                  {/* Store Courier Info Column */}
                  <td className="p-4 font-bold text-slate-600 text-[11px] border border-black">
                    {it.courierName ? (
                      <div className="flex flex-col">
                        <span className="text-sky-700 uppercase">{it.courierName}</span>
                        <span className="text-[9px] text-slate-400">Slip: {it.courierSlip}</span>
                      </div>
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>

                  {/* Store Column */}
                  <td className="p-4 font-bold text-indigo-700 text-[11px] border border-black">
                    {it.store?.name || it.store?.shortName || `Store ${it.storeId}`}
                  </td>

                  {/* Article Column */}
                  <td className="p-4 font-bold text-slate-700 text-[11px] border border-black">
                    {it.articleNo} - <span className="text-sky-600">{it.color}</span> ({it.size})
                  </td>

                  {/* Return To Column */}
                  <td className="p-4 border border-black">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${it.returnto === 'To Store' ? 'text-indigo-600 bg-indigo-50' : 'text-rose-600 bg-rose-50'}`}>{it.returnto}</span>
                  </td>

                  {/* Status & Remarks Column */}
                  <td className="p-4 border border-black">
                    <div className="flex flex-col">
                      <span className="font-black text-[9px] text-slate-500 uppercase">{it.status}</span>
                      {it.remarksWH && <span className="text-[9px] font-bold text-sky-600 italic">R: {it.remarksWH}</span>}
                    </div>
                  </td>

                  {/* Actions / View Column */}
                  <td className="p-4 text-center border border-black">
                    <div className="flex justify-center items-center gap-1">
                      {statuses.map((st) => {
                        const state = getButtonStatus(it, st.key);
                        
                        if (state.hidden) return null;
                        if (actionFilter !== 'all' && (state.disabled || state.isDone)) return null;

                        let btnLbl = st.label;
                        if (st.key === "dispatch") btnLbl = it.returnto === "To Store" ? "Disp Store" : "Disp Cust";

                        return (
                          <button 
                            key={st.key} 
                            onClick={() => handleSingleAction(it.id, st.key)} 
                            disabled={state.disabled || loadingId === it.id} 
                            className={`px-2 py-1 rounded text-[9px] font-bold text-white transition-all ${state.disabled ? state.className : `${st.color} ${state.className}`}`}
                          >
                            {btnLbl}
                          </button>
                        );
                      })}
                      
                      {user?.type === 'Warehouse' && !it.remarksWH && (
                        <button 
                          onClick={() => { 
                            setActiveRemarksId(activeRemarksId === it.id ? null : it.id); 
                            setTempRemarks({...tempRemarks, [it.id]: it.remarksWH || ""}); 
                          }} 
                          className={`p-1.5 rounded-full ${activeRemarksId === it.id ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-sky-200'}`}
                        >
                          💬
                        </button>
                      )}
                      
                      <button onClick={() => setViewingItem(it)} className="p-1.5 bg-slate-100 text-slate-600 rounded-full hover:bg-sky-100">👁️</button>
                    </div>

                    {activeRemarksId === it.id && (
                      <div className="mt-2 flex gap-1">
                        <input 
                          type="text" 
                          className="border border-sky-300 rounded px-2 py-1 text-[10px] w-full" 
                          value={tempRemarks[it.id] || ""} 
                          onChange={(e) => setTempRemarks({...tempRemarks, [it.id]: e.target.value})} 
                        />
                        <button onClick={() => handleSaveRemarks(it.id)} className="bg-green-600 text-white px-2 py-1 rounded text-[9px] font-bold">SAVE</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}











// import React from 'react';
// import axios from '../axiosConfig';

// export default function ItemTable({ 
//   user, items, multiSelectMode, selectedIds, toggleSelect, statuses, 
//   getButtonStatus, handleSingleAction, loadingId, setViewingItem, 
//   activeRemarksId, setActiveRemarksId, tempRemarks, setTempRemarks, 
//   handleSaveRemarks, actionFilter 
// }) {
//   return (
//     <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
//       <div className="overflow-x-auto">
//         <table className="w-full text-left whitespace-nowrap">
//           <thead className="bg-slate-50 border-b border-slate-100">
//             <tr className="text-[10px] uppercase text-slate-400 font-black">
//               {multiSelectMode && <th className="p-4 w-10 text-center">Select</th>}
//               <th className="p-4">Tracking</th>
//               <th className="p-4">Store Dispatch Date</th>
//               <th className="p-4">Store Courier Info</th>
//               <th className="p-4">Store</th>
//               <th className="p-4">Article</th>
//               <th className="p-4">Return To</th>
//               <th className="p-4">Status & Remarks</th>
//               <th className="p-4 text-center">Actions / View</th>
//             </tr>
//           </thead>
//           <tbody className="divide-y divide-slate-50">
//             {items.length === 0 ? (
//               <tr><td colSpan="9" className="p-10 text-center font-bold text-slate-400">No records found for this category.</td></tr>
//             ) : (
//               items.map((it) => (
//                 <tr key={it.id} className={`hover:bg-sky-50/30 transition-colors ${selectedIds.includes(it.id) ? 'bg-sky-50/60' : ''}`}>
//                   {multiSelectMode && (
//                     <td className="p-4 text-center">
//                       <input type="checkbox" checked={selectedIds.includes(it.id)} onChange={() => toggleSelect(it.id)} className="w-4 h-4 rounded text-sky-600 cursor-pointer" />
//                     </td>
//                   )}
//                   <td className="p-4">
//                     <div className="flex items-center gap-2">
//                       <span className="font-black text-sky-900 text-xs">{it.trackingId}</span>
//                       {it.attachments && JSON.parse(it.attachments).length > 0 && (
//                         <span className="text-[10px] animate-pulse">📎</span>
//                       )}
//                     </div>
//                   </td>              
//                   <td className="p-4 font-bold text-slate-500 text-[11px]">
//                     {it.dispatchToWarehouseDate 
//                       ? new Date(it.dispatchToWarehouseDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) 
//                       : <span className="text-slate-300">-</span>}
//                   </td>

//                   <td className="p-4 font-bold text-slate-600 text-[11px]">
//                     {it.courierName ? (
//                       <div className="flex flex-col">
//                         <span className="text-sky-700 uppercase">{it.courierName}</span>
//                         <span className="text-[9px] text-slate-400">Slip: {it.courierSlip}</span>
//                       </div>
//                     ) : (
//                       <span className="text-slate-300">-</span>
//                     )}
//                   </td>
//                   <td className="p-4 font-bold text-indigo-700 text-[11px]">
//                     {it.store?.name || it.store?.shortName || `Store ${it.storeId}`}
//                   </td>
//                   <td className="p-4 font-bold text-slate-700 text-[11px]">
//                     {/* Yahan Color aur Size dono show honge */}
//                     {it.articleNo} - <span className="text-sky-600">{it.color}</span> ({it.size})
//                   </td>
//                   <td className="p-4">
//                     <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${it.returnto === 'To Store' ? 'text-indigo-600 bg-indigo-50' : 'text-rose-600 bg-rose-50'}`}>{it.returnto}</span>
//                   </td>
//                   <td className="p-4">
//                     <div className="flex flex-col">
//                       <span className="font-black text-[9px] text-slate-500 uppercase">{it.status}</span>
//                       {it.remarksWH && <span className="text-[9px] font-bold text-sky-600 italic">R: {it.remarksWH}</span>}
//                     </div>
//                   </td>
//                   <td className="p-4 text-center">
//                     <div className="flex justify-center items-center gap-1">
//                       {statuses.map((st) => {
//                         const state = getButtonStatus(it, st.key);
                        
//                         // Hide logic from ItemList controls this now
//                         if (state.hidden) return null;
//                         if (actionFilter !== 'all' && (state.disabled || state.isDone)) return null;

//                         let btnLbl = st.label;
//                         if (st.key === "dispatch") btnLbl = it.returnto === "To Store" ? "Disp Store" : "Disp Cust";

//                         return (
//                           <button 
//                             key={st.key} 
//                             onClick={() => handleSingleAction(it.id, st.key)} 
//                             disabled={state.disabled || loadingId === it.id} 
//                             className={`px-2 py-1 rounded text-[9px] font-bold text-white transition-all ${state.disabled ? state.className : `${st.color} ${state.className}`}`}
//                           >
//                             {btnLbl}
//                           </button>
//                         );
//                       })}
//                       {user?.type === 'Warehouse' && !it.remarksWH && (
//                       <button onClick={() => { setActiveRemarksId(activeRemarksId === it.id ? null : it.id); setTempRemarks({...tempRemarks, [it.id]: it.remarksWH || ""}); }} className={`p-1.5 rounded-full ${activeRemarksId === it.id ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-sky-200'}`}>💬</button>)}
//                       <button onClick={() => setViewingItem(it)} className="p-1.5 bg-slate-100 text-slate-600 rounded-full hover:bg-sky-100">👁️</button>
//                     </div>
//                     {activeRemarksId === it.id && (
//                       <div className="mt-2 flex gap-1">
//                         <input type="text" className="border border-sky-300 rounded px-2 py-1 text-[10px] w-full" value={tempRemarks[it.id] || ""} onChange={(e) => setTempRemarks({...tempRemarks, [it.id]: e.target.value})} />
//                         <button onClick={() => handleSaveRemarks(it.id)} className="bg-green-600 text-white px-2 py-1 rounded text-[9px] font-bold">SAVE</button>
//                       </div>
//                     )}
//                   </td>
//                 </tr>
//               ))
//             )}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// }
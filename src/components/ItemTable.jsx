import React from 'react';

export default function ItemTable({ 
  items, multiSelectMode, selectedIds, toggleSelect, statuses, 
  getButtonStatus, handleSingleAction, loadingId, setViewingItem, 
  activeRemarksId, setActiveRemarksId, tempRemarks, setTempRemarks, 
  handleSaveRemarks, actionFilter 
}) {
  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left whitespace-nowrap">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr className="text-[10px] uppercase text-slate-400 font-black">
              {multiSelectMode && <th className="p-4 w-10 text-center">Select</th>}
              <th className="p-4">Tracking</th>
              <th className="p-4">Article</th>
              <th className="p-4">Return To</th>
              <th className="p-4">Status & Remarks</th>
              <th className="p-4 text-center">Actions / View</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {items.length === 0 ? (
              <tr><td colSpan="6" className="p-10 text-center font-bold text-slate-400">No records found for this category.</td></tr>
            ) : (
              items.map((it) => (
                <tr key={it.id} className={`hover:bg-sky-50/30 transition-colors ${selectedIds.includes(it.id) ? 'bg-sky-50/60' : ''}`}>
                  {multiSelectMode && (
                    <td className="p-4 text-center">
                      <input type="checkbox" checked={selectedIds.includes(it.id)} onChange={() => toggleSelect(it.id)} className="w-4 h-4 rounded text-sky-600 cursor-pointer" />
                    </td>
                  )}
                  <td className="p-4 font-black text-sky-900 text-xs">{it.trackingId}</td>
                  <td className="p-4 font-bold text-slate-700 text-[11px]">
                    {/* Yahan Color aur Size dono show honge */}
                    {it.articleNo} - <span className="text-sky-600">{it.color}</span> ({it.size})
                  </td>
                  <td className="p-4">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${it.returnto === 'To Store' ? 'text-indigo-600 bg-indigo-50' : 'text-rose-600 bg-rose-50'}`}>{it.returnto}</span>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className="font-black text-[9px] text-slate-500 uppercase">{it.status}</span>
                      {it.remarksWH && <span className="text-[9px] font-bold text-sky-600 italic">R: {it.remarksWH}</span>}
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex justify-center items-center gap-1">
                      {statuses.map((st) => {
                        const state = getButtonStatus(it, st.key);
                        
                        // Hide logic from ItemList controls this now
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
                      <button onClick={() => { setActiveRemarksId(activeRemarksId === it.id ? null : it.id); setTempRemarks({...tempRemarks, [it.id]: it.remarksWH || ""}); }} className={`p-1.5 rounded-full ${activeRemarksId === it.id ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-sky-200'}`}>💬</button>
                      <button onClick={() => setViewingItem(it)} className="p-1.5 bg-slate-100 text-slate-600 rounded-full hover:bg-sky-100">👁️</button>
                    </div>
                    {activeRemarksId === it.id && (
                      <div className="mt-2 flex gap-1">
                        <input type="text" className="border border-sky-300 rounded px-2 py-1 text-[10px] w-full" value={tempRemarks[it.id] || ""} onChange={(e) => setTempRemarks({...tempRemarks, [it.id]: e.target.value})} />
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
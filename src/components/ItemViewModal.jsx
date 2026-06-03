import React from 'react';
import axios from '../axiosConfig';


const DetailBox = ({ label, value, textColor = "text-slate-800" }) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter block">{label}</span>
    <span className={`text-sm font-bold break-words ${textColor}`}>{value || "---"}</span>
  </div>
);

export default function ItemViewModal({ item, onClose }) {
  if (!item) return null;
  let parsedAttachments = [];
  try {
    if (item.attachments) {
      parsedAttachments = typeof item.attachments === 'string' ? JSON.parse(item.attachments) : item.attachments;
    }
  } catch (e) {
    console.error("Could not parse attachments");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto border border-slate-200">
        
        {/* HEADER */}
        <div className="bg-slate-900 p-6 flex justify-between items-center sticky top-0 z-10 shadow-md">
          <div className="flex items-center gap-4">
            <h3 className="text-3xl font-black text-white tracking-tight">{item.trackingId}</h3>
            <div className="flex flex-col gap-1">
              <span className="text-sky-300 text-[10px] font-black uppercase tracking-widest bg-sky-900/50 px-2 py-0.5 rounded border border-sky-700">
                Status: {item.status}
              </span>
              <span className="text-rose-300 text-[10px] font-black uppercase tracking-widest bg-rose-900/50 px-2 py-0.5 rounded border border-rose-700">
                Type: {item.type}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-white text-2xl font-bold hover:text-rose-500 transition-colors">✕</button>
        </div>

        <div className="p-8 space-y-8">
          
          {/* SECTION 1: Route & Logistics Info */}
          <div className="bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100">
            <h4 className="text-xs font-black text-indigo-600 uppercase mb-4 border-b border-indigo-100 pb-2">Logistics & Store Details</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <DetailBox label="Store Name" value={item.store?.shortName || item.store?.name || `Store ID: ${item.storeId}`} textColor="text-indigo-900" /><DetailBox label="Warehouse" value={item.warehouse} textColor="text-indigo-900" />
              <DetailBox label="Return To" value={item.returnto} textColor="text-indigo-900" />
              <DetailBox label="Receiving Date" value={item.receivingDate} textColor="text-indigo-900" />
            </div>
          </div>

          {/* SECTION 2: Product & Invoice */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
            <h4 className="text-xs font-black text-sky-600 uppercase mb-4 border-b border-slate-200 pb-2">Product & Invoice Details</h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
              <DetailBox label="Invoice No" value={item.invoiceNo} />
              <DetailBox label="Article" value={item.articleNo} />
              <DetailBox label="Size" value={item.size} />
              <DetailBox label="Color" value={item.color} />
              <DetailBox label="Category" value={item.category?.name} />
            </div>
          </div>

          {/* SECTION 3: Customer & Address Details */}
          <div>
            <h4 className="text-xs font-black text-slate-400 uppercase mb-4 border-b pb-2">Customer & Address Details</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-4">
              <DetailBox label="Customer Name" value={item.customerName} />
              <DetailBox label="Mobile" value={item.customerMobile} />
              <DetailBox label="Province" value={item.province} />
              <DetailBox label="City" value={item.city} />
              <DetailBox label="Street Address" value={item.streetAddress} />
            </div>
            <DetailBox label="Complete Billing/Shipping Address" value={item.billingAddress} />
          </div>

          {/* SECTION 4: Claim & Approvals (Only visible if type is Claim or has data) */}
          {(item.type?.toLowerCase() === 'claim' || item.claimAmount) && (
             <div className="bg-orange-50/50 p-5 rounded-2xl border border-orange-100">
               <h4 className="text-xs font-black text-orange-600 uppercase mb-4 border-b border-orange-100 pb-2">Claim Information</h4>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                 <DetailBox label="Courier Charges" value={`Rs. ${item.claimAmount}`} textColor="text-orange-700" />
                 <DetailBox label="Claim Status" value={item.claimApproved} textColor={item.claimApproved === 'Approved' ? 'text-green-600' : 'text-rose-600'} />
                 <DetailBox label="Approved By (TM)" value={item.approvedByUser?.name ? `${item.approvedBy} - ${item.approvedByUser.name}` : (item.tmName ? `${item.approvedBy} - ${item.tmName}` : item.approvedBy)} />
                 <DetailBox label="Est. Completion" value={item.estimatedCompletionDate} />
               </div>
             </div>
          )}

          {/* SECTION 5: Diagnostics, Remarks & Flags */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
               <div className="p-4 bg-rose-50 border-l-4 border-rose-400 rounded-lg">
                  <h4 className="text-[10px] font-black text-rose-800 uppercase mb-1">Problem Description</h4>
                  <p className="text-sm font-medium text-rose-900 italic">"{item.problemDescription || 'No description provided.'}"</p>
               </div>
               
               {item.remarksTM && (
                 <div className="p-4 bg-sky-50 border-l-4 border-sky-400 rounded-lg">
                    <h4 className="text-[10px] font-black text-sky-800 uppercase mb-1">TM Remarks</h4>
                    <p className="text-sm font-medium text-sky-900 italic">"{item.remarksTM}"</p>
                 </div>
               )}

               {item.remarksWH && (
                 <div className="p-4 bg-emerald-50 border-l-4 border-emerald-400 rounded-lg">
                    <h4 className="text-[10px] font-black text-emerald-800 uppercase mb-1">Warehouse Remarks</h4>
                    <p className="text-sm font-medium text-emerald-900 italic">"{item.remarksWH}"</p>
                 </div>
               )}
            </div>

            <div className="bg-slate-50 p-5 rounded-xl border border-slate-100">
               <h4 className="text-xs font-black text-slate-400 uppercase mb-4">Identify Flags</h4>
               <div className="flex flex-wrap gap-2">
                  {['upper', 'buckle', 'sole', 'inSocks', 'color', 'refinishing'].map(k => {
                    const hasProblem = item[k + 'Problem'] === 'Y';
                    return (
                      <span key={k} className={`text-[10px] px-3 py-1.5 rounded-full uppercase font-black tracking-wider border ${hasProblem ? 'bg-slate-800 text-white border-slate-900 shadow-md' : 'bg-white text-slate-300 border-slate-200'}`}>
                        {k}
                      </span>
                    )
                  })}
               </div>
{/* Attachments Section - Updated for Images and Videos */}
<div className="flex flex-wrap gap-4 mt-2">
  {parsedAttachments.map((file, idx) => {
    // File type check karne ke liye logic
    const isVideo = file.match(/\.(mp4|webm|ogg)$/i);
    const fileUrl = `${import.meta.env.VITE_SERVER_URL}/uploads/${file}`;

    return (
      <div key={idx} className="group relative flex flex-col items-center gap-2">
        {/* Link jo naye tab mein file open karega */}
        <a 
          href={fileUrl} 
          target="_blank" 
          rel="noreferrer" 
          className="relative block w-32 h-32 border-2 border-slate-200 rounded-xl overflow-hidden hover:border-sky-500 transition-all shadow-sm"
        >
          {isVideo ? (
            /* Agar Video hai to Video Thumbnail show hoga */
            <div className="relative w-full h-full bg-slate-900 flex items-center justify-center">
              <video className="w-full h-full object-cover opacity-60">
                <source src={fileUrl} type="video/mp4" />
              </video>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl text-white drop-shadow-md">▶️</span>
              </div>
            </div>
          ) : (
            /* Agar Image hai to Image show hogi */
            <img 
              src={fileUrl} 
              alt={`attachment-${idx}`} 
              className="w-full h-full object-cover transition-transform group-hover:scale-110" 
            />
          )}
        </a>

        {/* Chota tag dikhane ke liye ke ye video hai ya pic */}
        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-500 tracking-tighter">
          {isVideo ? "🎥 Video" : "🖼️ Image"}
        </span>
      </div>
    );
  })}
</div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
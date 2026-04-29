import React, { useEffect, useState } from 'react';
import axios from 'axios';
import imageCompression from 'browser-image-compression';

const sizes = Array.from({ length: 12 }, (_, i) => (36 + i).toString());
const provinces = ["Punjab", "Sindh", "KPK", "Balochistan", "Azad Kashmir", "Gilgit Baltistan"];

export default function ItemForm({ onSaved, socket, currentUser }) {
  const [trackingId, setTrackingId] = useState('');
  const [type, setType] = useState(''); 
  const [warehouse, setWarehouse] = useState('');
  const [Returnto, setReturn] = useState('');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [articleNo, setArticleNo] = useState('');
  const [size, setSize] = useState('');
  const [color, setColor] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [province, setProvince] = useState('');
  const [city, setCity] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [receivingDate, setReceivingDate] = useState('');
  const [problemDescription, setProblemDescription] = useState('');
  const [claimAmount, setClaimAmount] = useState(500); 
  const [categoryId, setCategoryId] = useState('');
  const [activeCategories, setActiveCategories] = useState([]);
  const [attachments, setAttachments] = useState([]); 
  const [isCompressing, setIsCompressing] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [estimatedCompletionDate, setEstimatedCompletionDate] = useState('');

  const [problemFlags, setProblemFlags] = useState({
    upperProblem: 'N', buckleProblem: 'N', soleProblem: 'N',
    inSocksProblem: 'N', colorProblem: 'N', refinishingProblem: 'N',
  });

  useEffect(() => {
    generateTrackingId();
    const today = new Date();
    setReceivingDate(today.toISOString().slice(0, 10));
    const estimatedDate = new Date(today);
    estimatedDate.setDate(today.getDate() + 15);
    setEstimatedCompletionDate(estimatedDate.toISOString().slice(0, 10));
    
    const fetchActiveCats = async () => {
      try {
        const res = await axios.get('http://194.163.190.100:8080/api/categories/active');
        const categories = Array.isArray(res.data) ? res.data : res.data.data || [];
        setActiveCategories(categories);
      } catch (err) { console.error("Category Fetch Error:", err); }
    };
    fetchActiveCats();
  }, []);

  // --- LOGIC: Auto Warehouse Selection ---
  useEffect(() => {
    const art = articleNo.toUpperCase();
    const selectedCat = activeCategories.find(c => c.id == categoryId)?.name?.toUpperCase() || "";

    if (art.includes("SHOE") || selectedCat.includes("SHOE")) {
      setWarehouse("WHLHR");
    } else if (art.includes("SANDAL") || art.includes("SLIPPER") || selectedCat.includes("SANDAL") || selectedCat.includes("SLIPPER")) {
      setWarehouse("WHFSD");
    }
  }, [articleNo, categoryId, activeCategories]);

  const generateTrackingId = () => setTrackingId('TRX-' + Date.now().toString().slice(-6));

  const handleProblemChange = (e) => {
    const { name, checked } = e.target;
    setProblemFlags(prev => ({ ...prev, [name]: checked ? 'Y' : 'N' }));
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (attachments.length + files.length > 3) {
      alert("Maximum 3 attachments allowed.");
      return;
    }
    setIsCompressing(true);
    const newAttachments = [...attachments];
    for (let file of files) {
      if (file.type.startsWith('image/')) {
        const options = { maxSizeMB: 0.8, maxWidthOrHeight: 1280, useWebWorker: true };
        try {
          const compressedFile = await imageCompression(file, options);
          newAttachments.push({ file: compressedFile, preview: URL.createObjectURL(compressedFile), type: 'image' });
        } catch (error) { console.error("Compression Error:", error); }
      }
    }
    setAttachments(newAttachments);
    setIsCompressing(false);
  };

  const removeAttachment = (index) => {
    const updated = attachments.filter((_, i) => i !== index);
    setAttachments(updated);
  };

  // --- LOGIC: Strict Validation ---
  const validate = () => {
    const e = {};
    
    if (!type) e.type = 'Service Type is required*';
    if (!Returnto && type !== 'local repair') e.returnto = 'Return To is required*';
    if (!invoiceNo?.trim()) e.invoiceNo = 'Invoice No is required*';
    if (!articleNo?.trim()) e.articleNo = 'Article No is required*';
    if (!categoryId) e.categoryId = 'Category is required*';
    if (!color?.trim()) e.color = 'Color is required*';
    if (!size) e.size = 'Size is required*';
    if (!customerName?.trim()) e.customerName = 'Customer Name is required*';
    if (!customerMobile?.trim()) e.customerMobile = 'Mobile No is required*';
    if (!problemDescription?.trim()) e.problemDescription = 'Description is required*';

    // Address fields compulsory ONLY if returning to customer
    if (Returnto === 'To Customer' && type !== 'local repair') {
      if (!province) e.province = 'Province is required*';
      if (!city?.trim()) e.city = 'City is required*';
      if (!streetAddress?.trim()) e.streetAddress = 'Street Address is required*';
      if (!billingAddress?.trim()) e.billingAddress = 'Shipping Address is required*';
    }

    if (type === 'claim' && attachments.length === 0) {
      e.attachments = 'Image is compulsory for Claim*';
    }

    return e;
  };

  const resetForm = () => {
    setInvoiceNo(''); setArticleNo(''); setSize(''); setColor('');
    setCustomerName(''); setBillingAddress(''); setCustomerMobile('');
    setProvince(''); setCity(''); setStreetAddress('');
    setProblemDescription(''); setClaimAmount(500); setType('');
    setWarehouse(''); setReturn(''); setCategoryId(''); generateTrackingId();
    setAttachments([]); setErrors({}); 
    setProblemFlags({ upperProblem: 'N', buckleProblem: 'N', soleProblem: 'N', inSocksProblem: 'N', colorProblem: 'N', refinishingProblem: 'N' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const ev = validate();
    setErrors(ev);
    
    // Agar errors hain to form submit nahi hoga, image save nahi hogi
    if (Object.keys(ev).length > 0) {
      console.log("Validation Failed:", ev);
      return; 
    }
    
    setLoading(true);
    const formData = new FormData();
    formData.append('trackingId', trackingId);
    formData.append('invoiceNo', invoiceNo);
    formData.append('articleNo', articleNo);
    formData.append('size', size);
    formData.append('color', color);
    formData.append('customerName', customerName);
    formData.append('billingAddress', billingAddress);
    formData.append('province', province);
    formData.append('city', city);
    formData.append('streetAddress', streetAddress);
    formData.append('customerMobile', customerMobile);
    formData.append('receivingDate', receivingDate);
    formData.append('estimatedCompletionDate', estimatedCompletionDate);
    formData.append('problemDescription', problemDescription);
    formData.append('claimAmount', claimAmount);
    formData.append('type', type);
    formData.append('warehouse', type === 'local repair' ? 'LOCAL' : warehouse);
    formData.append('returnto', type === 'local repair' ? 'LOCAL' : Returnto);
    formData.append('categoryId', categoryId);
    formData.append('storeId', currentUser?.id);
    
    Object.keys(problemFlags).forEach(key => formData.append(key, problemFlags[key]));
    attachments.forEach((attr) => formData.append('files', attr.file));

    try {
      const res = await axios.post('http://194.163.190.100:8080/api/items', formData);
      if (res.data.success) {
        setShowSuccessPopup(true);
        setTimeout(() => setShowSuccessPopup(false), 2500);
        if (onSaved) onSaved();
        resetForm();
      }
    } catch (err) {
      console.error(err);
      alert("Failed to save. Check console for details.");
    } finally { setLoading(false); }
  };

  return (
    <div className="w-full min-h-screen bg-slate-50 p-4 flex flex-col items-center justify-start relative overflow-x-hidden">
      
      {showSuccessPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white p-10 rounded-3xl shadow-2xl text-center border-t-8 border-green-500 animate-in fade-in zoom-in duration-500">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tight">Success!</h2>
            <p className="text-slate-600 font-bold mt-2">Record saved successfully</p>
          </div>
        </div>
      )}

      <div className="w-full max-w-full h-auto bg-white shadow-xl rounded-2xl border border-slate-200 overflow-hidden flex flex-col">
        <div className="bg-slate-900 p-5 text-white flex justify-between items-center">
          <h2 className="text-xl font-black uppercase tracking-wider">New Inventory Entry</h2>
          {currentUser && <span className="bg-sky-500/20 text-sky-300 px-4 py-1.5 rounded-full text-xs font-black border border-sky-500/30">STORE: {currentUser.name}</span>}
        </div>

        <form onSubmit={handleSubmit} className="p-8 grid grid-cols-12 gap-8">
          
          {/* Column 1: Dates, Type & Attachments */}
          <div className="col-span-12 lg:col-span-4 space-y-6 border-r border-slate-100 pr-6">
            <div className="grid grid-cols-1 gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Tracking ID</label>
                <input readOnly value={trackingId} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-black text-sky-700 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Receiving Date</label>
                  <input readOnly value={receivingDate} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Est. Completion</label>
                  <input readOnly value={estimatedCompletionDate} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-rose-600 outline-none" />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Service Type *</label>
              <div className="flex gap-2">
                {['repair', 'claim', 'local repair'].map((t) => (
                  <button key={t} type="button" onClick={() => setType(t)} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all border-2 ${type === t ? 'bg-sky-600 text-white border-sky-600 shadow-lg' : 'bg-white text-slate-400 border-slate-200 hover:border-sky-300'}`}>{t}</button>
                ))}
              </div>
              {errors.type && <p className="text-rose-500 text-[9px] font-black uppercase italic">{errors.type}</p>}
            </div>

            {/* ATTACHMENTS - Only show if Claim is selected */}
            {type === 'claim' && (
              <div className="p-5 bg-slate-900 rounded-2xl space-y-4 animate-in slide-in-from-left duration-300">
                 <label className="text-[10px] font-black text-sky-400 uppercase">Media Proof (Max 3) *</label>
                 <div className="grid grid-cols-3 gap-2">
                    {attachments.map((attr, idx) => (
                      <div key={idx} className="relative aspect-square bg-slate-800 rounded-lg overflow-hidden">
                         <img src={attr.preview} className="w-full h-full object-cover" alt="" />
                         <button type="button" onClick={() => removeAttachment(idx)} className="absolute top-1 right-1 bg-rose-600 text-white w-5 h-5 rounded-full text-[10px]">✕</button>
                      </div>
                    ))}
                    {attachments.length < 3 && (
                      <label className="aspect-square bg-slate-800 border-2 border-dashed border-slate-600 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-sky-500">
                         <span className="text-white text-xl">+</span>
                         <input type="file" accept="image/*" multiple onChange={handleFileChange} className="hidden" />
                      </label>
                    )}
                 </div>
                 {errors.attachments && <p className="text-rose-400 text-[9px] font-black uppercase italic">{errors.attachments}</p>}
              </div>
            )}

            {type !== 'local repair' && (
              <div className="grid grid-cols-1 gap-4 bg-sky-50/50 p-4 rounded-2xl border border-sky-100">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-sky-800 uppercase">Warehouse (Auto)</label>
                  <div className="flex gap-2">
                    {['WHFSD', 'WHLHR'].map((wh) => (
                      <div key={wh} className={`flex-1 py-2 text-center rounded-lg text-[10px] font-black border ${warehouse === wh ? 'bg-sky-700 text-white' : 'bg-white text-slate-300 border-sky-100'}`}>{wh}</div>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-indigo-800 uppercase">Return To *</label>
                  <div className="flex gap-2">
                    {['To Customer', 'To Store'].map((ret) => (
                      <button key={ret} type="button" onClick={() => setReturn(ret)} className={`flex-1 py-2 rounded-lg text-[10px] font-black border ${Returnto === ret ? 'bg-indigo-700 text-white' : 'bg-white text-indigo-700 border-indigo-200'}`}>{ret}</button>
                    ))}
                  </div>
                  {errors.returnto && <p className="text-rose-500 text-[9px] font-black uppercase italic">{errors.returnto}</p>}
                </div>
              </div>
            )}
          </div>

          {/* Column 2: Product & Customer */}
          <div className="col-span-12 lg:col-span-5 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-1">
                <label className="text-[10px] font-black text-slate-400 uppercase">Invoice No *</label>
                <input value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} className={`w-full border-b-2 outline-none py-2 font-bold text-sm ${errors.invoiceNo ? 'border-rose-500' : 'border-slate-200'}`} />
                {errors.invoiceNo && <p className="text-rose-500 text-[9px] font-black mt-1 uppercase italic">{errors.invoiceNo}</p>}
              </div>
              <div className="col-span-1">
                <label className="text-[10px] font-black text-slate-400 uppercase">Article No *</label>
                <input value={articleNo} onChange={(e) => setArticleNo(e.target.value)} className={`w-full border-b-2 outline-none py-2 font-bold text-sm ${errors.articleNo ? 'border-rose-500' : 'border-slate-200'}`} placeholder="e.g. SHOE-01" />
                {errors.articleNo && <p className="text-rose-500 text-[9px] font-black mt-1 uppercase italic">{errors.articleNo}</p>}
              </div>
              <div className="col-span-1">
                <label className="text-[10px] font-black text-slate-400 uppercase">Category *</label>
                <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={`w-full border-b-2 outline-none py-2 font-bold text-sm bg-transparent ${errors.categoryId ? 'border-rose-500' : 'border-slate-200'}`}>
                  <option value="">Select Category</option>
                  {activeCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                {errors.categoryId && <p className="text-rose-500 text-[9px] font-black mt-1 uppercase italic">{errors.categoryId}</p>}
              </div>
              <div className="col-span-1">
                <label className="text-[10px] font-black text-slate-400 uppercase">Color *</label>
                <input value={color} onChange={(e) => setColor(e.target.value)} className={`w-full border-b-2 outline-none py-2 font-bold text-sm ${errors.color ? 'border-rose-500' : 'border-slate-200'}`} />
                {errors.color && <p className="text-rose-500 text-[9px] font-black mt-1 uppercase italic">{errors.color}</p>}
              </div>
              <div className="col-span-1">
                <label className="text-[10px] font-black text-slate-400 uppercase">Size *</label>
                <select value={size} onChange={(e) => setSize(e.target.value)} className={`w-full border-b-2 outline-none py-2 font-bold text-sm bg-transparent ${errors.size ? 'border-rose-500' : 'border-slate-200'}`}>
                  <option value="">Size</option>
                  {sizes.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                {errors.size && <p className="text-rose-500 text-[9px] font-black mt-1 uppercase italic">{errors.size}</p>}
              </div>
              <div className="col-span-1">
                <label className="text-[10px] font-black text-slate-400 uppercase">Contact Mobile *</label>
                <input value={customerMobile} onChange={(e) => setCustomerMobile(e.target.value)} className={`w-full border-b-2 outline-none py-2 font-bold text-sm ${errors.customerMobile ? 'border-rose-500' : 'border-slate-200'}`} />
                {errors.customerMobile && <p className="text-rose-500 text-[9px] font-black mt-1 uppercase italic">{errors.customerMobile}</p>}
              </div>
              <div className="col-span-2">
                <label className="text-[10px] font-black text-slate-400 uppercase">Customer Name *</label>
                <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} className={`w-full border-b-2 outline-none py-2 font-bold text-sm ${errors.customerName ? 'border-rose-500' : 'border-slate-200'}`} />
                {errors.customerName && <p className="text-rose-500 text-[9px] font-black mt-1 uppercase italic">{errors.customerName}</p>}
              </div>
            </div>

            {/* Address Fields: Hide if 'To Store' is selected */}
            {Returnto !== 'To Store' && (
              <div className="space-y-4 pt-4 border-t border-slate-100 animate-in fade-in slide-in-from-top duration-300">
                <div className="grid grid-cols-2 gap-4">
                   <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase">Province *</label>
                    <select value={province} onChange={(e) => setProvince(e.target.value)} className={`w-full border-b-2 outline-none py-2 font-bold text-sm bg-transparent ${errors.province ? 'border-rose-500' : 'border-slate-200'}`}>
                      <option value="">Select Province</option>
                      {provinces.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                    {errors.province && <p className="text-rose-500 text-[9px] font-black mt-1 uppercase italic">{errors.province}</p>}
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase">City *</label>
                    <input value={city} onChange={(e) => setCity(e.target.value)} className={`w-full border-b-2 outline-none py-2 font-bold text-sm ${errors.city ? 'border-rose-500' : 'border-slate-200'}`} />
                    {errors.city && <p className="text-rose-500 text-[9px] font-black mt-1 uppercase italic">{errors.city}</p>}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase">Street Address *</label>
                  <input value={streetAddress} onChange={(e) => setStreetAddress(e.target.value)} className={`w-full border-b-2 outline-none py-2 font-bold text-sm ${errors.streetAddress ? 'border-rose-500' : 'border-slate-200'}`} />
                  {errors.streetAddress && <p className="text-rose-500 text-[9px] font-black mt-1 uppercase italic">{errors.streetAddress}</p>}
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase">Shipping Address (Billing) *</label>
                  <input value={billingAddress} onChange={(e) => setBillingAddress(e.target.value)} className={`w-full border-b-2 outline-none py-2 font-bold text-sm ${errors.billingAddress ? 'border-rose-500' : 'border-slate-200'}`} />
                  {errors.billingAddress && <p className="text-rose-500 text-[9px] font-black mt-1 uppercase italic">{errors.billingAddress}</p>}
                </div>
              </div>
            )}
          </div>

          {/* Column 3: Diagnostics & Save */}
          <div className="col-span-12 lg:col-span-3 space-y-6">
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
              <label className="block text-[10px] font-black text-slate-500 uppercase mb-4 text-center">Problem Checklist</label>
              <div className="grid grid-cols-1 gap-2">
                {Object.keys(problemFlags).map((key) => (
                  <label key={key} className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${problemFlags[key] === 'Y' ? 'bg-slate-900 text-white border-slate-900 shadow-md' : 'bg-white text-slate-500 border-slate-100 hover:border-slate-200'}`}>
                    <span className="text-[10px] font-black uppercase">{key.replace('Problem', '')}</span>
                    <input type="checkbox" name={key} checked={problemFlags[key] === 'Y'} onChange={handleProblemChange} className="hidden" />
                    <div className={`w-3 h-3 rounded-full ${problemFlags[key] === 'Y' ? 'bg-sky-400' : 'bg-slate-100'}`}></div>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase">Description *</label>
              <textarea value={problemDescription} onChange={(e) => setProblemDescription(e.target.value)} className={`w-full border-2 rounded-xl p-3 text-sm font-bold h-24 outline-none transition-all ${errors.problemDescription ? 'border-rose-500' : 'border-slate-100 focus:border-sky-500'}`} />
              {errors.problemDescription && <p className="text-rose-500 text-[9px] font-black mt-1 uppercase italic">{errors.problemDescription}</p>}
            </div>

            <button type="submit" disabled={loading || isCompressing} className="w-full bg-slate-900 text-white py-5 rounded-2xl text-xs font-black uppercase shadow-xl hover:bg-slate-800 active:scale-[0.98] transition-all disabled:opacity-50">
              {loading ? 'Processing...' : 'Save Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}




































// import React, { useEffect, useState } from 'react';
// import axios from 'axios';
// import imageCompression from 'browser-image-compression';

// const sizes = Array.from({ length: 12 }, (_, i) => (36 + i).toString());

// export default function ItemForm({ onSaved, socket, currentUser }) {
//   const [trackingId, setTrackingId] = useState('');
//   const [type, setType] = useState(''); 
//   const [warehouse, setWarehouse] = useState('');
//   const [Returnto, setReturn] = useState('');
//   const [invoiceNo, setInvoiceNo] = useState('');
//   const [articleNo, setArticleNo] = useState('');
//   const [size, setSize] = useState('');
//   const [color, setColor] = useState('');
//   const [customerName, setCustomerName] = useState('');
//   const [billingAddress, setBillingAddress] = useState('');
//   const [customerMobile, setCustomerMobile] = useState('');
//   const [receivingDate, setReceivingDate] = useState('');
//   const [problemDescription, setProblemDescription] = useState('');
//   const [claimAmount, setClaimAmount] = useState(500); 
//   const [categoryId, setCategoryId] = useState('');
//   const [activeCategories, setActiveCategories] = useState([]);
//   const [attachments, setAttachments] = useState([]); 
//   const [isCompressing, setIsCompressing] = useState(false);
//   const [errors, setErrors] = useState({});
//   const [loading, setLoading] = useState(false);
//   const [message, setMessage] = useState(null);
//   const [showSuccessPopup, setShowSuccessPopup] = useState(false);
//   const [estimatedCompletionDate, setEstimatedCompletionDate] = useState('');

//   const [problemFlags, setProblemFlags] = useState({
//     upperProblem: 'N', buckleProblem: 'N', soleProblem: 'N',
//     inSocksProblem: 'N', colorProblem: 'N', refinishingProblem: 'N',
//   });

//   useEffect(() => {
//     generateTrackingId();
//     const today = new Date();
//     setReceivingDate(today.toISOString().slice(0, 10));
//     const estimatedDate = new Date(today);
//     estimatedDate.setDate(today.getDate() + 15);
//     setEstimatedCompletionDate(estimatedDate.toISOString().slice(0, 10));
    
//     // Category Fetching with better handling
//     const fetchActiveCats = async () => {
//       try {
//         const res = await axios.get('http://localhost:8080/api/categories/active');
//         // Check if data is directly in res.data or res.data.data
//         const categories = Array.isArray(res.data) ? res.data : res.data.data || [];
//         setActiveCategories(categories);
//       } catch (err) {
//         console.error("Category Fetch Error:", err);
//       }
//     };
//     fetchActiveCats();
//   }, []);

//   const generateTrackingId = () => setTrackingId('TRX-' + Date.now().toString().slice(-6));

//   const handleProblemChange = (e) => {
//     const { name, checked } = e.target;
//     setProblemFlags(prev => ({ ...prev, [name]: checked ? 'Y' : 'N' }));
//   };

//   const handleFileChange = async (e) => {
//     const files = Array.from(e.target.files);
//     if (attachments.length + files.length > 3) {
//       alert("Maximum 3 attachments allowed.");
//       return;
//     }

//     setIsCompressing(true);
//     const newAttachments = [...attachments];

//     for (let file of files) {
//       if (file.type.startsWith('image/')) {
//         const options = { maxSizeMB: 0.8, maxWidthOrHeight: 1280, useWebWorker: true };
//         try {
//           const compressedFile = await imageCompression(file, options);
//           newAttachments.push({ file: compressedFile, preview: URL.createObjectURL(compressedFile), type: 'image' });
//         } catch (error) { console.error("Compression Error:", error); }
//       } 
//       else if (file.type.startsWith('video/')) {
//         const video = document.createElement('video');
//         video.preload = 'metadata';
//         video.onloadedmetadata = () => {
//           window.URL.revokeObjectURL(video.src);
//           if (video.duration > 11) {
//             alert(`Video "${file.name}" is too long. Max 10 seconds.`);
//           } else {
//             newAttachments.push({ file: file, preview: URL.createObjectURL(file), type: 'video' });
//             setAttachments([...newAttachments]);
//           }
//         };
//         video.src = URL.createObjectURL(file);
//       }
//     }
//     setAttachments(newAttachments);
//     setIsCompressing(false);
//   };

//   const removeAttachment = (index) => {
//     const updated = attachments.filter((_, i) => i !== index);
//     setAttachments(updated);
//   };

//   const validate = () => {
//     const e = {};
//     if (!invoiceNo?.trim()) e.invoiceNo = 'Invoice is required';
//     if (!customerName?.trim()) e.customerName = 'Customer is required';
//     if (!problemDescription?.trim()) e.problemDescription = 'Problem required';
//     if (!type) e.type = 'Select Type';
//     if (!categoryId) e.categoryId = 'Select Category';

//     if (type === 'claim') {
//       const hasImage = attachments.some(a => a.type === 'image');
//       if (!hasImage) e.attachments = 'Image is compulsory for Claim';
//     }

//     if (type !== 'local repair') {
//       if (!warehouse) e.warehouse = 'Select Warehouse';
//       if (!Returnto) e.Returnto = "Select Dispatch Type";
//     }
//     return e;
//   };

//   const resetForm = () => {
//     setInvoiceNo(''); setArticleNo(''); setSize(''); setColor('');
//     setCustomerName(''); setBillingAddress(''); setCustomerMobile('');
//     setProblemDescription(''); setClaimAmount(500); setType('');
//     setWarehouse(''); setReturn(''); setCategoryId(''); generateTrackingId();
//     setAttachments([]); setErrors({}); setMessage(null);
//     setProblemFlags({ upperProblem: 'N', buckleProblem: 'N', soleProblem: 'N', inSocksProblem: 'N', colorProblem: 'N', refinishingProblem: 'N' });
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     const ev = validate();
//     setErrors(ev);
//     if (Object.keys(ev).length > 0) return;
    
//     setLoading(true);
//     const formData = new FormData();
//     formData.append('trackingId', trackingId);
//     formData.append('invoiceNo', invoiceNo);
//     formData.append('articleNo', articleNo);
//     formData.append('size', size);
//     formData.append('color', color);
//     formData.append('customerName', customerName);
//     formData.append('billingAddress', billingAddress);
//     formData.append('customerMobile', customerMobile);
//     formData.append('receivingDate', receivingDate);
//     formData.append('estimatedCompletionDate', estimatedCompletionDate);
//     formData.append('problemDescription', problemDescription);
//     formData.append('claimAmount', claimAmount);
//     formData.append('type', type);
//     formData.append('warehouse', type === 'local repair' ? 'LOCAL' : warehouse);
//     formData.append('returnto', type === 'local repair' ? 'LOCAL' : Returnto);
//     formData.append('categoryId', categoryId);
//     formData.append('storeId', currentUser?.id);
    
//     Object.keys(problemFlags).forEach(key => formData.append(key, problemFlags[key]));
//     attachments.forEach((attr) => formData.append('files', attr.file));

//     try {
//       const res = await axios.post('http://localhost:8080/api/items', formData, {
//         headers: { 'Content-Type': 'multipart/form-data' }
//       });
//       if (res.data.success) {
//         setShowSuccessPopup(true);
//         setTimeout(() => setShowSuccessPopup(false), 2500);
//         if (onSaved) onSaved();
//         resetForm();
//       }
//     } catch (err) {
//       setMessage({ type: 'error', text: err.response?.data?.message || 'Request failed' });
//     } finally { setLoading(false); }
//   };

//   return (
//     <div className="w-full min-h-screen bg-slate-50 p-4 flex flex-col items-center justify-start relative overflow-x-hidden">
//       {/* ... Success Popup Logic ... */}
//       {showSuccessPopup && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
//           <div className="bg-white p-10 rounded-3xl shadow-2xl text-center border-t-8 border-green-500 animate-in fade-in zoom-in duration-500">
//             <div className="text-6xl mb-4">✅</div>
//             <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tight">Success!</h2>
//             <p className="text-slate-600 font-bold mt-2">Record saved successfully</p>
//           </div>
//         </div>
//       )}

//       <div className="w-full max-w-full h-auto bg-white shadow-xl rounded-2xl border border-slate-200 overflow-hidden flex flex-col">
//         <div className="bg-slate-900 p-5 text-white flex justify-between items-center">
//           <h2 className="text-xl font-black uppercase tracking-wider">New Inventory Entry</h2>
//           {currentUser && <span className="bg-sky-500/20 text-sky-300 px-4 py-1.5 rounded-full text-xs font-black border border-sky-500/30">STORE: {currentUser.name}</span>}
//         </div>

//         <form onSubmit={handleSubmit} className="p-8 grid grid-cols-12 gap-8">
          
//           {/* Column 1: Dates, Type & Attachments */}
//           <div className="col-span-12 lg:col-span-4 space-y-6 border-r border-slate-100 pr-6">
//             <div className="grid grid-cols-1 gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
//               <div>
//                 <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Tracking ID</label>
//                 <input readOnly value={trackingId} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-black text-sky-700 outline-none" />
//               </div>
//               <div className="grid grid-cols-2 gap-2">
//                 <div>
//                   <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Receiving Date</label>
//                   <input readOnly value={receivingDate} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none" />
//                 </div>
//                 <div>
//                   <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Est. Completion</label>
//                   <input readOnly value={estimatedCompletionDate} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-rose-600 outline-none" />
//                 </div>
//               </div>
//             </div>

//             <div className="space-y-3">
//               <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Service Type</label>
//               <div className="flex gap-2">
//                 {['repair', 'claim', 'local repair'].map((t) => (
//                   <button key={t} type="button" onClick={() => setType(t)} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all border-2 ${type === t ? 'bg-sky-600 text-white border-sky-600 shadow-lg' : 'bg-white text-slate-400 border-slate-200 hover:border-sky-300'}`}>{t}</button>
//                 ))}
//               </div>
//               {errors.type && <p className="text-rose-500 text-[10px] font-black uppercase">{errors.type}</p>}
//             </div>

//             {/* ATTACHMENTS */}
//             <div className="p-5 bg-slate-900 rounded-2xl space-y-4">
//                <label className="text-[10px] font-black text-sky-400 uppercase">Media Proof (Max 3)</label>
//                <div className="grid grid-cols-3 gap-2">
//                   {attachments.map((attr, idx) => (
//                     <div key={idx} className="relative aspect-square bg-slate-800 rounded-lg overflow-hidden">
//                        {attr.type === 'image' ? <img src={attr.preview} className="w-full h-full object-cover" alt="" /> : <video src={attr.preview} className="w-full h-full object-cover" />}
//                        <button type="button" onClick={() => removeAttachment(idx)} className="absolute top-1 right-1 bg-rose-600 text-white w-5 h-5 rounded-full text-[10px]">✕</button>
//                     </div>
//                   ))}
//                   {attachments.length < 3 && (
//                     <label className="aspect-square bg-slate-800 border-2 border-dashed border-slate-600 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-sky-500">
//                        <span className="text-white text-xl">+</span>
//                        <input type="file" accept="image/*,video/*" multiple onChange={handleFileChange} className="hidden" />
//                     </label>
//                   )}
//                </div>
//                {errors.attachments && <p className="text-rose-400 text-[9px] font-black uppercase">{errors.attachments}</p>}
//             </div>

//             {type !== 'local repair' && (
//               <div className="grid grid-cols-1 gap-4 bg-sky-50/50 p-4 rounded-2xl border border-sky-100">
//                 <div className="space-y-2">
//                   <label className="text-[10px] font-black text-sky-800 uppercase">Warehouse</label>
//                   <div className="flex gap-2">
//                     {['WHFSD', 'WHLHR'].map((wh) => (
//                       <button key={wh} type="button" onClick={() => setWarehouse(wh)} className={`flex-1 py-2 rounded-lg text-[10px] font-black border ${warehouse === wh ? 'bg-sky-700 text-white' : 'bg-white text-sky-700 border-sky-200'}`}>{wh}</button>
//                     ))}
//                   </div>
//                 </div>
//                 <div className="space-y-2">
//                   <label className="text-[10px] font-black text-indigo-800 uppercase">Return To</label>
//                   <div className="flex gap-2">
//                     {['To Customer', 'To Store'].map((ret) => (
//                       <button key={ret} type="button" onClick={() => setReturn(ret)} className={`flex-1 py-2 rounded-lg text-[10px] font-black border ${Returnto === ret ? 'bg-indigo-700 text-white' : 'bg-white text-indigo-700 border-indigo-200'}`}>{ret}</button>
//                     ))}
//                   </div>
//                 </div>
//               </div>
//             )}
//           </div>

//           {/* Column 2: Product & Customer */}
//           <div className="col-span-12 lg:col-span-5 space-y-6">
//             <div className="grid grid-cols-2 gap-4">
//               <div className="col-span-1">
//                 <label className="text-[10px] font-black text-slate-400 uppercase">Invoice No *</label>
//                 <input value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} className="w-full border-b-2 border-slate-200 outline-none py-2 font-bold text-sm" />
//                 {errors.invoiceNo && <p className="text-rose-500 text-[9px] font-black uppercase">{errors.invoiceNo}</p>}
//               </div>
//               <div className="col-span-1">
//                 <label className="text-[10px] font-black text-slate-400 uppercase">Article No</label>
//                 <input value={articleNo} onChange={(e) => setArticleNo(e.target.value)} className="w-full border-b-2 border-slate-200 outline-none py-2 font-bold text-sm" />
//               </div>
//               <div className="col-span-1">
//                 <label className="text-[10px] font-black text-slate-400 uppercase">Category *</label>
//                 <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full border-b-2 border-slate-200 outline-none py-2 font-bold text-sm bg-transparent">
//                   <option value="">Select Category</option>
//                   {activeCategories.map((cat) => (
//                     <option key={cat.id} value={cat.id}>{cat.name}</option>
//                   ))}
//                 </select>
//                 {errors.categoryId && <p className="text-rose-500 text-[9px] font-black uppercase">Required</p>}
//               </div>
//               <div className="col-span-1">
//                 <label className="text-[10px] font-black text-slate-400 uppercase">Size</label>
//                 <select value={size} onChange={(e) => setSize(e.target.value)} className="w-full border-b-2 border-slate-200 outline-none py-2 font-bold text-sm bg-transparent">
//                   <option value="">Size</option>
//                   {sizes.map((s) => <option key={s} value={s}>{s}</option>)}
//                 </select>
//               </div>
//               <div className="col-span-2">
//                 <label className="text-[10px] font-black text-slate-400 uppercase">Customer Name *</label>
//                 <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full border-b-2 border-slate-200 outline-none py-2 font-bold text-sm" />
//                 {errors.customerName && <p className="text-rose-500 text-[9px] font-black uppercase">{errors.customerName}</p>}
//               </div>
//             </div>
//             {/* ... Rest of Customer Info Fields ... */}
//             <div className="space-y-4 pt-4 border-t border-slate-100">
//                <div>
//                   <label className="text-[10px] font-black text-slate-400 uppercase">Contact Mobile</label>
//                   <input value={customerMobile} onChange={(e) => setCustomerMobile(e.target.value)} className="w-full border-b-2 border-slate-200 outline-none py-2 font-bold text-sm" />
//                 </div>
//               <div>
//                 <label className="text-[10px] font-black text-slate-400 uppercase">Billing Address</label>
//                 <input value={billingAddress} onChange={(e) => setBillingAddress(e.target.value)} className="w-full border-b-2 border-slate-200 outline-none py-2 font-bold text-sm" />
//               </div>
//             </div>
//           </div>

//           {/* Column 3: Diagnostics & Save */}
//           <div className="col-span-12 lg:col-span-3 space-y-6">
//              {/* ... Diagnostics checkboxes logic ... */}
//              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
//               <label className="block text-[10px] font-black text-slate-500 uppercase mb-4 text-center">Problem Checklist</label>
//               <div className="grid grid-cols-1 gap-2">
//                 {Object.keys(problemFlags).map((key) => (
//                   <label key={key} className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${problemFlags[key] === 'Y' ? 'bg-slate-900 text-white' : 'bg-white text-slate-500'}`}>
//                     <span className="text-[10px] font-black uppercase">{key.replace('Problem', '')}</span>
//                     <input type="checkbox" name={key} checked={problemFlags[key] === 'Y'} onChange={handleProblemChange} className="hidden" />
//                     <div className={`w-3 h-3 rounded-full ${problemFlags[key] === 'Y' ? 'bg-sky-400' : 'bg-slate-100'}`}></div>
//                   </label>
//                 ))}
//               </div>
//             </div>
//             <div>
//               <label className="text-[10px] font-black text-slate-400 uppercase">Description *</label>
//               <textarea value={problemDescription} onChange={(e) => setProblemDescription(e.target.value)} className="w-full border-2 border-slate-100 rounded-xl p-3 text-sm font-bold h-24" />
//               {errors.problemDescription && <p className="text-rose-500 text-[10px] font-black uppercase">{errors.problemDescription}</p>}
//             </div>

//             <button type="submit" disabled={loading || isCompressing} className="w-full bg-slate-900 text-white py-5 rounded-2xl text-xs font-black uppercase shadow-xl">
//               {loading ? 'Processing...' : 'Save Record'}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }




























// import React, { useEffect, useState } from 'react';
// import axios from 'axios';

// const sizes = Array.from({ length: 12 }, (_, i) => (36 + i).toString());

// export default function ItemForm({ onSaved, socket, currentUser }) {
//   const [trackingId, setTrackingId] = useState('');
//   const [type, setType] = useState(''); 
//   const [warehouse, setWarehouse] = useState('');
//   const [Returnto, setReturn] = useState('');
//   const [invoiceNo, setInvoiceNo] = useState('');
//   const [articleNo, setArticleNo] = useState('');
//   const [size, setSize] = useState('');
//   const [color, setColor] = useState('');
//   const [customerName, setCustomerName] = useState('');
//   const [billingAddress, setBillingAddress] = useState('');
//   const [customerMobile, setCustomerMobile] = useState('');
//   const [receivingDate, setReceivingDate] = useState('');
//   const [problemDescription, setProblemDescription] = useState('');
//   const [claimAmount, setClaimAmount] = useState(500); 
//   const [errors, setErrors] = useState({});
//   const [loading, setLoading] = useState(false);
//   const [message, setMessage] = useState(null);
//   const [showSuccessPopup, setShowSuccessPopup] = useState(false);
//   const [estimatedCompletionDate, setEstimatedCompletionDate] = useState('');
//   const [categoryId, setCategoryId] = useState('');
//   const [activeCategories, setActiveCategories] = useState([]);
  
//   const [problemFlags, setProblemFlags] = useState({
//     upperProblem: 'N', buckleProblem: 'N', soleProblem: 'N',
//     inSocksProblem: 'N', colorProblem: 'N', refinishingProblem: 'N',
//   });

//   useEffect(() => {
//     generateTrackingId();
//     const today = new Date();
//     setReceivingDate(today.toISOString().slice(0, 10));
//     const estimatedDate = new Date(today);
//     estimatedDate.setDate(today.getDate() + 15);
//     setEstimatedCompletionDate(estimatedDate.toISOString().slice(0, 10));
//     const fetchActiveCats = async () => {
//     const res = await axios.get('http://localhost:8080/api/categories/active'); // Sirf active dikhane ke liye
//     setActiveCategories(res.data);
//     };
//     fetchActiveCats();
//   }, []);

//   const generateTrackingId = () => setTrackingId('TRX-' + Date.now().toString().slice(-6));

//   const handleProblemChange = (e) => {
//     const { name, checked } = e.target;
//     setProblemFlags(prev => ({ ...prev, [name]: checked ? 'Y' : 'N' }));
//   };

//   const validate = () => {
//     const e = {};
//     if (!invoiceNo?.trim()) e.invoiceNo = 'Invoice is required';
//     if (!customerName?.trim()) e.customerName = 'Customer is required';
//     if (!problemDescription?.trim()) e.problemDescription = 'Problem / reason is required';
//     if (!type) e.type = 'Select Type';
//     if (type !== 'local repair') {
//       if (!warehouse) e.warehouse = 'Select Warehouse';
//       if (!Returnto) e.Returnto = "Select Dispatch Type";
//     }
//     return e;
//   };

//   const resetForm = () => {
//     setInvoiceNo(''); setArticleNo(''); setSize(''); setColor('');
//     setCustomerName(''); setBillingAddress(''); setCustomerMobile('');
//     setProblemDescription(''); setClaimAmount(500); setType('');
//     setWarehouse(''); setReturn(''); generateTrackingId();
//     setErrors({}); setMessage(null);
//     setProblemFlags({ upperProblem: 'N', buckleProblem: 'N', soleProblem: 'N', inSocksProblem: 'N', colorProblem: 'N', refinishingProblem: 'N' });
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setMessage(null);
//     const ev = validate();
//     setErrors(ev);
//     if (Object.keys(ev).length > 0) return;
    
//     if (!currentUser?.id) {
//       setMessage({ type: 'error', text: '❌ Store ID is missing.' });
//       return;
//     }

//     const payload = {
//       trackingId, invoiceNo, articleNo, size, color,
//       customerName, billingAddress, customerMobile,
//       receivingDate, estimatedCompletionDate, problemDescription,
//       claimAmount: claimAmount || 500,
//       type,
//       warehouse: type === 'local repair' ? 'LOCAL' : warehouse,
//       returnto: type === 'local repair' ? 'LOCAL' : Returnto,
//       ...problemFlags,
//       storeId: currentUser.id, 
//       categoryId: categoryId,
//     };

//     try {
//       setLoading(true);
//       const res = await axios.post('http://localhost:8080/api/items', payload);
//       if (res.data.success) {
//         setShowSuccessPopup(true);
//         setTimeout(() => setShowSuccessPopup(false), 2500);
//         if (onSaved) onSaved();
//         if (socket) socket.emit('item:created', res.data.data);
//         resetForm();
//       }
//     } catch (err) {
//       setMessage({ type: 'error', text: err.response?.data?.message || 'Request failed' });
//     } finally { setLoading(false); }
//   };

//   return (
//     <div className="w-full min-h-screen bg-slate-50 p-4 flex flex-col items-center justify-start relative overflow-x-hidden">
      
//       {/* --- SUCCESS POPUP --- */}
//       {showSuccessPopup && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
//           <div className="bg-white p-10 rounded-3xl shadow-2xl text-center border-t-8 border-green-500 animate-in fade-in zoom-in duration-500">
//             <div className="text-6xl mb-4">✅</div>
//             <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tight">Success!</h2>
//             <p className="text-slate-600 font-bold mt-2">Record saved successfully</p>
//             <p className="text-slate-400 text-xs mt-4 uppercase font-bold tracking-widest">Closing in 2 seconds...</p>
//           </div>
//         </div>
//       )}

//       {/* --- FORM CONTAINER (Full Screen Fit) --- */}
//       <div className="w-full max-w-full h-auto bg-white shadow-xl rounded-2xl border border-slate-200 overflow-hidden flex flex-col">
        
//         {/* Header */}
//         <div className="bg-slate-900 p-5 text-white flex justify-between items-center">
//           <h2 className="text-xl font-black uppercase tracking-wider">New Inventory Entry</h2>
//           {currentUser && (
//             <span className="bg-sky-500/20 text-sky-300 px-4 py-1.5 rounded-full text-xs font-black border border-sky-500/30">
//               STORE: {currentUser.name}
//             </span>
//           )}
//         </div>

//         <form onSubmit={handleSubmit} className="p-8 grid grid-cols-12 gap-8">
          
//           {/* Column 1: Dates & Service Type */}
//           <div className="col-span-12 lg:col-span-4 space-y-6 border-r border-slate-100 pr-6">
//             <div className="grid grid-cols-1 gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
//               <div>
//                 <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Tracking ID</label>
//                 <input readOnly value={trackingId} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-black text-sky-700 outline-none" />
//               </div>
//               <div className="grid grid-cols-2 gap-2">
//                 <div>
//                   <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Receiving Date</label>
//                   <input readOnly value={receivingDate} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none" />
//                 </div>
//                 <div>
//                   <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Est. Completion</label>
//                   <input readOnly value={estimatedCompletionDate} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-rose-600 outline-none" />
//                 </div>
//               </div>
//             </div>

//             <div className="space-y-3">
//               <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Service Type</label>
//               <div className="flex gap-2">
//                 {['repair', 'claim', 'local repair'].map((t) => (
//                   <button key={t} type="button" onClick={() => setType(t)} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all border-2 ${type === t ? 'bg-sky-600 text-white border-sky-600 shadow-lg' : 'bg-white text-slate-400 border-slate-200 hover:border-sky-300'}`}>{t}</button>
//                 ))}
//               </div>
//               {errors.type && <p className="text-rose-500 text-[10px] font-black uppercase">{errors.type}</p>}
//             </div>

//             {type !== 'local repair' && (
//               <div className="grid grid-cols-1 gap-4 animate-fadeIn bg-sky-50/50 p-4 rounded-2xl border border-sky-100">
//                 <div className="space-y-2">
//                   <label className="text-[10px] font-black text-sky-800 uppercase">Warehouse</label>
//                   <div className="flex gap-2">
//                     {['WHFSD', 'WHLHR'].map((wh) => (
//                       <button key={wh} type="button" onClick={() => setWarehouse(wh)} className={`flex-1 py-2 rounded-lg text-[10px] font-black transition-all border ${warehouse === wh ? 'bg-sky-700 text-white' : 'bg-white text-sky-700 border-sky-200'}`}>{wh}</button>
//                     ))}
//                   </div>
//                 </div>
//                 <div className="space-y-2">
//                   <label className="text-[10px] font-black text-indigo-800 uppercase">Return To</label>
//                   <div className="flex gap-2">
//                     {['To Customer', 'To Store'].map((ret) => (
//                       <button key={ret} type="button" onClick={() => setReturn(ret)} className={`flex-1 py-2 rounded-lg text-[10px] font-black transition-all border ${Returnto === ret ? 'bg-indigo-700 text-white' : 'bg-white text-indigo-700 border-indigo-200'}`}>{ret}</button>
//                     ))}
//                   </div>
//                 </div>
//               </div>
//             )}
//           </div>

//           {/* Column 2: Product & Customer Info */}
//           <div className="col-span-12 lg:col-span-5 space-y-6">
//             <div className="grid grid-cols-2 gap-4">
//               <div className="col-span-1">
//                 <label className="text-[10px] font-black text-slate-400 uppercase">Invoice No *</label>
//                 <input value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} className="w-full border-b-2 border-slate-200 focus:border-sky-500 outline-none py-2 font-bold text-sm" />
//                 {errors.invoiceNo && <p className="text-rose-500 text-[9px] font-black mt-1 uppercase">{errors.invoiceNo}</p>}
//               </div>
//               <div className="col-span-1">
//                 <label className="text-[10px] font-black text-slate-400 uppercase">Article No</label>
//                 <input value={articleNo} onChange={(e) => setArticleNo(e.target.value)} className="w-full border-b-2 border-slate-200 focus:border-sky-500 outline-none py-2 font-bold text-sm" />
//               </div>
//               <div className="col-span-1">
//                 <label className="text-[10px] font-black text-slate-400 uppercase">Color</label>
//                 <input value={color} onChange={(e) => setColor(e.target.value)} className="w-full border-b-2 border-slate-200 focus:border-sky-500 outline-none py-2 font-bold text-sm" />
//               </div>
//               <div className="col-span-1">
//                 <label className="text-[10px] font-black text-slate-400 uppercase">Size</label>
//                 <select value={size} onChange={(e) => setSize(e.target.value)} className="w-full border-b-2 border-slate-200 focus:border-sky-500 outline-none py-2 font-bold text-sm bg-transparent">
//                   <option value="">Select Size</option>
//                   {sizes.map((s) => <option key={s} value={s}>{s}</option>)}
//                 </select>
//               </div>
//               <div className="col-span-1">
//   <label className="text-[10px] font-black text-slate-400 uppercase">Category *</label>
//   <select 
//     value={categoryId} 
//     onChange={(e) => setCategoryId(e.target.value)} 
//     className="w-full border-b-2 border-slate-200 focus:border-sky-500 outline-none py-2 font-bold text-sm bg-transparent"
//   >
//     <option value="">Select Category</option>
//     {activeCategories.map((cat) => (
//       <option key={cat.id} value={cat.id}>{cat.name}</option>
//     ))}
//   </select>
//   {errors.categoryId && <p className="text-rose-500 text-[9px] font-black mt-1 uppercase">Select Category</p>}
// </div>
//               <div className="col-span-2">
//                 <label className="text-[10px] font-black text-slate-400 uppercase">Courier Charges (PKR)</label>
//                 <input type="number" value={claimAmount} onChange={(e) => setClaimAmount(e.target.value)} className="w-full border-b-2 border-slate-200 focus:border-green-500 outline-none py-2 font-black text-green-700 text-lg" />
//               </div>
//             </div>

//             <div className="space-y-4 pt-4 border-t border-slate-100">
//               <div className="grid grid-cols-2 gap-4">
//                 <div>
//                   <label className="text-[10px] font-black text-slate-400 uppercase">Customer Name *</label>
//                   <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full border-b-2 border-slate-200 focus:border-sky-500 outline-none py-2 font-bold text-sm" />
//                   {errors.customerName && <p className="text-rose-500 text-[9px] font-black mt-1 uppercase">{errors.customerName}</p>}
//                 </div>
//                 <div>
//                   <label className="text-[10px] font-black text-slate-400 uppercase">Contact Mobile</label>
//                   <input value={customerMobile} onChange={(e) => setCustomerMobile(e.target.value)} className="w-full border-b-2 border-slate-200 focus:border-sky-500 outline-none py-2 font-bold text-sm" />
//                 </div>
//               </div>
//               <div>
//                 <label className="text-[10px] font-black text-slate-400 uppercase">Billing Address</label>
//                 <input value={billingAddress} onChange={(e) => setBillingAddress(e.target.value)} className="w-full border-b-2 border-slate-200 focus:border-sky-500 outline-none py-2 font-bold text-sm" />
//               </div>
//             </div>
//           </div>

//           {/* Column 3: Diagnostics & Submit */}
//           <div className="col-span-12 lg:col-span-3 space-y-6">
//             <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
//               <label className="block text-[10px] font-black text-slate-500 uppercase mb-4 text-center tracking-tighter">Problem Checklist</label>
//               <div className="grid grid-cols-1 gap-2">
//                 {Object.keys(problemFlags).map((key) => (
//                   <label key={key} className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${problemFlags[key] === 'Y' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-slate-200 text-slate-500'}`}>
//                     <span className="text-[10px] font-black uppercase tracking-tight">{key.replace('Problem', '')} Issue</span>
//                     <input type="checkbox" name={key} checked={problemFlags[key] === 'Y'} onChange={handleProblemChange} className="hidden" />
//                     <div className={`w-3 h-3 rounded-full border ${problemFlags[key] === 'Y' ? 'bg-sky-400' : 'bg-slate-100'}`}></div>
//                   </label>
//                 ))}
//               </div>
//             </div>

//             <div>
//               <label className="text-[10px] font-black text-slate-400 uppercase">Problem Description *</label>
//               <textarea value={problemDescription} onChange={(e) => setProblemDescription(e.target.value)} className="w-full border-2 border-slate-100 rounded-xl p-3 text-sm font-bold focus:border-sky-500 outline-none resize-none h-24" rows="3"></textarea>
//               {errors.problemDescription && <p className="text-rose-500 text-[10px] font-black mt-1 uppercase">{errors.problemDescription}</p>}
//             </div>

//             {/* Error Message Above Save Button */}
//             {message && message.type === 'error' && (
//               <div className="p-3 rounded-lg bg-rose-100 text-rose-700 text-[10px] font-black uppercase text-center animate-bounce">
//                 {message.text}
//               </div>
//             )}

//             <div className="space-y-3">
//               <button type="submit" disabled={loading || !currentUser} className="w-full bg-slate-900 hover:bg-black text-white py-5 rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95 disabled:opacity-50">
//                 {loading ? 'Processing...' : 'Save Record'}
//               </button>
//               <button type="button" onClick={resetForm} className="w-full py-2 text-[10px] font-black uppercase text-slate-400 hover:text-rose-500 transition-all tracking-widest text-center">Reset Form</button>
//             </div>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }
































// import React, { useEffect, useState } from 'react';
// import axios from 'axios';

// const sizes = Array.from({ length: 12 }, (_, i) => (36 + i).toString());

// // ⭐ Receive currentUser as a prop from App.jsx
// export default function ItemForm({ onSaved, socket, currentUser }) { 
//   const [trackingId, setTrackingId] = useState('');
//   const [type, setType] = useState('');
//   const [warehouse, setWarehouse] = useState('');
//   const [Returnto, setReturn] = useState('');
//   const [invoiceNo, setInvoiceNo] = useState('');
//   const [articleNo, setArticleNo] = useState('');
//   const [size, setSize] = useState('');
//   const [color, setColor] = useState('');
//   const [customerName, setCustomerName] = useState('');
//   const [billingAddress, setBillingAddress] = useState('');
//   const [customerMobile, setCustomerMobile] = useState('');
//   const [receivingDate, setReceivingDate] = useState('');
//   const [problemDescription, setProblemDescription] = useState('');
//   //const [repairChargeEstimate, setRepairChargeEstimate] = useState(500);
//   const [claimAmount, setClaimAmount] = useState(500);
//   const [errors, setErrors] = useState({});
//   const [loading, setLoading] = useState(false);
//   const [message, setMessage] = useState(null);
//   const [estimatedCompletionDate, setEstimatedCompletionDate] = useState('');
//   const [problemFlags, setProblemFlags] = useState({
//     upperProblem: 'N',
//     buckleProblem: 'N',
//     soleProblem: 'N',
//     inSocksProblem: 'N',
//     colorProblem: 'N',
//     refinishingProblem: 'N',
//     });
//   const handleProblemChange = (e) => {
//   const { name, checked } = e.target;
//   setProblemFlags(prev => ({
//     ...prev,
//     [name]: checked ? 'Y' : 'N',
//     }));
//   };


// //   useEffect(() => {
// //     generateTrackingId();
// //     setReceivingDate(new Date().toISOString().slice(0, 10));

// //   }, []);
// useEffect(() => {
//   generateTrackingId();

//   const today = new Date();
//   setReceivingDate(today.toISOString().slice(0, 10));

//   const estimatedDate = new Date(today);
//   estimatedDate.setDate(today.getDate() + 15);
//   setEstimatedCompletionDate(estimatedDate.toISOString().slice(0, 10));
// }, []);


//   const generateTrackingId = () =>
//     setTrackingId('TRX-' + Date.now().toString().slice(-6));

//   const validate = () => {
//     const e = {};
//     if (!invoiceNo?.trim()) e.invoiceNo = 'Invoice is required';
//     if (!customerName?.trim()) e.customerName = 'Customer is required';
//     if (!problemDescription?.trim()) e.problemDescription = 'Problem / reason is required';
//     if (!type) e.type = 'Select Repair or Claim';
//     if (!warehouse) e.warehouse = 'Select Warehouse';
//     if (!Returnto) e.Returnto = "Select Dispatch Type" 
//     return e;
//   };

//   const resetForm = () => {
//     setInvoiceNo('');
//     setArticleNo('');
//     setSize('');
//     setColor('');
//     setCustomerName('');
//     setBillingAddress('');
//     setCustomerMobile('');
//     setProblemDescription('');
//     //setRepairChargeEstimate('');
//     setClaimAmount('');
//     setType('');
//     setWarehouse('');
//     setReturn('');
//     generateTrackingId();
//     setReceivingDate(new Date().toISOString().slice(0, 10));
//     setErrors({});
//     setMessage(null);
//     //setProblemFlags('');
//     setProblemFlags({
//       upperProblem: 'N',
//       buckleProblem: 'N',
//       soleProblem: 'N',
//       inSocksProblem: 'N',
//       colorProblem: 'N',
//       refinishingProblem: 'N',
//     });
//     setEstimatedCompletionDate(new Date().toISOString().slice(0, 10));
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setMessage(null);
//     const ev = validate();
//     setErrors(ev);
//     if (Object.keys(ev).length > 0) return;
    
//     // ⭐ Validation: Stop submission if the logged-in user data is missing
//     if (!currentUser || !currentUser.id) {
//         setMessage({ type: 'error', text: '❌ Store ID is missing. Please log in again.' });
//         return;
//     }

//     const payload = {
//       trackingId,
//       invoiceNo,
//       articleNo,
//       size,
//       color,
//       customerName,
//       billingAddress,
//       customerMobile,
//       receivingDate,
//       estimatedCompletionDate,
//       problemDescription,
//       //repairChargeEstimate: repairChargeEstimate || null,
//       claimAmount: claimAmount || null,
//       type,
//       warehouse,
//       returnto: Returnto,
//       upperProblem: problemFlags.upperProblem,
//       buckleProblem: problemFlags.buckleProblem,
//       soleProblem: problemFlags.soleProblem,
//       inSocksProblem: problemFlags.inSocksProblem,
//       colorProblem: problemFlags.colorProblem,
//       refinishingProblem: problemFlags.refinishingProblem,
//       // ⭐ THE FIX: Attach the Store ID from the prop
//       storeId: currentUser.id, 
//     };

//     try {
//       setLoading(true);
//       const res = await axios.post('http://localhost:8080/api/items', payload);

//       if ((res.data && res.data.success) || res.status === 201) {
//         setMessage({ type: 'success', text: '✅ Record saved successfully.' });
//         if (onSaved) onSaved();
//         if (socket) socket.emit('item:created', res.data.data || payload);
//         resetForm();
//       } else {
//         setMessage({ type: 'error', text: res.data.message || 'Save failed' });
//       }
//     } catch (err) {
//       console.error('Save error:', err);
//       setMessage({
//         type: 'error',
//         text: err?.response?.data?.message || err.message || 'Request failed',
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <form onSubmit={handleSubmit} className="space-y-3 text-sm">
//       <h2 className="text-lg font-medium">Add Item</h2>
      
//       {/* Visual confirmation of logged-in user */}
//       {currentUser && (
//         <div className="bg-sky-50 text-sky-700 px-3 py-1 rounded text-xs">
//           Creating item for Store Name: <strong>{currentUser.name}</strong> (Type: {currentUser.type})
//         </div>
//       )}

//      {/* Tracking ID, Receiving Date & Estimated Completion Date */}
// <div className="grid grid-cols-1 md:grid-cols-3 gap-2">

//   <div>
//     <label className="block text-xs">Tracking ID</label>
//     <input
//       readOnly
//       value={trackingId}
//       className="w-full border rounded px-3 py-2 bg-slate-50"
//     />
//   </div>

//   <div>
//     <label className="block text-xs">Receiving Date</label>
//     <input
//       readOnly
//       value={receivingDate}
//       className="w-full border rounded px-3 py-2 bg-slate-50"
//     />
//   </div>

//   <div>
//     <label className="block text-xs">Estimated Completion Date</label>
//     <input
//       readOnly
//       value={estimatedCompletionDate}
//       className="w-full border rounded px-3 py-2 bg-slate-50"
//     />
//   </div>

// </div>


//       {/* Type Selection */}
//       <div>
//         <label className="text-xs">Type</label>
//         <div className="flex gap-2 mt-1">
//           <button
//             type="button"
//             onClick={() => setType('repair')}
//             className={`px-3 py-1 rounded ${
//               type === 'repair' ? 'bg-sky-600 text-white' : 'bg-sky-100 text-sky-700'
//             }`}
//           >
//             Repair
//           </button>
//           <button
//             type="button"
//             onClick={() => setType('claim')}
//             className={`px-3 py-1 rounded ${
//               type === 'claim' ? 'bg-sky-600 text-white' : 'bg-sky-100 text-sky-700'
//             }`}
//           >
//             Claim
//           </button>
//         <button
//             type="button"
//             onClick={() => setType('local repair')}
//             className={`px-3 py-1 rounded ${
//               type === 'local repair' ? 'bg-sky-600 text-white' : 'bg-sky-100 text-sky-700'
//             }`}
//           >
//             Local Repair
//           </button>
//         </div>
//         {errors.type && <div className="text-red-600 text-xs mt-1">{errors.type}</div>}
//       </div>

//       {/* Warehouse Selection */}
//       <div>
//         <label className="text-xs">Warehouse</label>
//         <div className="flex gap-2 mt-1">
//           <button
//             type="button"
//             onClick={() => setWarehouse('WHFSD')}
//             className={`px-3 py-1 rounded ${
//               warehouse === 'WHFSD' ? 'bg-sky-600 text-white' : 'bg-sky-100 text-sky-700'
//             }`}
//           >
//             WHFSD
//           </button>
//           <button
//             type="button"
//             onClick={() => setWarehouse('WHLHR')}
//             className={`px-3 py-1 rounded ${
//               warehouse === 'WHLHR' ? 'bg-sky-600 text-white' : 'bg-sky-100 text-sky-700'
//             }`}
//           >
//             WHLHR
//           </button>
//         </div>
//         {errors.warehouse && <div className="text-red-600 text-xs mt-1">{errors.warehouse}</div>}
//       </div>
//       {/* Returnto Selection */}
//       <div>
//         <label className="text-xs">Return To</label>
//         <div className="flex gap-2 mt-1">
//           <button
//             type="button"
//             onClick={() => setReturn('To Customer')}
//             className={`px-3 py-1 rounded ${
//               Returnto === 'To Customer' ? 'bg-sky-600 text-white' : 'bg-sky-100 text-sky-700'
//             }`}
//           >
//             To Customer
//           </button>
//           <button
//             type="button"
//             onClick={() => setReturn('To Store')}
//             className={`px-3 py-1 rounded ${
//               Returnto === 'To Store' ? 'bg-sky-600 text-white' : 'bg-sky-100 text-sky-700'
//             }`}
//           >
//             To Store
//           </button>
//         </div>
//         {errors.Returnto && <div className="text-red-600 text-xs mt-1">{errors.Returnto}</div>}
//       </div>

//       {/* Invoice & Article */}
//       <div className="grid md:grid-cols-2 gap-2">
//         <div>
//           <label className="text-xs">Purchasing Invoice No *</label>
//           <input
//             value={invoiceNo}
//             onChange={(e) => setInvoiceNo(e.target.value)}
//             className="w-full border rounded px-3 py-2"
//           />
//           {errors.invoiceNo && (
//             <div className="text-red-600 text-xs mt-1">{errors.invoiceNo}</div>
//           )}
//         </div>
//         <div>
//           <label className="text-xs">Article No</label>
//           <input
//             value={articleNo}
//             onChange={(e) => setArticleNo(e.target.value)}
//             className="w-full border rounded px-3 py-2"
//           />
//         </div>
//       </div>

//       {/* Size, Color, Estimate */}
//       <div className="grid grid-cols-3 gap-2">
//         <div>
//           <label className="text-xs">Size</label>
//           <select
//             value={size}
//             onChange={(e) => setSize(e.target.value)}
//             className="w-full border rounded px-2 py-2"
//           >
//             <option value="">Select size</option>
//             {sizes.map((s) => (
//               <option key={s} value={s}>{s}</option>
//             ))}
//           </select>
//         </div>
//         <div>
//           <label className="text-xs">Color</label>
//           <input
//             value={color}
//             onChange={(e) => setColor(e.target.value)}
//             className="w-full border rounded px-3 py-2"
//           />
//         </div>
// {/*         <div>
//           <label className="text-xs">Repair Estimate</label>
//           <input
//             value={repairChargeEstimate}
//             onChange={(e) => setRepairChargeEstimate(e.target.value)}
//             className="w-full border rounded px-3 py-2"
//           />
//         </div> */}
//       </div>

//       {/* Customer Info */}
//       <div>
//         <label className="text-xs">Customer Name *</label>
//         <input
//           value={customerName}
//           onChange={(e) => setCustomerName(e.target.value)}
//           className="w-full border rounded px-3 py-2"
//         />
//         {errors.customerName && (
//           <div className="text-red-600 text-xs mt-1">{errors.customerName}</div>
//         )}
//       </div>

//       <div>
//         <label className="text-xs">Billing Address</label>
//         <textarea
//           value={billingAddress}
//           onChange={(e) => setBillingAddress(e.target.value)}
//           className="w-full border rounded px-3 py-2"
//           rows="2"
//         ></textarea>
//       </div>

//       <div className="grid grid-cols-2 gap-2">
//         <div>
//           <label className="text-xs">Customer Mobile</label>
//           <input
//             value={customerMobile}
//             onChange={(e) => setCustomerMobile(e.target.value)}
//             className="w-full border rounded px-3 py-2"
//           />
//         </div>
// {/*         <div>
//           {type === 'claim' ? (
//             <>
//               <label className="text-xs">Claim Courier Charges</label>
//               <input
//                 value={claimAmount}
//                 onChange={(e) => setClaimAmount(e.target.value)}
//                 className="w-full border rounded px-3 py-2"
//               />
//             </>
//           )
//          : (
//             <>
//               <label className="text-xs">Repair Courier Charges</label>
//               <input
//                 value={repairChargeEstimate}
//                 onChange={(e) => setRepairChargeEstimate(e.target.value)}
//                 className="w-full border rounded px-3 py-2"
//               />
//             </>
//           )
//         }
//         </div> */}
//       </div>
//               {/* Problem Type Checkboxes */}
// <div className="border rounded p-3 bg-slate-50">
//   <label className="block text-xs font-medium mb-2">
//     Problem Type (Select all that apply)
//   </label>

//   <div className="grid grid-cols-2 gap-2 text-xs">
//     <label className="flex items-center gap-2">
//       <input
//         type="checkbox"
//         name="upperProblem"
//         checked={problemFlags.upperProblem === 'Y'}
//         onChange={handleProblemChange}
//       />
//       Upper Problem
//     </label>

//     <label className="flex items-center gap-2">
//       <input
//         type="checkbox"
//         name="buckleProblem"
//         checked={problemFlags.buckleProblem === 'Y'}
//         onChange={handleProblemChange}
//       />
//       Buckle Problem
//     </label>

//     <label className="flex items-center gap-2">
//       <input
//         type="checkbox"
//         name="soleProblem"
//         checked={problemFlags.soleProblem === 'Y'}
//         onChange={handleProblemChange}
//       />
//       Sole Problem
//     </label>

//     <label className="flex items-center gap-2">
//       <input
//         type="checkbox"
//         name="inSocksProblem"
//         checked={problemFlags.inSocksProblem === 'Y'}
//         onChange={handleProblemChange}
//       />
//       In-Socks Problem
//     </label>

//     <label className="flex items-center gap-2">
//       <input
//         type="checkbox"
//         name="colorProblem"
//         checked={problemFlags.colorProblem === 'Y'}
//         onChange={handleProblemChange}
//       />
//       Color Problem
//     </label>

//     <label className="flex items-center gap-2">
//       <input
//         type="checkbox"
//         name="refinishingProblem"
//         checked={problemFlags.refinishingProblem === 'Y'}
//         onChange={handleProblemChange}
//       />
//       Refinishing Problem
//     </label>
//   </div>
// </div>

//       {/* Problem Description */}
//       <div>
//         <label className="text-xs">Problem / Claim Reason *</label>
//         <textarea
//           value={problemDescription}
//           onChange={(e) => setProblemDescription(e.target.value)}
//           className="w-full border rounded px-3 py-2"
//           rows="3"
//         ></textarea>
//         {errors.problemDescription && (
//           <div className="text-red-600 text-xs mt-1">
//             {errors.problemDescription}
//           </div>
//         )}
//       </div>

//       {/* Buttons */}
//       <div className="flex gap-2">
//         <button
//           type="submit"
//           disabled={loading || !currentUser}
//           className="bg-sky-700 text-white px-4 py-2 rounded"
//         >
//           {loading ? 'Saving...' : 'Save'}
//         </button>
//         <button
//           type="button"
//           onClick={resetForm}
//           className="px-3 py-2 rounded border"
//         >
//           Reset
//         </button>
//       </div>

//       {message && (
//         <div
//           className={`mt-2 ${
//             message.type === 'success' ? 'text-green-600' : 'text-red-600'
//           }`}
//         >
//           {message.text}
//         </div>
//       )}
//     </form>
//   );
// }


import React, { useState, useEffect } from 'react';
import { FaPlus, FaToggleOn, FaToggleOff, FaBoxes, FaTruck, FaPalette, FaRulerCombined } from 'react-icons/fa';
import axios from '../axiosConfig';

export default function CategoryPage() {
  // ================= EXISTING STATE =================
  const [categories, setCategories] = useState([]);
  const [newName, setNewName] = useState('');

  const [couriers, setCouriers] = useState([]);
  const [newCourier, setNewCourier] = useState('');

  const [colors, setColors] = useState([]);
  const [newColor, setNewColor] = useState('');

  const [sizes, setSizes] = useState([]);
  const [newSize, setNewSize] = useState('');

  useEffect(() => { 
    fetchCategories(); 
    fetchCouriers();
    fetchColors();
    fetchSizes();
  }, []);

  // ================= FUNCTIONS =================
  const fetchCategories = async () => {
    const res = await axios.get('/categories/all');
    setCategories(res.data);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newName) return;
    await axios.post('/categories', { name: newName });
    setNewName('');
    fetchCategories();
  };

  const toggleStatus = async (id, currentStatus) => {
    await axios.put(`/categories/${id}`, { isActive: !currentStatus });
    fetchCategories();
  };

  const fetchCouriers = async () => {
    const res = await axios.get('/couriers/all');
    setCouriers(res.data);
  };

  const handleAddCourier = async (e) => {
    e.preventDefault();
    if (!newCourier) return;
    await axios.post('/couriers', { name: newCourier });
    setNewCourier('');
    fetchCouriers();
  };

  const toggleCourier = async (id, currentStatus) => {
    await axios.put(`/couriers/${id}`, { isActive: !currentStatus });
    fetchCouriers();
  };

  const fetchColors = async () => {
    const res = await axios.get('/colors/all');
    setColors(res.data);
  };

  const handleAddColor = async (e) => {
    e.preventDefault();
    if (!newColor) return;
    await axios.post('/colors', { name: newColor });
    setNewColor('');
    fetchColors();
  };

  const toggleColor = async (id, currentStatus) => {
    await axios.put(`/colors/${id}`, { isActive: !currentStatus });
    fetchColors();
  };

  const fetchSizes = async () => {
    const res = await axios.get('/sizes/all');
    setSizes(res.data);
  };

  const handleAddSize = async (e) => {
    e.preventDefault();
    if (!newSize) return;
    await axios.post('/sizes', { name: newSize });
    setNewSize('');
    fetchSizes();
  };

  const toggleSize = async (id, currentStatus) => {
    await axios.put(`/sizes/${id}`, { isActive: !currentStatus });
    fetchSizes();
  };

  return (
    <div className="p-4 md:p-8 bg-slate-100 min-h-screen">
      {/* Dashboard Main Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight uppercase">Attributes Management</h1>
        <p className="text-sm text-slate-500 font-medium">Configure and manage your shop configuration variants and logic settings.</p>
      </div>

      {/* Modern Responsive Grid Setup */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* 1. CATEGORY MANAGER */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden flex flex-col h-[480px]">
          <div className="bg-slate-900 px-6 py-4 text-white flex items-center gap-3 shrink-0">
            <FaBoxes className="text-sky-400 text-xl" />
            <h2 className="text-lg font-bold tracking-wide uppercase">Category Manager</h2>
            <span className="ml-auto bg-slate-800 text-xs px-2.5 py-1 rounded-full font-bold text-sky-400">{categories.length} Items</span>
          </div>

          <form onSubmit={handleAdd} className="p-4 bg-slate-50 border-b border-slate-200 flex gap-2 shrink-0">
            <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="New Category Name..."
              className="flex-1 bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 placeholder-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none transition-all" />
            <button type="submit" className="bg-sky-600 text-white px-5 py-2.5 rounded-xl text-sm font-black flex items-center gap-2 hover:bg-sky-700 active:scale-95 transition-all shadow-sm shadow-sky-200">
              <FaPlus /> ADD
            </button>
          </form>

          <div className="p-6 overflow-y-auto space-y-2.5 flex-1 custom-scrollbar">
            {categories.map(cat => (
              <div key={cat.id} className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-slate-100 shadow-sm hover:border-slate-300/70 transition-all">
                <span className={`text-sm font-bold tracking-wide ${!cat.isActive ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{cat.name}</span>
                <button onClick={() => toggleStatus(cat.id, cat.isActive)} className={`transition-colors duration-200 ${cat.isActive ? "text-emerald-500 hover:text-emerald-600" : "text-slate-300 hover:text-slate-400"}`}>
                  {cat.isActive ? <FaToggleOn size={26} /> : <FaToggleOff size={26} />}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 2. COURIER MANAGER */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden flex flex-col h-[480px]">
          <div className="bg-slate-900 px-6 py-4 text-white flex items-center gap-3 shrink-0">
            <FaTruck className="text-amber-400 text-xl" />
            <h2 className="text-lg font-bold tracking-wide uppercase">Courier Manager</h2>
            <span className="ml-auto bg-slate-800 text-xs px-2.5 py-1 rounded-full font-bold text-amber-400">{couriers.length} Providers</span>
          </div>

          <form onSubmit={handleAddCourier} className="p-4 bg-slate-50 border-b border-slate-200 flex gap-2 shrink-0">
            <input value={newCourier} onChange={e => setNewCourier(e.target.value)} placeholder="New Courier Name..."
              className="flex-1 bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 placeholder-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none transition-all" />
            <button type="submit" className="bg-sky-600 text-white px-5 py-2.5 rounded-xl text-sm font-black flex items-center gap-2 hover:bg-sky-700 active:scale-95 transition-all shadow-sm shadow-sky-200">
              <FaPlus /> ADD
            </button>
          </form>

          <div className="p-6 overflow-y-auto space-y-2.5 flex-1 custom-scrollbar">
            {couriers.map(courier => (
              <div key={courier.id} className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-slate-100 shadow-sm hover:border-slate-300/70 transition-all">
                <span className={`text-sm font-bold tracking-wide ${!courier.isActive ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{courier.name}</span>
                <button onClick={() => toggleCourier(courier.id, courier.isActive)} className={`transition-colors duration-200 ${courier.isActive ? "text-emerald-500 hover:text-emerald-600" : "text-slate-300 hover:text-slate-400"}`}>
                  {courier.isActive ? <FaToggleOn size={26} /> : <FaToggleOff size={26} />}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 3. COLOR MANAGER */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden flex flex-col h-[480px]">
          <div className="bg-slate-900 px-6 py-4 text-white flex items-center gap-3 shrink-0">
            <FaPalette className="text-fuchsia-400 text-xl" />
            <h2 className="text-lg font-bold tracking-wide uppercase">Color Manager</h2>
            <span className="ml-auto bg-slate-800 text-xs px-2.5 py-1 rounded-full font-bold text-fuchsia-400">{colors.length} Variants</span>
          </div>

          <form onSubmit={handleAddColor} className="p-4 bg-slate-50 border-b border-slate-200 flex gap-2 shrink-0">
            <input value={newColor} onChange={e => setNewColor(e.target.value)} placeholder="New Color Name..."
              className="flex-1 bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 placeholder-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none transition-all" />
            <button type="submit" className="bg-sky-600 text-white px-5 py-2.5 rounded-xl text-sm font-black flex items-center gap-2 hover:bg-sky-700 active:scale-95 transition-all shadow-sm shadow-sky-200">
              <FaPlus /> ADD
            </button>
          </form>

          <div className="p-6 overflow-y-auto space-y-2.5 flex-1 custom-scrollbar">
            {colors.map(color => (
              <div key={color.id} className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-slate-100 shadow-sm hover:border-slate-300/70 transition-all">
                <span className={`text-sm font-bold tracking-wide ${!color.isActive ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{color.name}</span>
                <button onClick={() => toggleColor(color.id, color.isActive)} className={`transition-colors duration-200 ${color.isActive ? "text-emerald-500 hover:text-emerald-600" : "text-slate-300 hover:text-slate-400"}`}>
                  {color.isActive ? <FaToggleOn size={26} /> : <FaToggleOff size={26} />}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 4. SIZE MANAGER */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden flex flex-col h-[480px]">
          <div className="bg-slate-900 px-6 py-4 text-white flex items-center gap-3 shrink-0">
            <FaRulerCombined className="text-teal-400 text-xl" />
            <h2 className="text-lg font-bold tracking-wide uppercase">Size Manager</h2>
            <span className="ml-auto bg-slate-800 text-xs px-2.5 py-1 rounded-full font-bold text-teal-400">{sizes.length} Sizes</span>
          </div>

          <form onSubmit={handleAddSize} className="p-4 bg-slate-50 border-b border-slate-200 flex gap-2 shrink-0">
            <input value={newSize} onChange={e => setNewSize(e.target.value)} placeholder="New Size Name..."
              className="flex-1 bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 placeholder-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none transition-all" />
            <button type="submit" className="bg-sky-600 text-white px-5 py-2.5 rounded-xl text-sm font-black flex items-center gap-2 hover:bg-sky-700 active:scale-95 transition-all shadow-sm shadow-sky-200">
              <FaPlus /> ADD
            </button>
          </form>

          <div className="p-6 overflow-y-auto space-y-2.5 flex-1 custom-scrollbar">
            {sizes.map(size => (
              <div key={size.id} className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-slate-100 shadow-sm hover:border-slate-300/70 transition-all">
                <span className={`text-sm font-bold tracking-wide ${!size.isActive ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{size.name}</span>
                <button onClick={() => toggleSize(size.id, size.isActive)} className={`transition-colors duration-200 ${size.isActive ? "text-emerald-500 hover:text-emerald-600" : "text-slate-300 hover:text-slate-400"}`}>
                  {size.isActive ? <FaToggleOn size={26} /> : <FaToggleOff size={26} />}
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}








// import React, { useState, useEffect } from 'react';
// import { FaPlus, FaTrash, FaToggleOn, FaToggleOff } from 'react-icons/fa';
// import axios from '../axiosConfig';

// export default function CategoryPage() {
//   const [categories, setCategories] = useState([]);
//   const [newName, setNewName] = useState('');

//   useEffect(() => { fetchCategories(); }, []);

//   const fetchCategories = async () => {
//     const res = await axios.get('/categories/all');
//     setCategories(res.data);
//   };

//   const handleAdd = async (e) => {
//     e.preventDefault();
//     if (!newName) return;
//     await axios.post('/categories', { name: newName });
//     setNewName('');
//     fetchCategories();
//   };

//   const toggleStatus = async (id, currentStatus) => {
//     await axios.put(`/categories/${id}`, { isActive: !currentStatus });
//     fetchCategories();
//   };

//   return (
//     <div className="p-8 bg-slate-50 min-h-screen">
//       <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
//         <div className="bg-slate-900 p-6 text-white text-center">
//           <h2 className="text-2xl font-black uppercase">Category Manager</h2>
//         </div>

//         <form onSubmit={handleAdd} className="p-6 flex gap-2">
//           <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="New Category Name..."
//             className="flex-1 border-2 border-slate-200 rounded-xl px-4 py-2 font-bold focus:border-sky-500 outline-none" />
//           <button type="submit" className="bg-sky-600 text-white px-6 py-2 rounded-xl font-black flex items-center gap-2 hover:bg-sky-700">
//             <FaPlus /> ADD
//           </button>
//         </form>

//         <div className="p-6 space-y-2">
//           {categories.map(cat => (
//             <div key={cat.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
//               <span className={`font-bold ${!cat.isActive ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{cat.name}</span>
//               <div className="flex gap-4">
//                 <button onClick={() => toggleStatus(cat.id, cat.isActive)} className={cat.isActive ? "text-green-500" : "text-slate-400"}>
//                   {cat.isActive ? <FaToggleOn size={24} /> : <FaToggleOff size={24} />}
//                 </button>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// }
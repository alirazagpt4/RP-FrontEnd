import React, { useState, useEffect } from 'react';
import { FaPlus, FaTrash, FaToggleOn, FaToggleOff } from 'react-icons/fa';
import axios from '../axiosConfig';

export default function CategoryPage() {
  const [categories, setCategories] = useState([]);
  const [newName, setNewName] = useState('');

  useEffect(() => { fetchCategories(); }, []);

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

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-slate-900 p-6 text-white text-center">
          <h2 className="text-2xl font-black uppercase">Category Manager</h2>
        </div>

        <form onSubmit={handleAdd} className="p-6 flex gap-2">
          <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="New Category Name..."
            className="flex-1 border-2 border-slate-200 rounded-xl px-4 py-2 font-bold focus:border-sky-500 outline-none" />
          <button type="submit" className="bg-sky-600 text-white px-6 py-2 rounded-xl font-black flex items-center gap-2 hover:bg-sky-700">
            <FaPlus /> ADD
          </button>
        </form>

        <div className="p-6 space-y-2">
          {categories.map(cat => (
            <div key={cat.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className={`font-bold ${!cat.isActive ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{cat.name}</span>
              <div className="flex gap-4">
                <button onClick={() => toggleStatus(cat.id, cat.isActive)} className={cat.isActive ? "text-green-500" : "text-slate-400"}>
                  {cat.isActive ? <FaToggleOn size={24} /> : <FaToggleOff size={24} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
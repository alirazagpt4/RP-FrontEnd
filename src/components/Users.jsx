import React, { useState, useEffect } from 'react';
import axios from '../axiosConfig';

export default function User({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  const initialFormState = {
    name: '', shortName: '', city: '', phone: '',
    email: '', address: '', region: '', type: 'Store', password: '', isActive: true, managerId: null
  };
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get('/users');
      setUsers(res.data);
    } catch (err) { console.error("Error fetching users", err); }
  };

  const handleEdit = (user) => {
    // Database se assignedUsers "1,2" string milti hai, isko array [1, 2] banayein
    const managerIds = user.assignedUsers ? user.assignedUsers.split(',') : [];

    setFormData({
      ...user,
      managerIds: managerIds
    });
    setEditingId(user.id);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleView = (user) => {
    setSelectedUser(user);
    setShowViewModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEditing) {
        await axios.put(`/users/${editingId}`, formData);
      } else {
        await axios.post('/users', formData);
      }
      closeModal();
      fetchUsers();
    } catch (err) { alert("Error: " + err.message); }
    finally { setLoading(false); }
  };

  const toggleStatus = async (user) => {
    try {
      await axios.put(`/users/${user.id}`, { isActive: !user.isActive });
      fetchUsers();
    } catch (err) { alert("Failed to update status"); }
  };

  const deleteUser = async (id) => {
    if (window.confirm("🚨 Are you sure? This action cannot be undone.")) {
      try { await axios.delete(`/users/${id}`); fetchUsers(); }
      catch (err) { alert("Delete failed"); }
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setIsEditing(false);
    setEditingId(null);
    setFormData(initialFormState);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Section */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-2xl font-bold text-sky-900">User Matrix</h2>
          <p className="text-sm text-gray-500">Manage system access and store profiles</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-sky-600 hover:bg-sky-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 transition-all shadow-md active:scale-95"
        >
          <span>➕</span> Add New User
        </button>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-wider">Store / Admin</th>
              <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-wider">Type</th>
              <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
              <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">Actions</th>

            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {users.map(u => (
              <tr key={u.id} className={`hover:bg-sky-50 transition-colors ${!u.isActive ? 'bg-gray-50' : ''}`}>
                <td className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center font-bold">
                      {u.name.charAt(0)}
                    </div>
                    <div>
                      <p className={`font-bold ${!u.isActive ? 'text-gray-400' : 'text-gray-800'}`}>{u.name}</p>
                      <p className="text-xs text-gray-400">{u.shortName}</p>
                    </div>
                  </div>
                </td>
                <td className="p-5 text-sm font-medium text-gray-600">{u.type}</td>
                <td className="p-5">
                  <button
                    onClick={() => toggleStatus(u)}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 shadow-sm transition-all ${u.isActive ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'
                      }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${u.isActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                    {u.isActive ? 'Active' : 'Disabled'}
                  </button>
                </td>
                <td className="p-5">
                  <div className="flex flex-wrap gap-1">
                    {u.assignedUsers && u.assignedUsers.length > 0 ? (
                      u.assignedUsers.split(',').map(id => {
                        const manager = users.find(usr => usr.id === parseInt(id));
                        return manager ? (
                          <span key={id} className="bg-sky-100 text-sky-700 text-[10px] px-2 py-0.5 rounded-full font-bold">
                            {manager.name}
                          </span>
                        ) : null;
                      })
                    ) : (
                      <span className="text-gray-400 text-xs">No Head Assigned</span>
                    )}
                  </div>
                </td>
                <td className="p-5 text-center">
                  <div className="flex justify-center items-center gap-2">
                    <button onClick={() => handleView(u)} className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors" title='View Profile'>👁️</button>
                    <button onClick={() => handleEdit(u)} className="p-2 bg-sky-100 text-sky-600 rounded-lg hover:bg-sky-200 transition-colors" title='Edit User'>✏️</button>
                    <button disabled className="p-2 bg-gray-50 text-gray-300 rounded-lg cursor-not-allowed" title='Delete Disabled'>🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- ADD/EDIT MODAL --- */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl p-5 md:p-8 w-full max-w-2xl shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h3 className="text-2xl font-bold text-gray-800">{isEditing ? '✏️ Edit Profile' : '➕ Create User'}</h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
            </div>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-600">Full Name</label>
                <input value={formData.name} className="w-full border p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-sky-500" onChange={e => setFormData({ ...formData, name: e.target.value })} required />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-600">Short Name (ID)</label>
                <input value={formData.shortName} className="w-full border p-2.5 rounded-xl bg-gray-50 cursor-not-allowed" onChange={e => setFormData({ ...formData, shortName: e.target.value })} required disabled={isEditing} title="ID cannot be changed" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-600">Email Address</label>
                <input value={formData.email} type="email" className="w-full border p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-sky-500" onChange={e => setFormData({ ...formData, email: e.target.value })} required />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-600">Password</label>
                <input value={formData.password} type="text" className="w-full border p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-sky-500" onChange={e => setFormData({ ...formData, password: e.target.value })} required />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-600">User Type</label>
                <select className="w-full border p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-sky-500" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                  <option value="Store">Store</option>
                  <option value="Warehouse">Warehouse</option>
                  <option value="Admin">Admin</option>
                  <option value="User">User</option>
                </select>
              </div>


              
              <div className="col-span-2 space-y-1">
                <label className="text-sm font-semibold text-gray-600">Assign Heads (Select Multiple)</label>
                <select
                  multiple // <--- Multiple select enabled
                  className="w-full border p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-sky-500 h-32"
                  value={formData.managerIds || []}
                  onChange={e => {
                    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
                    setFormData({ ...formData, managerIds: selectedOptions });
                  }}
                >
                  {users.filter(u => u.id !== editingId).map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.type})</option>
                  ))}
                </select>
                <p className="text-[10px] text-gray-400">Hold Ctrl (or Cmd) to select multiple heads.</p>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-600">City</label>
                <input value={formData.city} className="w-full border p-2.5 rounded-xl outline-none" onChange={e => setFormData({ ...formData, city: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-600">Phone</label>
                <input value={formData.phone} className="w-full border p-2.5 rounded-xl outline-none" onChange={e => setFormData({ ...formData, phone: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-600">Region</label>
                <input value={formData.region} className="w-full border p-2.5 rounded-xl outline-none" onChange={e => setFormData({ ...formData, region: e.target.value })} />
              </div>
              <div className="col-span-2 space-y-1">
                <label className="text-sm font-semibold text-gray-600">Full Address</label>
                <textarea value={formData.address} className="w-full border p-2.5 rounded-xl outline-none" onChange={e => setFormData({ ...formData, address: e.target.value })} />
              </div>
              <div className="col-span-2 flex justify-end gap-3 pt-4">
                <button type="button" onClick={closeModal} className="px-6 py-2.5 rounded-xl text-gray-500 font-semibold hover:bg-gray-100">Cancel</button>
                <button type="submit" className="bg-sky-600 text-white px-8 py-2.5 rounded-xl font-bold shadow-lg" disabled={loading}>
                  {loading ? 'Saving...' : (isEditing ? 'Update User' : 'Confirm & Save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- VIEW MODAL --- */}
      {showViewModal && selectedUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl border border-gray-100 overflow-hidden relative">
            <div className={`h-24 absolute top-0 left-0 right-0 ${selectedUser.isActive ? 'bg-sky-500' : 'bg-gray-400'}`}></div>
            <div className="relative pt-8 flex flex-col items-center">
              <div className="w-24 h-24 rounded-full bg-white p-1 shadow-xl mb-4">
                <div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center text-3xl font-bold text-sky-600">
                  {selectedUser.name.charAt(0)}
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 text-center">{selectedUser.name}</h3>
              <p className="text-sky-600 font-bold mb-4 uppercase tracking-wider">{selectedUser.type}</p>

              <div className="w-full space-y-3 mt-4 border-t pt-4">
                <div className="flex justify-between text-sm"><span className="text-gray-400">Short Name:</span> <span className="font-semibold">{selectedUser.shortName}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-400">Email:</span> <span className="font-semibold">{selectedUser.email}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-400">Phone:</span> <span className="font-semibold">{selectedUser.phone || 'N/A'}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-400">City:</span> <span className="font-semibold">{selectedUser.city || 'N/A'}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-400">Region:</span> <span className="font-semibold">{selectedUser.region || 'N/A'}</span></div>

                <div className="flex flex-col gap-1 mt-2">
                  <span className="text-gray-400 text-sm font-medium">Full Address:</span>
                  <p className="text-sm bg-gray-50 p-4 rounded-2xl border border-gray-100 text-gray-700 italic">
                    {selectedUser.address || 'No address provided.'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowViewModal(false)}
                className="mt-8 w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-2xl transition"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
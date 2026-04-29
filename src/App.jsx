import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import axios from 'axios';

// Components imports
import ItemForm from './components/ItemForm';
import ItemList from './components/ItemList';
import Dashboard from './components/Dashboard'; 
import User from './components/Users'; 
import AuditReport from './components/Reports';
import CategoryPage from './components/Categories'; // ⭐ Naya Import
import ClaimPage from './components/Claim';

const socket = io('http://194.163.190.100:8080'); 

export default function App() {
  const [items, setItems] = useState([]);
  const [user, setUser] = useState(null);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [currentView, setCurrentView] = useState('dashboard'); 

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Error parsing stored user:", e);
        localStorage.removeItem('user'); 
      }
    }
  }, []); 

  const fetchItems = async () => {
    try {
      const params = user ? { type: user.type, shortName: user.shortName } : {};
      const res = await axios.get('http://194.163.190.100:8080/api/items', { params });
      setItems(res.data.data || []);
    } catch (e) {
      console.error('fetch items', e);
    }
  };

  useEffect(() => {
    if (user) {
      fetchItems();
      socket.on('item:created', () => fetchItems());
      socket.on('item:updated', () => fetchItems());
      return () => {
        socket.off('item:created');
        socket.off('item:updated');
      };
    }
  }, [user]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://194.163.190.100:8080/api/users/login', loginData);
      const userData = res.data.user;
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      setError('');
      setCurrentView('dashboard'); 
    } catch (err) {
      setError('Invalid email or password');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    setLoginData({ email: '', password: '' });
    setCurrentView('dashboard');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-100 to-sky-300">
        <form onSubmit={handleLogin} className="bg-white p-8 rounded-xl shadow-lg w-96">
          <h2 className="text-2xl font-semibold text-center mb-4">Shoe Tracker Login</h2>
          {error && <p className="text-red-500 text-center mb-2">{error}</p>}
          <input
            type="email"
            placeholder="Email"
            className="border rounded w-full p-2 mb-3"
            value={loginData.email}
            onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="border rounded w-full p-2 mb-4"
            value={loginData.password}
            onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
            required
          />
          <button className="bg-sky-500 hover:bg-sky-600 text-white w-full py-2 rounded-lg">Login</button>
        </form>
      </div>
    );
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard currentUser={user} itemsCount={items.length} />;
      
      case 'form':
        return (user.type === 'Store' || user.type === 'Admin') 
          ? <ItemForm onSaved={fetchItems} socket={socket} currentUser={user} />
          : <p className="text-red-500 p-6">Access Denied.</p>;

      case 'list':
        return <ItemList items={items} refresh={fetchItems} socket={socket} user={user} />;
      case 'claim':
        return <ClaimPage currentUser={user} socket={socket} />;
      case 'users':
        return user.type === 'Admin' ? <User currentUser={user} /> : <p className="p-6">Access Denied.</p>;

      case 'reports':
        return <AuditReport user={user} />;

      // ⭐ Naya View: Categories Page
      case 'categories':
        return user.type === 'Admin' 
          ? <CategoryPage /> 
          : <p className="p-6">Only Admin can manage categories.</p>;

      default:
        return <Dashboard currentUser={user} itemsCount={items.length} />;
    }
  };
  
  const navClass = (viewKey) => 
    `w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${
      currentView === viewKey
        ? 'bg-sky-700 text-white shadow-md'
        : 'text-sky-800 hover:bg-sky-100'
    }`;

  return (
    <div className="min-h-screen bg-gray-50 flex">
        <nav className="w-64 bg-white shadow-xl p-4 flex flex-col justify-between">
            <div>
                <header className="mb-8">
                    <div className="flex items-center gap-3 border-b pb-4">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-sky-500 to-sky-300 text-white flex items-center justify-center font-bold text-lg">LG</div>
                        <h1 className="text-xl font-bold text-sky-800 uppercase">LG-RP/CLAIM</h1>
                    </div>
                    <div className="mt-4 text-sm text-slate-600">
                        <p>Welcome, <span className="font-semibold text-sky-800">{user.name}</span></p>
                        <p className="text-xs">Role: {user.type}</p>
                    </div>
                </header>

                <div className="space-y-2">
                    <button onClick={() => setCurrentView('dashboard')} className={navClass('dashboard')}>🏠 Dashboard</button>
                    <button onClick={() => setCurrentView('list')} className={navClass('list')}>📝 Item List</button>
                    <button onClick={() => setCurrentView('claim')} className={navClass('claim')}>
  ✅ Claim Approvals
</button>
                    {(user.type === 'Store' || user.type === 'Admin') && (
                        <button onClick={() => setCurrentView('form')} className={navClass('form')}>➕ Add New Item</button>
                    )}

                    <button onClick={() => setCurrentView('reports')} className={navClass('reports')}>📊 Audit Reports</button>

                    {/* ⭐ Categories Button (Admin Only) */}
                    {user.type === 'Admin' && (
                        <>
                          <button onClick={() => setCurrentView('categories')} className={navClass('categories')}>📁 Manage Categories</button>
                          <button onClick={() => setCurrentView('users')} className={navClass('users')}>👥 User Matrix</button>
                        </>
                    )}
                </div>
            </div>

            <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white w-full py-2 rounded-lg mt-8 font-bold">Log Out</button>
        </nav>

        <main className="flex-1 p-8 overflow-y-auto">
            <h2 className="text-3xl font-light text-gray-700 mb-6 capitalize">
                {currentView.replace(/([A-Z])/g, ' $1')} {/* Ye dynamic title banayega */}
            </h2>
            <div className="bg-white rounded-lg shadow-md min-h-full">
              {renderView()}
            </div>
        </main>
    </div>
  );
}







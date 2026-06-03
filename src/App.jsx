import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import axios from './axiosConfig';

import ItemForm from './components/ItemForm';
import ItemList from './components/ItemList';
import Dashboard from './components/Dashboard'; 
import User from './components/Users'; 
import AuditReport from './components/Reports';
import CategoryPage from './components/Categories'; 
import ClaimPage from './components/Claim';
import NavBar from './components/NavBar';

const socket = io(import.meta.env.VITE_SERVER_URL); 

export default function App() {
  const [items, setItems] = useState([]);
  const [user, setUser] = useState(null);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  
  const getInitialView = () => {
    const path = window.location.pathname.substring(1);
    const validViews = ['login', 'dashboard', 'form', 'list', 'claim', 'users', 'reports', 'categories'];
    const storedUser = localStorage.getItem('user');

    if (validViews.includes(path)) {
      if (!storedUser && path !== 'login') return 'login';
      if (storedUser && path === 'login') return 'dashboard';
      return path;
    }
    return storedUser ? 'dashboard' : 'login';
  };

  const [currentView, setCurrentView] = useState(getInitialView()); 

  useEffect(() => {
    window.history.pushState(null, '', `/${currentView}`);
  }, [currentView]);
  useEffect(() => {
    const handlePopState = () => {
      setCurrentView(getInitialView());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);
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
      const res = await axios.get('/items', { params });
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
      const res = await axios.post('/users/login', loginData);
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
    setCurrentView('login');
  };

  if (!user) {
    if (currentView !== 'login') setCurrentView('login');

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-100 to-sky-300">
        <form onSubmit={handleLogin} className="bg-white p-8 rounded-xl shadow-lg w-96">
          <h2 className="text-2xl font-semibold text-center mb-4">RP/CLAIM Portal Login</h2>
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

      case 'categories':
        return user.type === 'Admin' 
          ? <CategoryPage /> 
          : <p className="p-6">Only Admin can manage categories.</p>;

      default:
        return <Dashboard currentUser={user} itemsCount={items.length} />;
    }
  };
  return (
    <div className="min-h-screen bg-gray-50 flex">
        <NavBar 
          user={user} 
          currentView={currentView} 
          setCurrentView={setCurrentView} 
          handleLogout={handleLogout} 
        />

        <main className="flex-1 p-8 overflow-y-auto">
            <h2 className="text-3xl font-light text-gray-700 mb-6 capitalize">
                {currentView.replace(/([A-Z])/g, ' $1')}
            </h2>
            <div className="bg-white rounded-lg shadow-md min-h-full">
              {renderView()}
            </div>
        </main>
    </div>
  );
}
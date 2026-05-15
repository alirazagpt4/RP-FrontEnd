import React, { useState } from 'react';

export default function NavBar({ user, currentView, setCurrentView, handleLogout }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const navClass = (viewKey) => 
    `w-full flex items-center gap-4 px-4 py-3 rounded-xl font-medium transition-all duration-200 mb-1 ${
      currentView === viewKey
        ? 'bg-sky-600 text-white shadow-lg shadow-sky-100'
        : 'text-slate-600 hover:bg-sky-50 hover:text-sky-700'
    }`;

  return (
    <>
      <button 
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 right-4 z-50 p-2 bg-white rounded-lg shadow-md border border-slate-100"
      >
        {isMobileOpen ? '✕' : '☰'}
      </button>

      <nav className={`
        fixed lg:sticky top-0 left-0 z-40 h-screen
        bg-white border-r border-slate-100 p-4 
        flex flex-col justify-between transition-all duration-300 ease-in-out
        ${isCollapsed ? 'w-20' : 'w-72'}
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex absolute -right-3 top-12 bg-white border border-slate-200 rounded-full w-6 h-6 items-center justify-center shadow-sm hover:bg-sky-50 z-50 transition-transform active:scale-90"
        >
          {isCollapsed ? '→' : '←'}
        </button>

        <div className="overflow-y-auto overflow-x-hidden custom-scrollbar pr-1">
          {/* Header */}
          <header className="mb-6">
            <div className={`flex items-center gap-3 border-b border-slate-50 pb-6 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
              <div className="flex items-center gap-3">
                <div className="min-w-[40px] h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-sky-400 text-white flex items-center justify-center font-bold text-lg shadow-md">
                  LOGO
                </div>
                {!isCollapsed && (
                  <div className="transition-opacity duration-300">
                    <h1 className="text-md font-black text-slate-800 tracking-tight leading-none uppercase">RP-CLAIM</h1>
                  </div>
                )}
              </div>

              {!isCollapsed && (
                <button 
                  onClick={handleLogout}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors group"
                  title="Logout"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              )}
            </div>

            {!isCollapsed && (
              <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-[10px] text-slate-400 font-bold uppercase">User</p>
                <p className="text-sm font-bold text-slate-700 truncate">{user.name}</p>
                <span className="text-[10px] text-sky-600 font-semibold">{user.type}</span>
              </div>
            )}
          </header>

          <div className="space-y-1">
            {!isCollapsed && <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 mt-4">Main Menu</p>}
            
            <NavItem icon="🏠" label="Dashboard" view="dashboard" isCollapsed={isCollapsed} navClass={navClass} onClick={() => {setCurrentView('dashboard'); setIsMobileOpen(false)}} />
            <NavItem icon="📝" label="Item List" view="list" isCollapsed={isCollapsed} navClass={navClass} onClick={() => {setCurrentView('list'); setIsMobileOpen(false)}} />
            <NavItem icon="✅" label="Claims" view="claim" isCollapsed={isCollapsed} navClass={navClass} onClick={() => {setCurrentView('claim'); setIsMobileOpen(false)}} />
            
            {(user.type === 'Store' || user.type === 'Admin') && (
              <NavItem icon="➕" label="Add Item" view="form" isCollapsed={isCollapsed} navClass={navClass} onClick={() => {setCurrentView('form'); setIsMobileOpen(false)}} />
            )}

            <NavItem icon="📊" label="Reports" view="reports" isCollapsed={isCollapsed} navClass={navClass} onClick={() => {setCurrentView('reports'); setIsMobileOpen(false)}} />

            {user.type === 'Admin' && (
              <div className="pt-4 mt-4 border-t border-slate-50">
                {!isCollapsed && <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Admin</p>}
                <NavItem icon="📁" label="Categories" view="categories" isCollapsed={isCollapsed} navClass={navClass} onClick={() => {setCurrentView('categories'); setIsMobileOpen(false)}} />
                <NavItem icon="👥" label="Users" view="users" isCollapsed={isCollapsed} navClass={navClass} onClick={() => {setCurrentView('users'); setIsMobileOpen(false)}} />
              </div>
            )}
          </div>
        </div>

        <div className="mt-auto">
            {isCollapsed ? (
                <button onClick={handleLogout} className="w-full p-3 text-slate-400 hover:text-red-500 flex justify-center transition-colors border-t border-slate-50 pt-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                </button>
            ) : (
                <div className="pt-4 border-t border-slate-50 text-center">
                    <p className="text-[10px] text-slate-400 font-medium">© 2026 LG-RP Portal</p>
                </div>
            )}
        </div>
      </nav>

      {isMobileOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-30 lg:hidden" onClick={() => setIsMobileOpen(false)} />
      )}
    </>
  );
}

function NavItem({ icon, label, view, isCollapsed, navClass, onClick }) {
  return (
    <button onClick={onClick} className={navClass(view)} title={isCollapsed ? label : ''}>
      <span className="text-xl min-w-[24px] flex justify-center">{icon}</span>
      {!isCollapsed && <span className="truncate">{label}</span>}
    </button>
  );
}
































// import React, { useState } from 'react';

// export default function NavBar({ user, currentView, setCurrentView, handleLogout }) {
//   const [isCollapsed, setIsCollapsed] = useState(false); // Sidebar khula hai ya band
//   const [isMobileOpen, setIsMobileOpen] = useState(false); // Mobile view ke liye

//   const navClass = (viewKey) => 
//     `w-full flex items-center gap-4 px-4 py-3 rounded-xl font-medium transition-all duration-200 mb-1 ${
//       currentView === viewKey
//         ? 'bg-sky-600 text-white shadow-lg shadow-sky-100'
//         : 'text-slate-600 hover:bg-sky-50 hover:text-sky-700'
//     }`;

//   return (
//     <>
//       <button 
//         onClick={() => setIsMobileOpen(!isMobileOpen)}
//         className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md"
//       >
//         {isMobileOpen ? '✕' : '☰'}
//       </button>

//       <nav className={`
//         fixed lg:relative inset-y-0 left-0 z-40
//         bg-white border-r border-slate-100 p-4 
//         flex flex-col justify-between transition-all duration-300 ease-in-out
//         ${isCollapsed ? 'w-20' : 'w-72'}
//         ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
//       `}>
       
//         <button 
//           onClick={() => setIsCollapsed(!isCollapsed)}
//           className="hidden lg:flex absolute -right-3 top-20 bg-white border border-slate-200 rounded-full w-6 h-6 items-center justify-center shadow-sm hover:bg-sky-50 z-50"
//         >
//           {isCollapsed ? '→' : '←'}
//         </button>

//         <div className="overflow-x-hidden">
//           {/* Header Section */}
//           <header className="mb-8">
//             <div className={`flex items-center gap-3 border-b border-slate-50 pb-6 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
//               <div className="flex items-center gap-3">
//                 <div className="min-w-[40px] h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-sky-400 text-white flex items-center justify-center font-bold text-lg shadow-md">
//                   LG
//                 </div>
//                 {!isCollapsed && (
//                   <div className="transition-opacity duration-200">
//                     <h1 className="text-md font-black text-slate-800 tracking-tight leading-none">LG-RP</h1>
//                     <span className="text-[9px] text-sky-500 font-bold uppercase tracking-widest">Portal</span>
//                   </div>
//                 )}
//               </div>

//               {!isCollapsed && (
//                 <button 
//                   onClick={handleLogout}
//                   className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
//                   title="Logout"
//                 >
//                   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
//                   </svg>
//                 </button>
//               )}
//             </div>

//             {!isCollapsed && (
//               <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
//                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">User</p>
//                 <p className="text-sm font-bold text-slate-700 truncate">{user.name}</p>
//                 <span className="text-[10px] text-sky-600 font-semibold">{user.type}</span>
//               </div>
//             )}
//           </header>

//           <div className="space-y-1">
//             <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-[2px] mb-2">Main Menu</p>
//             <NavItem icon="🏠" label="Dashboard" view="dashboard" isCollapsed={isCollapsed} navClass={navClass} onClick={() => {setCurrentView('dashboard'); setIsMobileOpen(false)}} />
//             <NavItem icon="📝" label="Item List" view="list" isCollapsed={isCollapsed} navClass={navClass} onClick={() => {setCurrentView('list'); setIsMobileOpen(false)}} />
//             <NavItem icon="✅" label="Claims" view="claim" isCollapsed={isCollapsed} navClass={navClass} onClick={() => {setCurrentView('claim'); setIsMobileOpen(false)}} />
            
//             {(user.type === 'Store' || user.type === 'Admin') && (
//               <NavItem icon="➕" label="Add Item" view="form" isCollapsed={isCollapsed} navClass={navClass} onClick={() => {setCurrentView('form'); setIsMobileOpen(false)}} />
//             )}

//             <NavItem icon="📊" label="Reports" view="reports" isCollapsed={isCollapsed} navClass={navClass} onClick={() => {setCurrentView('reports'); setIsMobileOpen(false)}} />
//             <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-[2px] mb-2">Administration</p>
//             {user.type === 'Admin' && (
//               <div className={`pt-4 mt-4 border-t border-slate-50 ${isCollapsed ? 'items-center' : ''}`}>
//                 <NavItem icon="📁" label="Categories" view="categories" isCollapsed={isCollapsed} navClass={navClass} onClick={() => {setCurrentView('categories'); setIsMobileOpen(false)}} />
//                 <NavItem icon="👥" label="Users" view="users" isCollapsed={isCollapsed} navClass={navClass} onClick={() => {setCurrentView('users'); setIsMobileOpen(false)}} />
//               </div>
//             )}
//           </div>
//         </div>

//         <div className={`pt-4 border-t border-slate-50 text-center ${isCollapsed ? 'hidden' : 'block'}`}>
//           <p className="text-[10px] text-slate-400 font-medium whitespace-nowrap">© 2026 LG-RP Portal</p>
//         </div>

//         {isCollapsed && (
//           <button onClick={handleLogout} className="w-full p-3 text-slate-400 hover:text-red-500 flex justify-center transition-colors">
//             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
//             </svg>
//           </button>
//         )}
//       </nav>

//       {isMobileOpen && (
//         <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-30 lg:hidden" onClick={() => setIsMobileOpen(false)} />
//       )}
//     </>
//   );
// }

// function NavItem({ icon, label, view, isCollapsed, navClass, onClick }) {
//   return (
//     <button onClick={onClick} className={navClass(view)} title={isCollapsed ? label : ''}>
//       <span className="text-xl min-w-[24px] flex justify-center">{icon}</span>
//       {!isCollapsed && <span className="truncate transition-opacity duration-200">{label}</span>}
//     </button>
//   );
// }

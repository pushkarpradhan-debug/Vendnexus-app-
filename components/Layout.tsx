import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  TrendingUp, 
  Settings, 
  Bot, 
  Menu, 
  X,
  ShoppingBag,
  Store,
  LogOut
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  isOwnerMode: boolean;
  toggleMode: () => void;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  activeTab, 
  onTabChange, 
  isOwnerMode,
  toggleMode 
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const ownerLinks = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'sales', label: 'Sales & Analytics', icon: TrendingUp },
    { id: 'ai-agent', label: 'AI Assistant', icon: Bot },
  ];

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-teal-900 text-white transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between p-6 border-b border-teal-800">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-teal-400 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-teal-900 font-bold text-xl">V</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight leading-tight">VendNexus</span>
              <span className="text-[10px] text-teal-100 font-medium leading-none">by Pushkar Pradhan</span>
            </div>
          </div>
          <button 
            className="md:hidden text-teal-300 hover:text-white"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X size={24} />
          </button>
        </div>

        <nav className="p-4 space-y-2">
          {isOwnerMode ? (
            <>
              <div className="px-4 py-2 text-xs font-semibold text-teal-400 uppercase tracking-wider">
                Management
              </div>
              {ownerLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => {
                    onTabChange(link.id);
                    setIsSidebarOpen(false);
                  }}
                  className={`
                    w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors
                    ${activeTab === link.id 
                      ? 'bg-teal-800 text-white shadow-lg' 
                      : 'text-teal-100 hover:bg-teal-800/50 hover:text-white'}
                  `}
                >
                  <link.icon size={20} />
                  <span>{link.label}</span>
                </button>
              ))}
            </>
          ) : (
             <div className="p-4 bg-teal-800 rounded-lg text-teal-100 text-sm">
                <p className="mb-2 font-medium text-white">Customer Mode Active</p>
                <p>Browsing and purchasing products as a customer.</p>
             </div>
          )}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-teal-800">
          <button
            onClick={toggleMode}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-teal-700 hover:bg-teal-600 rounded-lg transition-colors text-white text-sm font-medium"
          >
            {isOwnerMode ? (
              <>
                <ShoppingBag size={18} />
                <span>Switch to Customer View</span>
              </>
            ) : (
              <>
                <Store size={18} />
                <span>Switch to Owner View</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm z-10">
          <div className="flex items-center justify-between px-6 py-4">
            <button 
              className="md:hidden text-gray-500 hover:text-gray-700"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu size={24} />
            </button>
            
            <h1 className="text-xl font-semibold text-gray-800 ml-2 md:ml-0">
              {isOwnerMode ? (
                ownerLinks.find(l => l.id === activeTab)?.label || 'Dashboard'
              ) : (
                'Machine Storefront'
              )}
            </h1>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className={`w-2 h-2 rounded-full ${isOwnerMode ? 'bg-green-500' : 'bg-blue-500'}`}></span>
                <span className="text-sm text-gray-500 font-medium">
                  {isOwnerMode ? 'Admin Logged In' : 'Guest Customer'}
                </span>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto bg-gray-50 p-6 relative">
          <div className="max-w-7xl mx-auto h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
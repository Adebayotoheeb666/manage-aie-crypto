import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Wallet, 
  BarChart2, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  ChevronDown,
  ChevronRight,
  Plus,
  Search,
  Bell,
  User
} from 'lucide-react';

const menuItems = [
  { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { name: 'Wallets', icon: Wallet, path: '/wallets' },
  { 
    name: 'Transactions', 
    icon: BarChart2, 
    path: '/transactions',
    subItems: [
      { name: 'All Transactions', path: '/transactions' },
      { name: 'Income', path: '/transactions/income' },
      { name: 'Expense', path: '/transactions/expense' },
    ]
  },
  { name: 'Settings', icon: Settings, path: '/settings' },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
  const location = useLocation();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const toggleSubmenu = (name: string) => {
    setActiveSubmenu(activeSubmenu === name ? null : name);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div 
        className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-white shadow-lg transition-all duration-300 flex flex-col`}
      >
        {/* Logo */}
        <div className="p-4 flex items-center justify-between border-b border-gray-200">
          {isSidebarOpen ? (
            <h1 className="text-xl font-bold text-blue-600">CryptoVault</h1>
          ) : (
            <div className="w-8 h-8 bg-blue-600 rounded-md"></div>
          )}
          <button 
            onClick={toggleSidebar}
            className="p-1 rounded-md hover:bg-gray-100"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-2">
            {menuItems.map((item) => (
              <li key={item.name}>
                {item.subItems ? (
                  <>
                    <button
                      onClick={() => toggleSubmenu(item.name)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-lg ${
                        location.pathname.startsWith(item.path)
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center">
                        <item.icon className="w-5 h-5" />
                        {isSidebarOpen && <span className="ml-3">{item.name}</span>}
                      </div>
                      {isSidebarOpen && (
                        activeSubmenu === item.name ? 
                        <ChevronDown size={16} /> : 
                        <ChevronRight size={16} />
                      )}
                    </button>
                    {isSidebarOpen && activeSubmenu === item.name && (
                      <ul className="mt-1 ml-10 space-y-1">
                        {item.subItems.map((subItem) => (
                          <li key={subItem.name}>
                            <Link
                              to={subItem.path}
                              className={`block px-4 py-2 text-sm rounded-lg ${
                                location.pathname === subItem.path
                                  ? 'bg-blue-50 text-blue-600'
                                  : 'text-gray-600 hover:bg-gray-100'
                              }`}
                            >
                              {subItem.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                ) : (
                  <Link
                    to={item.path}
                    className={`flex items-center px-4 py-3 rounded-lg ${
                      location.pathname === item.path
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    {isSidebarOpen && <span className="ml-3">{item.name}</span>}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
              <User size={20} className="text-gray-500" />
            </div>
            {isSidebarOpen && (
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">John Doe</p>
                <p className="text-xs text-gray-500">Free Plan</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm z-10">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                {location.pathname === '/dashboard' ? 'Dashboard' : 
                 location.pathname.startsWith('/wallets') ? 'Wallets' :
                 location.pathname.startsWith('/transactions') ? 'Transactions' :
                 location.pathname.startsWith('/settings') ? 'Settings' : ''}
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm"
                />
              </div>
              
              <button className="p-2 rounded-full text-gray-500 hover:bg-gray-100">
                <Bell className="h-5 w-5" />
              </button>
              
              <button className="p-2 rounded-full text-gray-500 hover:bg-gray-100">
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
}

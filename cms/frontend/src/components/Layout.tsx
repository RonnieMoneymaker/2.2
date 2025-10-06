import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { 
  LayoutDashboard, 
  DollarSign,
  Package, 
  FolderTree, 
  Users,
  ShoppingCart,
  BarChart3,
  Plug,
  Upload,
  Settings,
  Menu,
  X
} from 'lucide-react';

const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Financieel', href: '/financial', icon: DollarSign },
    { name: 'Producten', href: '/products', icon: Package },
    { name: 'Categorieën', href: '/categories', icon: FolderTree },
    { name: 'Klanten', href: '/customers', icon: Users },
    { name: 'Bestellingen', href: '/orders', icon: ShoppingCart },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Integraties', href: '/integrations', icon: Plug },
    { name: 'Bulk Import', href: '/import', icon: Upload },
    { name: 'Instellingen', href: '/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-gradient-to-b from-gray-900 to-gray-800 shadow-2xl">
          <div className="flex h-16 items-center justify-between px-4 border-b border-gray-700">
            <h1 className="text-xl font-bold text-white">⚡ Voltmover</h1>
            <button onClick={() => setSidebarOpen(false)} className="text-gray-300 hover:text-white">
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  `group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-primary-600 text-white shadow-lg'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`
                }
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-gradient-to-b from-gray-900 to-gray-800 border-r border-gray-700">
          <div className="flex h-16 items-center px-4 border-b border-gray-700">
            <h1 className="text-xl font-bold text-white">⚡ Voltmover CMS</h1>
          </div>
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  `group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-primary-600 text-white shadow-lg transform scale-105'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`
                }
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </NavLink>
            ))}
          </nav>
          <div className="p-4 border-t border-gray-700">
            <div className="text-xs text-gray-400 text-center">
              <p>Voltmover CMS v2.0</p>
              <p className="mt-1">Production Ready 🚀</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-md sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden hover:bg-gray-100 rounded-lg"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6 items-center">
            <div className="flex flex-1 items-center">
              <h2 className="text-lg font-semibold text-gray-900 hidden sm:block">
                Voltmover E-commerce CMS
              </h2>
            </div>
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <div className="hidden sm:flex items-center gap-2 text-xs">
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium">
                  API Connected
                </span>
                <span className="text-gray-500">
                  {process.env.REACT_APP_API_BASE || 'localhost:2000'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <main className="py-8 bg-gray-50 min-h-screen">
          <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;




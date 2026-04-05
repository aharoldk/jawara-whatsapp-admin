import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../lib/auth'
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  Package,
  Layers,
  Database,
  Bell,
  Megaphone,
  CalendarDays,
  BarChart3,
  LogOut,
  Settings,
  ChevronDown,
} from 'lucide-react'

const nav = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  {
    group: 'Master Data',
    icon: Database,
    items: [
      { to: '/product-groups', label: 'Product Groups', icon: Layers },
      { to: '/products', label: 'Products', icon: Package },
    ],
  },
  { to: '/customers', label: 'Customers', icon: Users },
  { to: '/orders', label: 'Orders', icon: ShoppingCart },
  { to: '/reminders', label: 'Reminders', icon: Bell },
  { to: '/broadcast', label: 'Broadcast', icon: Megaphone },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/configuration', label: 'Configuration', icon: Settings },
]

export default function Layout() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Track collapsed state per group; default open if a child is active
  const [collapsed, setCollapsed] = useState({})

  function isGroupActive(items) {
    return items.some((i) => location.pathname.startsWith(i.to))
  }

  function toggleGroup(group) {
    setCollapsed((prev) => ({ ...prev, [group]: !prev[group] }))
  }

  function isOpen(group, items) {
    // If never toggled, default to open when a child is active, else closed
    if (collapsed[group] === undefined) return isGroupActive(items)
    return !collapsed[group]
  }

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 bg-gray-900 flex flex-col">
        <div className="h-16 flex items-center px-5 border-b border-gray-700">
          <span className="text-white font-bold text-lg tracking-tight">🟢 Jawara Admin</span>
        </div>
        <nav className="flex-1 py-4 overflow-y-auto">
          {nav.map((item) =>
            item.group ? (
              <div key={item.group}>
                <button
                  onClick={() => toggleGroup(item.group)}
                  className={`w-full flex items-center gap-3 px-5 py-2.5 text-sm transition-colors ${
                    isGroupActive(item.items)
                      ? 'text-white'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <item.icon size={18} />
                  <span className="flex-1 text-left">{item.group}</span>
                  <ChevronDown
                    size={14}
                    className={`transition-transform duration-200 ${isOpen(item.group, item.items) ? 'rotate-180' : ''}`}
                  />
                </button>
                {isOpen(item.group, item.items) && (
                  item.items.map(({ to, label, icon: Icon }) => (
                    <NavLink
                      key={to}
                      to={to}
                      className={({ isActive }) =>
                        `flex items-center gap-3 pl-8 pr-5 py-2 text-sm transition-colors ${
                          isActive
                            ? 'bg-brand-600 text-white'
                            : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                        }`
                      }
                    >
                      <Icon size={16} />
                      {label}
                    </NavLink>
                  ))
                )}
              </div>
            ) : (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-5 py-2.5 text-sm transition-colors ${
                    isActive
                      ? 'bg-brand-600 text-white'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }`
                }
              >
                <item.icon size={18} />
                {item.label}
              </NavLink>
            ),
          )}
        </nav>
        <div className="p-4 border-t border-gray-700 flex items-center justify-between">
          <span className="text-xs text-gray-500">v1.0.0</span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
          >
            <LogOut size={14} />
            Keluar
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}

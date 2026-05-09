import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  DollarSign, 
  LogOut,
  Music,
  Menu,
  X,
  BarChart3,
  ClipboardCheck
} from 'lucide-react';
import { useState } from 'react';

export const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/students', icon: Users, label: 'Students' },
    { to: '/schedule', icon: Calendar, label: 'Schedule' },
    { to: '/attendance', icon: ClipboardCheck, label: 'Attendance' },
    { to: '/fees', icon: DollarSign, label: 'Fees' },
    { to: '/finances', icon: BarChart3, label: 'Finances' },
  ];

  return (
    <div className="dashboard-container noise-bg">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-[#E5E5E0] z-50 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#2C3E50] rounded-lg flex items-center justify-center">
            <Music className="w-4 h-4 text-white" />
          </div>
          <span className="font-heading font-semibold text-[#1A1A1A]">Grace Music</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          data-testid="mobile-menu-btn"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-white z-40 pt-16">
          <nav className="p-4 space-y-2">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-[#2C3E50] text-white'
                      : 'text-[#6B7280] hover:bg-[#F0F0EB]'
                  }`
                }
                data-testid={`mobile-nav-${link.label.toLowerCase()}`}
              >
                <link.icon className="w-5 h-5" />
                <span className="font-medium">{link.label}</span>
              </NavLink>
            ))}
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 w-full"
              data-testid="mobile-logout-btn"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Logout</span>
            </button>
          </nav>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="sidebar hidden md:flex">
        <div className="sidebar-logo flex items-center gap-2">
          <div className="w-10 h-10 bg-[#2C3E50] rounded-xl flex items-center justify-center">
            <Music className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-heading font-semibold text-[#1A1A1A] block">Grace Music</span>
            <span className="text-xs text-[#6B7280]">Academy</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''}`
              }
              data-testid={`nav-${link.label.toLowerCase()}`}
            >
              <link.icon className="w-5 h-5" strokeWidth={1.5} />
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto pt-4 border-t border-[#E5E5E0]">
          <div className="px-3 py-2 mb-2">
            <p className="text-sm font-medium text-[#1A1A1A] truncate">{user?.name}</p>
            <p className="text-xs text-[#6B7280] truncate">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="sidebar-link text-red-600 hover:bg-red-50 w-full"
            data-testid="logout-btn"
          >
            <LogOut className="w-5 h-5" strokeWidth={1.5} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content pt-16 md:pt-0">
        <div className="max-w-7xl mx-auto animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;

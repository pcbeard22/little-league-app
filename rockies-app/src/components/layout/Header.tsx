import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Mountain, LayoutGrid, Calendar, Users, BarChart3, Menu, X } from 'lucide-react';

const navItems = [
  { to: '/lineup', label: 'Lineup', icon: LayoutGrid },
  { to: '/schedule', label: 'Schedule', icon: Calendar },
  { to: '/roster', label: 'Roster', icon: Users },
  { to: '/stats', label: 'Stats', icon: BarChart3 },
];

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 shadow-lg" style={{ background: 'linear-gradient(to right, #18003C, #33006F)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Left: Brand */}
          <div className="flex items-center gap-3">
            <Mountain className="w-8 h-8 text-white opacity-90" strokeWidth={2.5} />
            <div className="leading-tight">
              <div className="font-heading text-white font-bold text-xl tracking-wide">
                ROCKIES
              </div>
              <div className="text-rockies-silver text-xs font-medium tracking-wider">
                AAA Division | Field Manager
              </div>
            </div>
          </div>

          {/* Right: Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-white/20 text-white shadow-sm'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown nav */}
      {mobileMenuOpen && (
        <nav className="md:hidden border-t border-white/10 pb-3 px-4">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium mt-1 transition-colors ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              {label}
            </NavLink>
          ))}
        </nav>
      )}
    </header>
  );
}

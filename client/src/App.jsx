import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { FiHome, FiFileText, FiBarChart2 } from 'react-icons/fi';
import Home from './pages/Home';
import InvoiceHistory from './pages/InvoiceHistory';
import MonthlyReports from './pages/MonthlyReports';

function Navigation() {
  const location = useLocation();
  const navItems = [
    { to: '/', label: 'Create', icon: FiHome, fullLabel: 'Create Invoice' },
    { to: '/history', label: 'History', icon: FiFileText, fullLabel: 'Invoice History' },
    { to: '/monthly-reports', label: 'Monthly', icon: FiBarChart2, fullLabel: 'Monthly Reports' },
  ];
  
  return (
    <>
      <nav className="bg-white shadow-md mb-6">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-2xl font-bold text-orange-800 text-center sm:text-left">
              Invoice Manager
            </h1>
            <div className="hidden sm:flex flex-wrap gap-2 sm:gap-4 justify-center sm:justify-end">
              {navItems.map(({ to, fullLabel, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    location.pathname === to
                      ? 'bg-orange-500 text-white'
                      : 'text-orange-600 hover:bg-orange-50'
                  }`}
                >
                  <Icon /> {fullLabel}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile bottom navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg sm:hidden z-50">
        <div className="flex justify-around">
          {navItems.map(({ to, label, icon: Icon }) => {
            const isActive = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={`flex flex-col items-center py-2 text-xs ${
                  isActive ? 'text-orange-600' : 'text-gray-500'
                }`}
              >
                <Icon size={20} />
                <span className="mt-1">{label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}

function App() {
  return (
    <Router>
      <div className="pb-20 sm:pb-0 min-h-screen bg-gray-50">
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#fff',
              color: '#ea580c',
              border: '2px solid #fb923c',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
        <Navigation />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/history" element={<InvoiceHistory />} />
          <Route path="/monthly-reports" element={<MonthlyReports />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { FiHome, FiFileText } from 'react-icons/fi';
import Home from './pages/Home';
import InvoiceHistory from './pages/InvoiceHistory';

function Navigation() {
  const location = useLocation();
  
  return (
    <nav className="bg-white shadow-md mb-6">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-orange-800">Invoice Manager</h1>
          <div className="flex gap-4">
            <Link
              to="/"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                location.pathname === '/'
                  ? 'bg-orange-500 text-white'
                  : 'text-orange-600 hover:bg-orange-50'
              }`}
            >
              <FiHome /> Create Invoice
            </Link>
            <Link
              to="/history"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                location.pathname === '/history'
                  ? 'bg-orange-500 text-white'
                  : 'text-orange-600 hover:bg-orange-50'
              }`}
            >
              <FiFileText /> Invoice History
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

function App() {
  return (
    <Router>
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
      </Routes>
    </Router>
  );
}

export default App;

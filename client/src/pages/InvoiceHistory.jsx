import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiEdit, FiEye, FiDownload, FiTrash2, FiFileText, FiSearch, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { getAllChallans, getChallanById, deleteChallan } from '../services/ceservice';

const InvoiceHistory = () => {
  const [challans, setChallans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedChallan, setSelectedChallan] = useState(null);
  const [viewMode, setViewMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    loadChallans();
  }, [filterStatus]);

  const loadChallans = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterStatus !== 'all') {
        params.status = filterStatus;
      }
      const response = await getAllChallans(params);
      if (response.success) {
        setChallans(response.data);
      }
    } catch (error) {
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const handleView = (challan) => {
    setSelectedChallan(challan);
    setViewMode(true);
  };

  const handleEdit = (challan) => {
    // Navigate to home page with challan data
    // For now, we'll store it in localStorage and redirect
    localStorage.setItem('editChallan', JSON.stringify(challan));
    window.location.href = '/';
  };

  const handleDownload = async (challan) => {
    try {
      if (challan.status === 'completed' && challan.invoiceNumber) {
        // Call backend to generate and download
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/challans/generate-pdf/${challan._id}`, {
          method: 'GET',
          credentials: 'include',
        });

        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', `invoice-${challan.invoiceNumber}.pdf`);
          document.body.appendChild(link);
          link.click();
          link.remove();
          window.URL.revokeObjectURL(url);
          toast.success('PDF downloaded successfully');
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to generate PDF');
        }
      } else {
        toast.error('Cannot download draft invoices');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to download PDF');
    }
  };

  const handleDeleteClick = (id, invoiceNumber) => {
    setDeleteConfirm({ id, invoiceNumber });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;

    try {
      const response = await deleteChallan(deleteConfirm.id);
      if (response.success) {
        toast.success('Invoice deleted successfully');
        loadChallans();
      }
    } catch (error) {
      toast.error('Failed to delete invoice');
    } finally {
      setDeleteConfirm(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirm(null);
  };

  const calculateTotal = (items) => {
    return items.reduce((sum, item) => {
      const qty = Number(item.quantity || 0);
      const rate = Number(item.rate || 0);
      return sum + (qty * rate);
    }, 0);
  };

  const filteredChallans = challans.filter(challan => {
    const matchesSearch = 
      challan.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      challan.buyer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      challan.date?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  if (viewMode && selectedChallan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-xl p-6 md:p-8"
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-orange-800">Invoice Details</h2>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setViewMode(false)}
                className="p-2 text-orange-600 hover:bg-orange-100 rounded-lg transition-colors"
              >
                <FiX size={24} />
              </motion.button>
            </div>

            {/* Invoice Preview - Similar to PDF layout */}
            <div className="space-y-6">
              {/* Buyer/Invoice Info Section */}
              <div className="border-2 border-orange-200 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-bold text-orange-700 mb-2">BUYER :-</h3>
                    <p className="text-gray-700 whitespace-pre-line">{selectedChallan.buyer}</p>
                    <h3 className="font-bold text-orange-700 mt-4 mb-2">GSTIN No:-</h3>
                    <p className="text-gray-700">{selectedChallan.buyerGstin || 'N/A'}</p>
                  </div>
                  <div className="border-l-2 border-orange-200 pl-4">
                    <h3 className="font-bold text-orange-700 text-center mb-4">INVOICE</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="font-bold text-sm">No:-</p>
                        <p className="text-gray-700">{selectedChallan.invoiceNumber}</p>
                      </div>
                      <div>
                        <p className="font-bold text-sm">Date:-</p>
                        <p className="text-gray-700">{selectedChallan.date}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Items Table - Scrollable */}
              <div className="border-2 border-orange-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px]">
                    <thead className="bg-orange-100">
                      <tr>
                        <th className="px-2 md:px-4 py-3 text-left text-xs md:text-sm font-semibold text-orange-800 whitespace-nowrap">No.</th>
                        <th className="px-2 md:px-4 py-3 text-left text-xs md:text-sm font-semibold text-orange-800 whitespace-nowrap min-w-[150px]">Description</th>
                        <th className="px-2 md:px-4 py-3 text-left text-xs md:text-sm font-semibold text-orange-800 whitespace-nowrap">Size (H)</th>
                        <th className="px-2 md:px-4 py-3 text-left text-xs md:text-sm font-semibold text-orange-800 whitespace-nowrap">Size (W)</th>
                        <th className="px-2 md:px-4 py-3 text-left text-xs md:text-sm font-semibold text-orange-800 whitespace-nowrap">Nos.</th>
                        <th className="px-2 md:px-4 py-3 text-left text-xs md:text-sm font-semibold text-orange-800 whitespace-nowrap">Qty.</th>
                        <th className="px-2 md:px-4 py-3 text-left text-xs md:text-sm font-semibold text-orange-800 whitespace-nowrap">Rate</th>
                        <th className="px-2 md:px-4 py-3 text-left text-xs md:text-sm font-semibold text-orange-800 whitespace-nowrap">Per</th>
                        <th className="px-2 md:px-4 py-3 text-left text-xs md:text-sm font-semibold text-orange-800 whitespace-nowrap">Amount Rs</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedChallan.items.map((item, index) => (
                        <tr key={index} className="border-b border-orange-100">
                          <td className="px-2 md:px-4 py-3 text-xs md:text-sm">{index + 1}</td>
                          <td className="px-2 md:px-4 py-3 text-xs md:text-sm">{item.description}</td>
                          <td className="px-2 md:px-4 py-3 text-xs md:text-sm">{item.sizeHeight || '-'}</td>
                          <td className="px-2 md:px-4 py-3 text-xs md:text-sm">{item.sizeWidth || '-'}</td>
                          <td className="px-2 md:px-4 py-3 text-xs md:text-sm">{item.nos || '-'}</td>
                          <td className="px-2 md:px-4 py-3 text-xs md:text-sm">{item.quantity}</td>
                          <td className="px-2 md:px-4 py-3 text-xs md:text-sm">{Number(item.rate).toFixed(2)}</td>
                          <td className="px-2 md:px-4 py-3 text-xs md:text-sm">{item.per || 'PCS'}</td>
                          <td className="px-2 md:px-4 py-3 text-xs md:text-sm font-medium">
                            {(Number(item.quantity) * Number(item.rate)).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Total */}
              <div className="border-2 border-orange-200 rounded-lg p-4">
                <div className="flex justify-end">
                  <div className="text-right">
                    <p className="text-lg font-bold text-orange-700">
                      Net Amount Rs: {(calculateTotal(selectedChallan.items)).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {(selectedChallan.note1 || selectedChallan.note2 || selectedChallan.note3 || selectedChallan.note4) && (
                <div className="border-2 border-orange-200 rounded-lg p-4">
                  <h3 className="font-bold text-orange-700 mb-2">Notes:</h3>
                  <div className="space-y-1 text-sm">
                    {selectedChallan.note1 && <p>1. {selectedChallan.note1}</p>}
                    {selectedChallan.note2 && <p>2. {selectedChallan.note2}</p>}
                    {selectedChallan.note3 && <p>3. {selectedChallan.note3}</p>}
                    {selectedChallan.note4 && <p>4. {selectedChallan.note4}</p>}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-orange-800 mb-2">Invoice History</h1>
          <p className="text-orange-600">View and manage all your invoices</p>
        </motion.div>

        {/* Filters and Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-6 mb-6"
        >
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-orange-500" />
              <input
                type="text"
                placeholder="Search by invoice number, buyer, or date..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border-2 border-orange-200 rounded-lg focus:border-orange-400 focus:ring-2 focus:ring-orange-200 outline-none"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border-2 border-orange-200 rounded-lg focus:border-orange-400 focus:ring-2 focus:ring-orange-200 outline-none"
            >
              <option value="all">All Invoices</option>
              <option value="completed">Completed</option>
              <option value="draft">Drafts</option>
            </select>
          </div>
        </motion.div>

        {/* Invoices List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
          </div>
        ) : filteredChallans.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-2xl shadow-xl p-12 text-center"
          >
            <FiFileText className="mx-auto text-6xl text-orange-300 mb-4" />
            <p className="text-xl text-gray-600">No invoices found</p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {filteredChallans.map((challan) => (
                <motion.div
                  key={challan._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-white rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-shadow"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-orange-800">
                          Invoice #{challan.invoiceNumber}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          challan.status === 'completed'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {challan.status}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-1">
                        <span className="font-semibold">Buyer:</span> {challan.buyer.split('\n')[0]}
                      </p>
                      <p className="text-gray-600 mb-1">
                        <span className="font-semibold">Date:</span> {challan.date}
                      </p>
                      <p className="text-gray-600">
                        <span className="font-semibold">Items:</span> {challan.items.length} | 
                        <span className="font-semibold ml-2">Total:</span> ₹{calculateTotal(challan.items).toFixed(2)}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleView(challan)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        <FiEye /> View
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleEdit(challan)}
                        className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                      >
                        <FiEdit /> Edit
                      </motion.button>
                      {challan.status === 'completed' && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleDownload(challan)}
                          className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                        >
                          <FiDownload /> Download
                        </motion.button>
                      )}
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleDeleteClick(challan._id, challan.invoiceNumber)}
                        className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                      >
                        <FiTrash2 /> Delete
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Custom Delete Confirmation Popup */}
      <AnimatePresence>
        {deleteConfirm && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleDeleteCancel}
              className="fixed inset-0 bg-black bg-opacity-50 z-40"
            />
            
            {/* Popup */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.5, y: 50 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1, type: "spring" }}
                    className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4"
                  >
                    <FiTrash2 className="text-red-600 text-2xl" />
                  </motion.div>
                  
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">
                    Delete Invoice?
                  </h3>
                  
                  <p className="text-gray-600 mb-6">
                    Are you sure you want to delete invoice{' '}
                    <span className="font-semibold text-orange-600">
                      #{deleteConfirm.invoiceNumber}
                    </span>?
                    <br />
                    <span className="text-sm text-red-600 mt-2 block">
                      This action cannot be undone.
                    </span>
                  </p>
                  
                  <div className="flex gap-4 justify-center">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleDeleteCancel}
                      className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleDeleteConfirm}
                      className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
                    >
                      Delete
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InvoiceHistory;


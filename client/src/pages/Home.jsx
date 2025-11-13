import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlus, FiTrash2, FiSave, FiDownload, FiCalendar, FiUser, FiFileText } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { saveDraft, saveAndDownload, updateChallan } from '../services/ceservice';

const Home = () => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    buyer: '',
    buyerGstin: '',
    note1: '',
    note2: '',
    note3: '',
    note4: '',
    items: [{ description: '', sizeHeight: '', sizeWidth: '', nos: '', quantity: '', rate: '', per: 'PCS' }],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draftId, setDraftId] = useState(null);
  const [focusedCell, setFocusedCell] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Check for edit challan in localStorage
  useEffect(() => {
    const editChallan = localStorage.getItem('editChallan');
    if (editChallan) {
      try {
        const challan = JSON.parse(editChallan);
        setFormData({
          date: challan.date || new Date().toISOString().split('T')[0],
          buyer: challan.buyer || '',
          buyerGstin: challan.buyerGstin || '',
          note1: challan.note1 || '',
          note2: challan.note2 || '',
          note3: challan.note3 || '',
          note4: challan.note4 || '',
          items: challan.items && challan.items.length > 0 
            ? challan.items 
            : [{ description: '', sizeHeight: '', sizeWidth: '', nos: '', quantity: '', rate: '', per: 'PCS' }],
        });
        setDraftId(challan._id);
        setIsEditing(true);
        localStorage.removeItem('editChallan');
        toast.success('Invoice loaded for editing');
      } catch (error) {
        console.error('Error loading edit challan:', error);
      }
    }
  }, []);

  // Add new item row when user starts typing in the last row
  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });

    // If user is typing in the last row and it has some data, add a new row
    if (index === formData.items.length - 1) {
      const lastItem = newItems[index];
      const hasData = lastItem.description || lastItem.quantity || lastItem.rate;
      if (hasData && formData.items.length === index + 1) {
        setFormData({
          ...formData,
          items: [...newItems, { description: '', sizeHeight: '', sizeWidth: '', nos: '', quantity: '', rate: '', per: 'PCS' }],
        });
      }
    }
  };

  // Remove item row
  const removeItem = (index) => {
    if (formData.items.length > 1) {
      const newItems = formData.items.filter((_, i) => i !== index);
      setFormData({ ...formData, items: newItems });
      toast.success('Item removed');
    } else {
      toast.error('At least one item is required');
    }
  };

  // Add item manually
  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { description: '', sizeHeight: '', sizeWidth: '', nos: '', quantity: '', rate: '', per: 'PCS' }],
    });
  };

  // Handle save for later
  const handleSaveDraft = async () => {
    try {
      setIsSubmitting(true);
      const draftData = {
        ...formData,
        items: formData.items.filter(item => item.description || item.quantity || item.rate),
        _id: draftId,
      };

      const response = await saveDraft(draftData);
      if (response.success) {
        setDraftId(response.data._id);
        toast.success('Draft saved successfully! You can continue later.');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save draft');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle save and download
  const handleSaveAndDownload = async () => {
    // Validate required fields
    if (!formData.date || !formData.buyer) {
      toast.error('Please fill in Date and Buyer fields');
      return;
    }

    const validItems = formData.items.filter(
      item => item.description && item.quantity && item.rate
    );

    if (validItems.length === 0) {
      toast.error('Please add at least one item with description, quantity, and rate');
      return;
    }

    try {
      setIsSubmitting(true);
      const challanData = {
        ...formData,
        items: validItems.map(item => ({
          ...item,
          quantity: Number(item.quantity),
          rate: Number(item.rate),
        })),
        _id: draftId,
      };

      await saveAndDownload(challanData);
      toast.success('Invoice saved and downloaded successfully!');
      
      // Reset form after successful save
      setFormData({
        date: new Date().toISOString().split('T')[0],
        buyer: '',
        buyerGstin: '',
        note1: '',
        note2: '',
        note3: '',
        note4: '',
        items: [{ description: '', sizeHeight: '', sizeWidth: '', nos: '', quantity: '', rate: '', per: 'PCS' }],
      });
      setDraftId(null);
      setIsEditing(false);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save and download');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-orange-800 mb-2">
            {isEditing ? 'Edit Invoice' : 'Create Invoice'}
          </h1>
          <p className="text-orange-600">
            {isEditing ? 'Update the details below and save your invoice' : 'Fill in the details below to generate your invoice'}
          </p>
        </motion.div>

        {/* Main Form Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-2xl shadow-xl p-6 md:p-8 mb-6"
        >
          {/* Basic Information Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-orange-700 mb-6 flex items-center gap-2">
              <FiFileText className="text-orange-500" />
              Basic Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Date */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FiCalendar className="inline mr-2 text-orange-500" />
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-orange-200 rounded-lg focus:border-orange-400 focus:ring-2 focus:ring-orange-200 transition-all outline-none"
                  required
                />
              </motion.div>

              {/* Buyer */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FiUser className="inline mr-2 text-orange-500" />
                  Buyer Name/Address <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.buyer}
                  onChange={(e) => setFormData({ ...formData, buyer: e.target.value })}
                  placeholder="Enter buyer name and address..."
                  rows="3"
                  className="w-full px-4 py-3 border-2 border-orange-200 rounded-lg focus:border-orange-400 focus:ring-2 focus:ring-orange-200 transition-all outline-none resize-none"
                  required
                />
              </motion.div>

              {/* GSTIN */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="md:col-span-2"
              >
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  GSTIN Number
                </label>
                <input
                  type="text"
                  value={formData.buyerGstin}
                  onChange={(e) => setFormData({ ...formData, buyerGstin: e.target.value })}
                  placeholder="Enter GSTIN number (optional)"
                  className="w-full px-4 py-3 border-2 border-orange-200 rounded-lg focus:border-orange-400 focus:ring-2 focus:ring-orange-200 transition-all outline-none"
                />
              </motion.div>
            </div>
          </div>

          {/* Items Table Section */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-orange-700 flex items-center gap-2">
                <FiFileText className="text-orange-500" />
                Items
              </h2>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={addItem}
                className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors shadow-md"
              >
                <FiPlus /> Add Item
              </motion.button>
            </div>

            {/* Items Table */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="bg-orange-100">
                    <th className="px-2 md:px-4 py-3 text-left text-xs md:text-sm font-semibold text-orange-800 min-w-[120px]">Description</th>
                    <th className="px-2 md:px-4 py-3 text-left text-xs md:text-sm font-semibold text-orange-800 min-w-[80px]">Size (H)</th>
                    <th className="px-2 md:px-4 py-3 text-left text-xs md:text-sm font-semibold text-orange-800 min-w-[80px]">Size (W)</th>
                    <th className="px-2 md:px-4 py-3 text-left text-xs md:text-sm font-semibold text-orange-800 min-w-[60px]">Nos.</th>
                    <th className="px-2 md:px-4 py-3 text-left text-xs md:text-sm font-semibold text-orange-800 min-w-[70px]">Qty.</th>
                    <th className="px-2 md:px-4 py-3 text-left text-xs md:text-sm font-semibold text-orange-800 min-w-[80px]">Rate</th>
                    <th className="px-2 md:px-4 py-3 text-left text-xs md:text-sm font-semibold text-orange-800 min-w-[90px]">Per</th>
                    <th className="px-2 md:px-4 py-3 text-left text-xs md:text-sm font-semibold text-orange-800 min-w-[90px]">Amount</th>
                    <th className="px-2 md:px-4 py-3 text-center text-xs md:text-sm font-semibold text-orange-800 min-w-[60px]">Action</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {formData.items.map((item, index) => (
                      <motion.tr
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                        className="border-b border-orange-100 hover:bg-orange-50 transition-colors"
                      >
                        <td className="px-2 md:px-4 py-3">
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                            onFocus={() => setFocusedCell(`${index}-description`)}
                            onBlur={() => setFocusedCell(null)}
                            placeholder="Item description"
                            className={`w-full px-2 md:px-3 py-2 md:py-2 border border-orange-200 rounded focus:border-orange-400 focus:ring-1 focus:ring-orange-200 outline-none text-xs md:text-sm transition-all ${
                              focusedCell === `${index}-description` ? 'md:scale-100 scale-105 z-10 relative bg-white shadow-lg' : ''
                            }`}
                          />
                        </td>
                        <td className="px-2 md:px-4 py-3">
                          <input
                            type="text"
                            value={item.sizeHeight}
                            onChange={(e) => handleItemChange(index, 'sizeHeight', e.target.value)}
                            onFocus={() => setFocusedCell(`${index}-sizeHeight`)}
                            onBlur={() => setFocusedCell(null)}
                            placeholder="Height"
                            className={`w-full px-2 md:px-3 py-2 md:py-2 border border-orange-200 rounded focus:border-orange-400 focus:ring-1 focus:ring-orange-200 outline-none text-xs md:text-sm transition-all ${
                              focusedCell === `${index}-sizeHeight` ? 'md:scale-100 scale-105 z-10 relative bg-white shadow-lg' : ''
                            }`}
                          />
                        </td>
                        <td className="px-2 md:px-4 py-3">
                          <input
                            type="text"
                            value={item.sizeWidth}
                            onChange={(e) => handleItemChange(index, 'sizeWidth', e.target.value)}
                            onFocus={() => setFocusedCell(`${index}-sizeWidth`)}
                            onBlur={() => setFocusedCell(null)}
                            placeholder="Width"
                            className={`w-full px-2 md:px-3 py-2 md:py-2 border border-orange-200 rounded focus:border-orange-400 focus:ring-1 focus:ring-orange-200 outline-none text-xs md:text-sm transition-all ${
                              focusedCell === `${index}-sizeWidth` ? 'md:scale-100 scale-105 z-10 relative bg-white shadow-lg' : ''
                            }`}
                          />
                        </td>
                        <td className="px-2 md:px-4 py-3">
                          <input
                            type="text"
                            value={item.nos}
                            onChange={(e) => handleItemChange(index, 'nos', e.target.value)}
                            onFocus={() => setFocusedCell(`${index}-nos`)}
                            onBlur={() => setFocusedCell(null)}
                            placeholder="Nos."
                            className={`w-full px-2 md:px-3 py-2 md:py-2 border border-orange-200 rounded focus:border-orange-400 focus:ring-1 focus:ring-orange-200 outline-none text-xs md:text-sm transition-all ${
                              focusedCell === `${index}-nos` ? 'md:scale-100 scale-105 z-10 relative bg-white shadow-lg' : ''
                            }`}
                          />
                        </td>
                        <td className="px-2 md:px-4 py-3">
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                            onFocus={() => setFocusedCell(`${index}-quantity`)}
                            onBlur={() => setFocusedCell(null)}
                            placeholder="Qty"
                            min="0"
                            step="0.01"
                            className={`w-full px-2 md:px-3 py-2 md:py-2 border border-orange-200 rounded focus:border-orange-400 focus:ring-1 focus:ring-orange-200 outline-none text-xs md:text-sm transition-all ${
                              focusedCell === `${index}-quantity` ? 'md:scale-100 scale-105 z-10 relative bg-white shadow-lg' : ''
                            }`}
                          />
                        </td>
                        <td className="px-2 md:px-4 py-3">
                          <input
                            type="number"
                            value={item.rate}
                            onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                            onFocus={() => setFocusedCell(`${index}-rate`)}
                            onBlur={() => setFocusedCell(null)}
                            placeholder="Rate"
                            min="0"
                            step="0.01"
                            className={`w-full px-2 md:px-3 py-2 md:py-2 border border-orange-200 rounded focus:border-orange-400 focus:ring-1 focus:ring-orange-200 outline-none text-xs md:text-sm transition-all ${
                              focusedCell === `${index}-rate` ? 'md:scale-100 scale-105 z-10 relative bg-white shadow-lg' : ''
                            }`}
                          />
                        </td>
                        <td className="px-2 md:px-4 py-3">
                          <select
                            value={item.per}
                            onChange={(e) => handleItemChange(index, 'per', e.target.value)}
                            onFocus={() => setFocusedCell(`${index}-per`)}
                            onBlur={() => setFocusedCell(null)}
                            className={`w-full px-2 md:px-3 py-2 md:py-2 border border-orange-200 rounded focus:border-orange-400 focus:ring-1 focus:ring-orange-200 outline-none text-xs md:text-sm transition-all ${
                              focusedCell === `${index}-per` ? 'md:scale-100 scale-105 z-10 relative bg-white shadow-lg' : ''
                            }`}
                          >
                            <option value="PCS">PCS</option>
                            <option value="BOX">BOX</option>
                            <option value="SET">SET</option>
                            <option value="UNIT">UNIT</option>
                          </select>
                        </td>
                        <td className="px-2 md:px-4 py-3 text-xs md:text-sm font-medium text-orange-700">
                          {item.quantity && item.rate
                            ? (Number(item.quantity) * Number(item.rate)).toFixed(2)
                            : '0.00'}
                        </td>
                        <td className="px-2 md:px-4 py-3 text-center">
                          {formData.items.length > 1 && (
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => removeItem(index)}
                              className="text-red-500 hover:text-red-700 transition-colors"
                            >
                              <FiTrash2 />
                            </motion.button>
                          )}
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>

          {/* Notes Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-orange-700 mb-4 flex items-center gap-2">
              <FiFileText className="text-orange-500" />
              Additional Notes (Optional)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((num) => (
                <motion.div
                  key={num}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + num * 0.1 }}
                >
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Note {num}
                  </label>
                  <input
                    type="text"
                    value={formData[`note${num}`]}
                    onChange={(e) => setFormData({ ...formData, [`note${num}`]: e.target.value })}
                    placeholder={`Optional note ${num}`}
                    className="w-full px-4 py-3 border-2 border-orange-200 rounded-lg focus:border-orange-400 focus:ring-2 focus:ring-orange-200 transition-all outline-none"
                  />
                </motion.div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-end pt-6 border-t border-orange-200"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSaveDraft}
              disabled={isSubmitting}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              <FiSave />
              {isSubmitting ? 'Saving...' : 'Save for Later'}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSaveAndDownload}
              disabled={isSubmitting}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              <FiDownload />
              {isSubmitting ? 'Processing...' : 'Save & Download PDF'}
            </motion.button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Home;


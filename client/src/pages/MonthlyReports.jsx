import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiDownload, FiFile, FiRefreshCw, FiCalendar } from 'react-icons/fi';
import toast from 'react-hot-toast';
import axiosInstance from '../utils/axiosInstance';

const MonthlyReports = () => {
  const [excelFiles, setExcelFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  useEffect(() => {
    loadExcelFiles();
  }, []);

  const loadExcelFiles = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/api/challans/monthly-excel/list');
      if (response.data.success) {
        setExcelFiles(response.data.data || []);
      }
    } catch (error) {
      console.error('Error loading Excel files:', error);
      toast.error('Failed to load monthly Excel files');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/challans/monthly-excel/${selectedYear}/${selectedMonth}`,
        {
          method: 'GET',
          credentials: 'include',
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const filename = `${monthNames[selectedMonth - 1].toLowerCase()}${selectedYear}.xlsx`;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        
        toast.success('Excel file generated and downloaded successfully');
        // Reload the list after a short delay
        setTimeout(() => {
          loadExcelFiles();
        }, 1000);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to generate Excel file');
      }
    } catch (error) {
      console.error('Error generating Excel:', error);
      toast.error('Failed to generate Excel file');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async (filename) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/challans/monthly-excel/download/${filename}`,
        {
          method: 'GET',
          credentials: 'include',
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        toast.success('Excel file downloaded successfully');
      } else {
        toast.error('Failed to download Excel file');
      }
    } catch (error) {
      console.error('Error downloading Excel:', error);
      toast.error('Failed to download Excel file');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getMonthYearFromFilename = (filename) => {
    // Extract month and year from filename like "november2025.xlsx"
    const match = filename.match(/(\w+)(\d{4})\.xlsx/);
    if (match) {
      const monthName = match[1];
      const year = match[2];
      // Capitalize first letter
      const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
      return `${capitalizedMonth} ${year}`;
    }
    return filename.replace('.xlsx', '');
  };

  // Generate years array (current year and 2 years before/after)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-orange-800 mb-2">Monthly Reports</h1>
        <p className="text-gray-600">Generate and download monthly invoice Excel files</p>
      </motion.div>

      {/* Generate New Excel Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-md p-6 mb-8"
      >
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <FiCalendar className="text-orange-600" />
          Generate New Monthly Excel
        </h2>
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Year
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Month
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              {monthNames.map((month, index) => (
                <option key={index + 1} value={index + 1}>
                  {month}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {generating ? (
              <>
                <FiRefreshCw className="animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FiFile />
                Generate Excel
              </>
            )}
          </button>
        </div>
      </motion.div>

      {/* Available Excel Files Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-lg shadow-md p-6"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <FiFile className="text-orange-600" />
            Available Monthly Excel Files
          </h2>
          <button
            onClick={loadExcelFiles}
            disabled={loading}
            className="px-4 py-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors flex items-center gap-2"
          >
            <FiRefreshCw className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <FiRefreshCw className="animate-spin text-4xl text-orange-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading Excel files...</p>
          </div>
        ) : excelFiles.length === 0 ? (
          <div className="text-center py-12">
            <FiFile className="text-6xl text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No monthly Excel files available</p>
            <p className="text-gray-500 text-sm mt-2">
              Generate a new Excel file using the form above
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-orange-50">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    File Name
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Month & Year
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Size
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Modified
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {excelFiles.map((file, index) => (
                  <motion.tr
                    key={file.filename}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-gray-200 hover:bg-gray-50"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <FiFile className="text-orange-600" />
                        <span className="text-sm font-medium text-gray-800">
                          {file.filename}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {getMonthYearFromFilename(file.filename)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatFileSize(file.size)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatDate(file.modifiedAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center">
                        <button
                          onClick={() => handleDownload(file.filename)}
                          className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2 text-sm"
                        >
                          <FiDownload />
                          Download
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default MonthlyReports;


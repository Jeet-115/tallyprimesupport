import axiosInstance from '../utils/axiosInstance';

// Get all challans with optional filters
export const getAllChallans = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.status) queryParams.append('status', params.status);
  if (params.page) queryParams.append('page', params.page);
  if (params.limit) queryParams.append('limit', params.limit);
  
  const queryString = queryParams.toString();
  const url = `/api/challans${queryString ? `?${queryString}` : ''}`;
  
  const res = await axiosInstance.get(url);
  return res.data;
};

// Get a single challan by ID
export const getChallanById = async (id) => {
  const res = await axiosInstance.get(`/api/challans/${id}`);
  return res.data;
};

// Create a new challan
export const createChallan = async (challanData) => {
  const res = await axiosInstance.post('/api/challans', challanData);
  return res.data;
};

// Update a challan
export const updateChallan = async (id, challanData) => {
  const res = await axiosInstance.put(`/api/challans/${id}`, challanData);
  return res.data;
};

// Save as draft (save for later)
export const saveDraft = async (draftData) => {
  const res = await axiosInstance.post('/api/challans/draft', draftData);
  return res.data;
};

// Save and download PDF
export const saveAndDownload = async (challanData) => {
  const res = await axiosInstance.post('/api/challans/save-download', challanData, {
    responseType: 'blob', // Important for PDF download
  });
  
  // Create blob URL and trigger download
  const blob = new Blob([res.data], { type: 'application/pdf' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  
  // Extract filename from Content-Disposition header if available
  const contentDisposition = res.headers['content-disposition'];
  let filename = 'invoice.pdf';
  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
    if (filenameMatch) {
      filename = filenameMatch[1];
    }
  }
  
  // Use invoice number from response if available, otherwise use extracted filename
  // The backend should return invoice number in the response
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
  
  return { success: true, message: 'PDF downloaded successfully', filename };
};

// Download PDF for existing invoice
export const downloadInvoice = async (invoiceNumber) => {
  const res = await axiosInstance.get(`/api/challans/download/${invoiceNumber}`, {
    responseType: 'blob',
  });
  
  const blob = new Blob([res.data], { type: 'application/pdf' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `invoice-${invoiceNumber}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
  
  return { success: true, message: 'PDF downloaded successfully' };
};

// Delete a challan
export const deleteChallan = async (id) => {
  const res = await axiosInstance.delete(`/api/challans/${id}`);
  return res.data;
};


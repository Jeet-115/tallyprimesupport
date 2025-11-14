import XLSX from "xlsx";

const monthNames = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];

// Generate Excel file for monthly invoice data and return buffer
export const generateMonthlyExcel = async (invoices, year, month) => {
  try {
    // Calculate total amount for each invoice
    const excelData = invoices.map((invoice) => {
      const totalAmount = invoice.items.reduce((sum, item) => {
        const qty = Number(item.quantity || item.qty || 0);
        const rate = Number(item.rate || 0);
        return sum + qty * rate;
      }, 0);

      return {
        "Invoice Number": invoice.invoiceNumber || "",
        Date: invoice.date || "",
        Buyer: invoice.buyer || "",
        "Buyer GSTIN": invoice.buyerGstin || "",
        "Total Amount": totalAmount.toFixed(2),
      };
    });

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    worksheet["!cols"] = [
      { wch: 15 }, // Invoice Number
      { wch: 12 }, // Date
      { wch: 30 }, // Buyer
      { wch: 20 }, // Buyer GSTIN
      { wch: 15 }, // Total Amount
    ];

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Monthly Invoices");

    // Generate filename
    const monthName = monthNames[month - 1];
    const filename = `${monthName}${year}.xlsx`;

    // Generate buffer
    const buffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    return {
      buffer,
      filename,
      invoicesCount: excelData.length,
    };
  } catch (error) {
    console.error("Error generating Excel file:", error);
    throw error;
  }
};


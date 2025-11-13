import fs from "fs";
import fsPromises from "fs/promises";
import path from "path";
import os from "os";
import { fileURLToPath } from "url";
import PDFDocument from "pdfkit";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOGO_PATH = path.join(__dirname, "..", "ce.jpg");
const SIGNATURE_PATH = path.join(__dirname, "..", "sig.jpg");

const ensureDirectory = async (dirPath) => {
  await fsPromises.mkdir(dirPath, { recursive: true });
};

const formatCurrency = (value) =>
  typeof value === "number" ? value.toFixed(2) : Number(value || 0).toFixed(2);

// Convert number to words (Indian numbering system)
const numberToWords = (num) => {
  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  const convertHundreds = (n) => {
    let result = "";
    if (n >= 100) {
      result += ones[Math.floor(n / 100)] + " Hundred ";
      n %= 100;
    }
    if (n >= 20) {
      result += tens[Math.floor(n / 10)] + " ";
      n %= 10;
    }
    if (n > 0) {
      result += ones[n] + " ";
    }
    return result.trim();
  };

  if (num === 0) return "Zero";

  let words = "";
  const numStr = num.toFixed(2);
  const [integerPart, decimalPart] = numStr.split(".");

  let numInt = parseInt(integerPart);

  if (numInt >= 10000000) {
    const crores = Math.floor(numInt / 10000000);
    words += convertHundreds(crores) + "Crore ";
    numInt %= 10000000;
  }

  if (numInt >= 100000) {
    const lakhs = Math.floor(numInt / 100000);
    words += convertHundreds(lakhs) + "Lakh ";
    numInt %= 100000;
  }

  if (numInt >= 1000) {
    const thousands = Math.floor(numInt / 1000);
    words += convertHundreds(thousands) + "Thousand ";
    numInt %= 1000;
  }

  if (numInt > 0) {
    words += convertHundreds(numInt);
  }

  words = words.trim() + " Rupees";

  if (decimalPart && parseInt(decimalPart) > 0) {
    const paise = parseInt(decimalPart);
    words += " and " + convertHundreds(paise) + " Paise";
  }

  return words.trim() + " Only";
};

// New table column configuration
const columnConfig = [
  { key: "srNo", label: "No.", factor: 0.05, align: "center" },
  { key: "description", label: "Description of goods", factor: 0.25, align: "left" },
  { key: "sizeHeight", label: "Size", factor: 0.08, align: "center" },
  { key: "sizeWidth", label: "Size", factor: 0.08, align: "center" },
  { key: "nos", label: "Nos.", factor: 0.08, align: "center" },
  { key: "qty", label: "Qty.", factor: 0.08, align: "right" },
  { key: "rate", label: "Rate", factor: 0.10, align: "right" },
  { key: "per", label: "Per", factor: 0.08, align: "center" },
  { key: "amount", label: "Amount Rs", factor: 0.20, align: "right" },
];

const drawTableBorders = (doc, startX, startY, headerHeight, rowHeights, colWidths) => {
  const tableWidth = colWidths.reduce((sum, w) => sum + w, 0);
  const bodyHeight = rowHeights.reduce((sum, h) => sum + h, 0);
  const totalHeight = headerHeight + bodyHeight;

  let currentY = startY;
  // Top border
  doc.moveTo(startX, currentY).lineTo(startX + tableWidth, currentY).stroke();

  currentY += headerHeight;
  // Header bottom border
  doc.moveTo(startX, currentY).lineTo(startX + tableWidth, currentY).stroke();

  rowHeights.forEach((height) => {
    currentY += height;
    doc.moveTo(startX, currentY).lineTo(startX + tableWidth, currentY).stroke();
  });

  // Vertical borders
  let currentX = startX;
  doc.moveTo(startX, startY).lineTo(startX, startY + totalHeight).stroke();
  colWidths.forEach((w) => {
    currentX += w;
    doc.moveTo(currentX, startY).lineTo(currentX, startY + totalHeight).stroke();
  });
};

// Add header with 80% width image
const addHeader = async (doc) => {
  try {
    if (fs.existsSync(LOGO_PATH)) {
      const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
      const imageWidth = pageWidth * 0.8;
      const imageHeight = 80;
      const centerX = (doc.page.width - imageWidth) / 2;
      doc.image(LOGO_PATH, centerX, doc.y, {
        width: imageWidth,
        height: imageHeight,
        fit: [imageWidth, imageHeight],
        align: "center",
      });
      doc.y += imageHeight + 15;
    } else {
      console.warn(`Logo file not found at: ${LOGO_PATH}`);
      doc.font("Helvetica").fontSize(10).text("Company Logo", { align: "center" });
      doc.moveDown(0.2);
    }
  } catch (error) {
    console.error("Error loading logo:", error);
    doc.font("Helvetica").fontSize(10).text("Company Logo", { align: "center" });
    doc.moveDown(0.2);
  }
};

// Add buyer and invoice info section
const addBuyerInvoiceSection = (doc, invoiceData) => {
  const startX = doc.page.margins.left;
  const startY = doc.y;
  const tableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const leftWidth = tableWidth * 0.6;
  const rightWidth = tableWidth * 0.4;
  const rightStartX = startX + leftWidth;

  doc.lineWidth(0.5);

  const buyerLabelHeight = 18;
  const gstinLabelHeight = 18;

  const buyerText = invoiceData.buyer || "Buyer Name/Address";
  const buyerContentHeight = Math.max(
    24,
    doc.heightOfString(buyerText, { width: leftWidth - 16 }) + 10
  );
  const buyerCellHeight = buyerLabelHeight + buyerContentHeight;

  const gstText = invoiceData.buyerGstin || "GSTIN Number";
  const gstContentHeight = Math.max(
    20,
    doc.heightOfString(gstText, { width: leftWidth - 16 }) + 8
  );
  let gstCellHeight = gstinLabelHeight + gstContentHeight;

  let leftContentHeight = buyerCellHeight + gstCellHeight;

  const invoiceHeaderHeight = 24;
  const col1Width = rightWidth * 0.5;
  const col2Width = rightWidth * 0.5;
  const col2StartX = rightStartX + col1Width;

  const minCellHeight = 18;

  const invoiceNumber = invoiceData.invoiceNumber || "-";
  const dateText = invoiceData.date || new Date().toLocaleDateString();
  const row1HeightCol1 = Math.max(
    minCellHeight,
    doc.heightOfString(invoiceNumber, { width: col1Width - 20 }) + 20
  );
  const row1HeightCol2 = Math.max(
    minCellHeight,
    doc.heightOfString(dateText, { width: col2Width - 20 }) + 20
  );
  let row1Height = Math.max(row1HeightCol1, row1HeightCol2);

  const note1Text = invoiceData.note1 || "";
  const note3Text = invoiceData.note3 || "";
  const row2HeightCol1 = Math.max(
    minCellHeight,
    doc.heightOfString(note1Text, { width: col1Width - 20 }) + 12
  );
  const row2HeightCol2 = Math.max(
    minCellHeight,
    doc.heightOfString(note3Text, { width: col2Width - 20 }) + 12
  );
  let row2Height = Math.max(row2HeightCol1, row2HeightCol2);

  const note2Text = invoiceData.note2 || "";
  const note4Text = invoiceData.note4 || "";
  const row3HeightCol1 = Math.max(
    minCellHeight,
    doc.heightOfString(note2Text, { width: col1Width - 20 }) + 12
  );
  const row3HeightCol2 = Math.max(
    minCellHeight,
    doc.heightOfString(note4Text, { width: col2Width - 20 }) + 12
  );
  let row3Height = Math.max(row3HeightCol1, row3HeightCol2);

  let rightContentHeight = row1Height + row2Height + row3Height;
  let rightSectionHeight = invoiceHeaderHeight + rightContentHeight;

  let sectionHeight = Math.max(leftContentHeight, rightSectionHeight);

  if (leftContentHeight < sectionHeight) {
    const extraLeft = sectionHeight - leftContentHeight;
    gstCellHeight += extraLeft;
    leftContentHeight += extraLeft;
  }

  if (rightSectionHeight < sectionHeight) {
    const extraRight = sectionHeight - rightSectionHeight;
    row3Height += extraRight;
    rightContentHeight = row1Height + row2Height + row3Height;
    rightSectionHeight = invoiceHeaderHeight + rightContentHeight;
  }

  const currentY = startY;
  doc.rect(startX, currentY, tableWidth, sectionHeight).stroke();
  doc.moveTo(rightStartX, currentY).lineTo(rightStartX, currentY + sectionHeight).stroke();

  doc.rect(startX, currentY, leftWidth, buyerCellHeight).stroke();
  doc.font("Helvetica-Bold").fontSize(10);
  doc.text("BUYER :-", startX + 8, currentY + 4);
  doc.font("Helvetica").fontSize(9);
  doc.text(buyerText, startX + 8, currentY + buyerLabelHeight, { width: leftWidth - 16 });

  const gstinY = currentY + buyerCellHeight;
  doc.rect(startX, gstinY, leftWidth, gstCellHeight).stroke();
  doc.font("Helvetica-Bold").fontSize(10);
  doc.text("GSTIN No:-", startX + 8, gstinY + 4);
  doc.font("Helvetica").fontSize(9);
  doc.text(gstText, startX + 8, gstinY + gstinLabelHeight, { width: leftWidth - 16 });

  doc.rect(rightStartX, currentY, rightWidth, invoiceHeaderHeight).stroke();
  doc.font("Helvetica-Bold").fontSize(12);
  doc.text("INVOICE", rightStartX, currentY + 6, { width: rightWidth, align: "center" });

  const invoiceContentY = currentY + invoiceHeaderHeight;

  doc.rect(rightStartX, invoiceContentY, col1Width, row1Height).stroke();
  doc.font("Helvetica-Bold").fontSize(9);
  doc.text("No:-", rightStartX + 8, invoiceContentY + 6);
  doc.font("Helvetica").fontSize(9);
  doc.text(invoiceNumber, rightStartX + 8, invoiceContentY + 18, { width: col1Width - 16 });

  doc.rect(col2StartX, invoiceContentY, col2Width, row1Height).stroke();
  doc.font("Helvetica-Bold").fontSize(9);
  doc.text("Date:-", col2StartX + 8, invoiceContentY + 6);
  doc.font("Helvetica").fontSize(9);
  doc.text(dateText, col2StartX + 8, invoiceContentY + 18, { width: col2Width - 16 });

  const note1Y = invoiceContentY + row1Height;
  doc.rect(rightStartX, note1Y, col1Width, row2Height).stroke();
  doc.font("Helvetica").fontSize(9);
  doc.text(note1Text, rightStartX + 8, note1Y + 6, { width: col1Width - 16 });

  doc.rect(col2StartX, note1Y, col2Width, row2Height).stroke();
  doc.text(note3Text, col2StartX + 8, note1Y + 6, { width: col2Width - 16 });

  const note2Y = note1Y + row2Height;
  doc.rect(rightStartX, note2Y, col1Width, row3Height).stroke();
  doc.text(note2Text, rightStartX + 8, note2Y + 6, { width: col1Width - 16 });

  doc.rect(col2StartX, note2Y, col2Width, row3Height).stroke();
  doc.text(note4Text, col2StartX + 8, note2Y + 6, { width: col2Width - 16 });

  doc.moveTo(col2StartX, invoiceContentY).lineTo(col2StartX, note2Y + row3Height).stroke();

  doc.y = currentY + sectionHeight + 10;
  return doc.y;
};

// Add main items table
const addTable = (doc, items, startY) => {
  const startX = doc.page.margins.left;
  const headerHeight = 28;
  let currentY = startY;

  doc.lineWidth(0.6);
  doc.font("Helvetica-Bold").fontSize(9);

  // Compute dynamic widths
  const tableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const totalFactor = columnConfig.reduce((s, c) => s + c.factor, 0);
  const colWidths = columnConfig.map((c) => Math.floor((c.factor / totalFactor) * tableWidth));

  // Adjust the last column to fill rounding difference
  const widthSum = colWidths.reduce((a, b) => a + b, 0);
  if (widthSum !== tableWidth) {
    colWidths[colWidths.length - 1] += tableWidth - widthSum;
  }

  // Draw header row background
  doc.save();
  doc.rect(startX, currentY, tableWidth, headerHeight).fill("#e8e3d5");
  doc.restore();
  doc.fillColor("#000");

  // Header row
  let cursorX = startX;
  columnConfig.forEach((col, idx) => {
    const w = colWidths[idx];
    doc.text(col.label, cursorX + 4, currentY + 8, {
      width: w - 8,
      align: col.align,
    });
    cursorX += w;
  });
  currentY += headerHeight;

  doc.font("Helvetica").fontSize(9);

  const rowsData = items.map((item, index) => {
    const rate = Number(item.rate || 0);
    const qty = Number(item.quantity || item.qty || 0);
    const lineTotal = rate * qty;
    return {
      srNo: index + 1,
      description: item.description || item.item || item.box?.title || "",
      sizeHeight: item.sizeHeight || item.height || "",
      sizeWidth: item.sizeWidth || item.width || "",
      nos: item.nos || "",
      qty: qty,
      rate: rate.toFixed(2),
      per: item.per || "PCS",
      amount: lineTotal.toFixed(2),
      rawAmount: lineTotal,
    };
  });

  const rowHeights = [];

  rowsData.forEach((row, idx) => {
    let rowHeight = 0;
    columnConfig.forEach((col, cIdx) => {
      const w = colWidths[cIdx];
      const value = row[col.key] ?? "";
      const cellText = String(value);
      const cellHeight = doc.heightOfString(cellText || " ", {
        width: w - 8,
        align: col.align,
        lineGap: 2,
      });
      rowHeight = Math.max(rowHeight, cellHeight + 12);
    });
    rowHeight = Math.max(rowHeight, 24);
    rowHeights.push(rowHeight);

    let x = startX;
    columnConfig.forEach((col, cIdx) => {
      const w = colWidths[cIdx];
      const value = row[col.key] ?? "";
      doc.text(String(value), x + 4, currentY + 6, {
        width: w - 8,
        align: col.align,
        lineGap: 2,
      });
      x += w;
    });
    currentY += rowHeight;
  });

  drawTableBorders(doc, startX, startY, headerHeight, rowHeights, colWidths);

  const netAmount = rowsData.reduce((sum, row) => sum + row.rawAmount, 0);

  return {
    endY: currentY,
    netAmount,
    tableWidth,
    startX,
  };
};

// Add net amount and rupees in words
const addAmountSection = (doc, netAmount, startX, tableWidth) => {
  let currentY = doc.y + 10;
  doc.lineWidth(0.5);

  // Net Amount cell
  const netAmountHeight = 20;
  doc.rect(startX, currentY, tableWidth, netAmountHeight).stroke();
  doc.font("Helvetica-Bold").fontSize(10);
  doc.text("Net Amount Rs", startX + 4, currentY + 6, { width: tableWidth * 0.7, align: "right" });
  doc.text(formatCurrency(netAmount), startX + tableWidth * 0.7, currentY + 6, {
    width: tableWidth * 0.3 - 8,
    align: "right",
  });

  currentY += netAmountHeight + 2;

  // Rupees in Words cell
  const wordsText = numberToWords(netAmount);
  const wordsHeight = Math.max(30, doc.heightOfString(wordsText, { width: tableWidth - 8 }) + 10);
  doc.rect(startX, currentY, tableWidth, wordsHeight).stroke();
  doc.font("Helvetica-Bold").fontSize(10);
  doc.text("Rupees in Words :-", startX + 4, currentY + 6);
  doc.font("Helvetica").fontSize(9);
  doc.text(wordsText, startX + 4, currentY + 20, { width: tableWidth - 8 });

  doc.y = currentY + wordsHeight + 10;
  return doc.y;
};

// Add footer with company info and signature
const addFooter = (doc, invoiceData) => {
  const startX = doc.page.margins.left;
  const tableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const leftWidth = tableWidth * 0.6;
  const rightWidth = tableWidth * 0.4;
  const rightStartX = startX + leftWidth;
  let currentY = doc.y + 10;

  // Left side (60%) - Company info
  doc.font("Helvetica").fontSize(8);
  
  // Draw border around left section
  const leftSectionHeight = 200;
  doc.rect(startX, currentY, leftWidth, leftSectionHeight).stroke();
  
  let leftY = currentY + 6;
  
  // GSTIN line
  doc.text("GSTIN NO.: 24BETPM5139L1ZW  State : Gujrat(24) COMPOSITION DEALERS", startX + 4, leftY, { width: leftWidth - 8 });
  leftY += 14;
  
  // Bank Name
  doc.text("Bank Name : Indian Overseas Bank, Gotri Road, Vadodara.", startX + 4, leftY, { width: leftWidth - 8 });
  leftY += 14;
  
  // Account details
  doc.text("A/c. No. : 171702000000945         IFSC Code : IOBA0001717", startX + 4, leftY, { width: leftWidth - 8 });
  leftY += 20;
  
  // Terms & Conditions header
  doc.font("Helvetica-Bold").fontSize(9);
  doc.text("Term & Condition:", startX + 4, leftY);
  leftY += 16;
  
  // Terms & Conditions - calculate dynamic heights for each point
  doc.font("Helvetica").fontSize(8);
  const terms = [
    "1) Measurement shall be consider as Standard Size.",
    "2) All Goods will be dispatched entirely at the owner risk our responsibility cease as soon as the goods leave our premises.",
    "3) Goods once sold will not be taken back.",
    "4) 24% Interest will be charged if the payment is not made within due date.",
    "",
    "Subject to VADODARA Jursidiction",
  ];
  
  terms.forEach((line) => {
    if (line) {
      // Calculate the actual height needed for this line of text
      const textHeight = doc.heightOfString(line, { width: leftWidth - 16 });
      // Add padding (4px top + 4px bottom = 8px total)
      const lineHeight = textHeight + 8;
      
      doc.text(line, startX + 8, leftY + 4, { width: leftWidth - 16 });
      leftY += lineHeight;
    } else {
      leftY += 6;
    }
  });

  // Right side (40%) - Signature section
  // Draw border around right section
  const rightSectionHeight = 200;
  doc.rect(rightStartX, currentY, rightWidth, rightSectionHeight).stroke();
  
  const rightY = currentY;
  
  // For CHAMUNDA ENTERPRISE cell
  const headerCellHeight = 25;
  doc.rect(rightStartX, rightY, rightWidth, headerCellHeight).stroke();
  doc.font("Helvetica-Bold").fontSize(10);
  doc.text("For CHAMUNDA ENTERPRISE", rightStartX, rightY + 8, {
    width: rightWidth,
    align: "center",
  });

  // Signature image cell
  const sigCellY = rightY + headerCellHeight;
  const sigCellHeight = 120;
  doc.rect(rightStartX, sigCellY, rightWidth, sigCellHeight).stroke();
  
  try {
    if (fs.existsSync(SIGNATURE_PATH)) {
      const sigWidth = 100;
      const sigHeight = 50;
      const sigX = rightStartX + (rightWidth - sigWidth) / 2;
      const sigY = sigCellY + (sigCellHeight - sigHeight) / 2;
      doc.image(SIGNATURE_PATH, sigX, sigY, {
        width: sigWidth,
        height: sigHeight,
        fit: [sigWidth, sigHeight],
      });
    } else {
      console.warn(`Signature file not found at: ${SIGNATURE_PATH}`);
    }
  } catch (error) {
    console.error("Error loading signature:", error);
  }

  // Authorised Signatory cell
  const signatoryCellY = sigCellY + sigCellHeight;
  doc.rect(rightStartX, signatoryCellY, rightWidth, headerCellHeight).stroke();
  doc.font("Helvetica-Bold").fontSize(10);
  doc.text("Authorised Signatory", rightStartX, signatoryCellY + 8, {
    width: rightWidth,
    align: "center",
  });

  // Vertical line between left and right sections
  doc.moveTo(rightStartX, currentY).lineTo(rightStartX, currentY + rightSectionHeight).stroke();
};

export const generateChallanPdf = async (invoiceData, includeGST = true) => {
  if (!invoiceData) {
    throw new Error("Invoice data is required to generate PDF");
  }

  const tempDir = process.env.CHALAN_PDF_DIR || path.join(os.tmpdir(), "challans");
  await ensureDirectory(tempDir);

  const filename = `${invoiceData.invoiceNumber || `invoice-${Date.now()}`}.pdf`;
  const filePath = path.join(tempDir, filename);

  const doc = new PDFDocument({ size: "A4", margin: 40 });
  const writeStream = fs.createWriteStream(filePath);
  doc.pipe(writeStream);

  // Add header with image
  await addHeader(doc);

  // Add buyer/invoice section
  addBuyerInvoiceSection(doc, invoiceData);

  // Add main table
  const tableInfo = addTable(doc, invoiceData.items || [], doc.y + 10);

  // Add amount section
  addAmountSection(doc, tableInfo.netAmount, tableInfo.startX, tableInfo.tableWidth);

  // Add footer
  addFooter(doc, invoiceData);

  doc.end();

  await new Promise((resolve, reject) => {
    writeStream.on("finish", resolve);
    writeStream.on("error", reject);
  });

  return filePath;
};

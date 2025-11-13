import Challan from "../models/CEmodel.js";
import { generateChallanPdf } from "../utils/challanPdfGenerator.js";
import fs from "fs";

// Helper function to generate next invoice number
const getNextInvoiceNumber = async () => {
  try {
    const lastChallan = await Challan.findOne({ status: "completed" })
      .sort({ invoiceNumber: -1 })
      .select("invoiceNumber");

    if (!lastChallan || !lastChallan.invoiceNumber) {
      return "000001";
    }

    // Extract number from invoice number (handle formats like INV-000001, 000001, etc.)
    const lastNumber = parseInt(lastChallan.invoiceNumber.replace(/\D/g, "")) || 0;
    const nextNumber = lastNumber + 1;
    
    // Format as 6-digit string with leading zeros
    return String(nextNumber).padStart(6, "0");
  } catch (error) {
    console.error("Error generating invoice number:", error);
    // Fallback: use timestamp-based number
    return String(Date.now()).slice(-6).padStart(6, "0");
  }
};

// Create a new challan (draft or completed)
export const createChallan = async (req, res) => {
  try {
    const {
      date,
      buyer,
      buyerGstin,
      note1,
      note2,
      note3,
      note4,
      items,
      status = "draft",
    } = req.body;

    // Validate required fields
    if (!date || !buyer || !items || items.length === 0) {
      return res.status(400).json({
        error: "Missing required fields: date, buyer, and items are required",
      });
    }

    // Generate invoice number only for completed challans
    let invoiceNumber;
    if (status === "completed") {
      invoiceNumber = await getNextInvoiceNumber();
    } else {
      // For drafts, use a temporary number that will be updated when completed
      invoiceNumber = `DRAFT-${Date.now()}`;
    }

    const challan = new Challan({
      invoiceNumber,
      date,
      buyer,
      buyerGstin: buyerGstin || "",
      note1: note1 || "",
      note2: note2 || "",
      note3: note3 || "",
      note4: note4 || "",
      items,
      status,
    });

    const savedChallan = await challan.save();

    res.status(201).json({
      success: true,
      message: `Challan ${status === "draft" ? "saved as draft" : "created"} successfully`,
      data: savedChallan,
    });
  } catch (error) {
    console.error("Error creating challan:", error);
    res.status(500).json({
      error: "Failed to create challan",
      message: error.message,
    });
  }
};

// Get all challans with optional filters
export const getAllChallans = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    const query = {};
    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const challans = await Challan.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Challan.countDocuments(query);

    res.status(200).json({
      success: true,
      data: challans,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching challans:", error);
    res.status(500).json({
      error: "Failed to fetch challans",
      message: error.message,
    });
  }
};

// Get a single challan by ID
export const getChallanById = async (req, res) => {
  try {
    const { id } = req.params;

    const challan = await Challan.findById(id);

    if (!challan) {
      return res.status(404).json({
        error: "Challan not found",
      });
    }

    res.status(200).json({
      success: true,
      data: challan,
    });
  } catch (error) {
    console.error("Error fetching challan:", error);
    res.status(500).json({
      error: "Failed to fetch challan",
      message: error.message,
    });
  }
};

// Update a challan
export const updateChallan = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      date,
      buyer,
      buyerGstin,
      note1,
      note2,
      note3,
      note4,
      items,
      status,
    } = req.body;

    const challan = await Challan.findById(id);

    if (!challan) {
      return res.status(404).json({
        error: "Challan not found",
      });
    }

    // If updating from draft to completed, generate invoice number
    if (status === "completed" && challan.status === "draft") {
      const invoiceNumber = await getNextInvoiceNumber();
      challan.invoiceNumber = invoiceNumber;
    }

    // Update fields
    if (date) challan.date = date;
    if (buyer) challan.buyer = buyer;
    if (buyerGstin !== undefined) challan.buyerGstin = buyerGstin;
    if (note1 !== undefined) challan.note1 = note1;
    if (note2 !== undefined) challan.note2 = note2;
    if (note3 !== undefined) challan.note3 = note3;
    if (note4 !== undefined) challan.note4 = note4;
    if (items) challan.items = items;
    if (status) challan.status = status;

    challan.updatedAt = new Date();

    const updatedChallan = await challan.save();

    res.status(200).json({
      success: true,
      message: "Challan updated successfully",
      data: updatedChallan,
    });
  } catch (error) {
    console.error("Error updating challan:", error);
    res.status(500).json({
      error: "Failed to update challan",
      message: error.message,
    });
  }
};

// Save challan as draft (save for later)
export const saveDraft = async (req, res) => {
  try {
    const {
      date,
      buyer,
      buyerGstin,
      note1,
      note2,
      note3,
      note4,
      items,
    } = req.body;

    // For drafts, all fields are optional
    const challanData = {
      status: "draft",
      date: date || new Date().toLocaleDateString("en-IN"),
      buyer: buyer || "",
      buyerGstin: buyerGstin || "",
      note1: note1 || "",
      note2: note2 || "",
      note3: note3 || "",
      note4: note4 || "",
      items: items || [],
    };

    // Use temporary invoice number for drafts
    if (!req.body._id) {
      // Creating new draft
      challanData.invoiceNumber = `DRAFT-${Date.now()}`;
      const challan = new Challan(challanData);
      const savedChallan = await challan.save();

      return res.status(201).json({
        success: true,
        message: "Draft saved successfully",
        data: savedChallan,
      });
    } else {
      // Updating existing draft
      const challan = await Challan.findById(req.body._id);
      if (!challan) {
        return res.status(404).json({
          error: "Challan not found",
        });
      }

      Object.assign(challan, challanData);
      challan.updatedAt = new Date();
      const updatedChallan = await challan.save();

      return res.status(200).json({
        success: true,
        message: "Draft updated successfully",
        data: updatedChallan,
      });
    }
  } catch (error) {
    console.error("Error saving draft:", error);
    res.status(500).json({
      error: "Failed to save draft",
      message: error.message,
    });
  }
};

// Save and download PDF
export const saveAndDownload = async (req, res) => {
  try {
    const {
      date,
      buyer,
      buyerGstin,
      note1,
      note2,
      note3,
      note4,
      items,
      _id, // Optional: if updating existing draft
    } = req.body;

    // Validate required fields
    if (!date || !buyer || !items || items.length === 0) {
      return res.status(400).json({
        error: "Missing required fields: date, buyer, and items are required",
      });
    }

    let challan;

    if (_id) {
      // Updating existing challan (likely a draft)
      challan = await Challan.findById(_id);
      if (!challan) {
        return res.status(404).json({
          error: "Challan not found",
        });
      }

      // If it was a draft, generate invoice number
      if (challan.status === "draft") {
        challan.invoiceNumber = await getNextInvoiceNumber();
      }

      // Update fields
      challan.date = date;
      challan.buyer = buyer;
      challan.buyerGstin = buyerGstin || "";
      challan.note1 = note1 || "";
      challan.note2 = note2 || "";
      challan.note3 = note3 || "";
      challan.note4 = note4 || "";
      challan.items = items;
      challan.status = "completed";
      challan.updatedAt = new Date();

      challan = await challan.save();
    } else {
      // Creating new challan
      const invoiceNumber = await getNextInvoiceNumber();
      challan = new Challan({
        invoiceNumber,
        date,
        buyer,
        buyerGstin: buyerGstin || "",
        note1: note1 || "",
        note2: note2 || "",
        note3: note3 || "",
        note4: note4 || "",
        items,
        status: "completed",
      });

      challan = await challan.save();
    }

    // Generate PDF
    const invoiceData = {
      invoiceNumber: challan.invoiceNumber,
      date: challan.date,
      buyer: challan.buyer,
      buyerGstin: challan.buyerGstin,
      note1: challan.note1,
      note2: challan.note2,
      note3: challan.note3,
      note4: challan.note4,
      items: challan.items,
    };

    const pdfPath = await generateChallanPdf(invoiceData, true);

    // Send PDF as download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="invoice-${challan.invoiceNumber}.pdf"`
    );

    // Stream the PDF file
    const fileStream = fs.createReadStream(pdfPath);
    fileStream.pipe(res);

    // Clean up: delete file after sending
    fileStream.on("end", () => {
      fs.unlink(pdfPath, (err) => {
        if (err) console.error("Error deleting temp PDF:", err);
      });
    });
  } catch (error) {
    console.error("Error saving and downloading challan:", error);
    res.status(500).json({
      error: "Failed to save and download challan",
      message: error.message,
    });
  }
};

// Generate and download PDF for existing invoice
export const generatePdfForInvoice = async (req, res) => {
  try {
    const { id } = req.params;

    const challan = await Challan.findById(id);

    if (!challan) {
      return res.status(404).json({
        error: "Challan not found",
      });
    }

    if (challan.status !== "completed") {
      return res.status(400).json({
        error: "Can only download PDF for completed invoices",
      });
    }

    const invoiceData = {
      invoiceNumber: challan.invoiceNumber,
      date: challan.date,
      buyer: challan.buyer,
      buyerGstin: challan.buyerGstin,
      note1: challan.note1,
      note2: challan.note2,
      note3: challan.note3,
      note4: challan.note4,
      items: challan.items,
    };

    const pdfPath = await generateChallanPdf(invoiceData, true);

    // Send PDF as download with invoice number as filename
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="invoice-${challan.invoiceNumber}.pdf"`
    );

    // Stream the PDF file
    const fileStream = fs.createReadStream(pdfPath);
    fileStream.pipe(res);

    // Clean up: delete file after sending
    fileStream.on("end", () => {
      fs.unlink(pdfPath, (err) => {
        if (err) console.error("Error deleting temp PDF:", err);
      });
    });
  } catch (error) {
    console.error("Error generating PDF:", error);
    res.status(500).json({
      error: "Failed to generate PDF",
      message: error.message,
    });
  }
};

// Delete a challan
export const deleteChallan = async (req, res) => {
  try {
    const { id } = req.params;

    const challan = await Challan.findByIdAndDelete(id);

    if (!challan) {
      return res.status(404).json({
        error: "Challan not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Challan deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting challan:", error);
    res.status(500).json({
      error: "Failed to delete challan",
      message: error.message,
    });
  }
};


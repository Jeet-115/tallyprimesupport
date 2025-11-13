import express from "express";
import {
  createChallan,
  getAllChallans,
  getChallanById,
  updateChallan,
  saveDraft,
  saveAndDownload,
  generatePdfForInvoice,
  deleteChallan,
} from "../controllers/CEcontroller.js";

const router = express.Router();

// Create a new challan
router.post("/", createChallan);

// Get all challans (with optional query params: status, page, limit)
router.get("/", getAllChallans);

// Generate PDF for existing invoice (must be before /:id route)
router.get("/generate-pdf/:id", generatePdfForInvoice);

// Get a single challan by ID
router.get("/:id", getChallanById);

// Update a challan
router.put("/:id", updateChallan);

// Save as draft (save for later)
router.post("/draft", saveDraft);

// Save and download PDF
router.post("/save-download", saveAndDownload);

// Delete a challan
router.delete("/:id", deleteChallan);

export default router;


import mongoose from "mongoose";

const itemSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true,
  },
  sizeHeight: {
    type: String,
    default: "",
  },
  sizeWidth: {
    type: String,
    default: "",
  },
  nos: {
    type: String,
    default: "",
  },
  quantity: {
    type: Number,
    required: true,
    min: 0,
  },
  rate: {
    type: Number,
    required: true,
    min: 0,
  },
  per: {
    type: String,
    default: "PCS",
  },
});

const challanSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      unique: true,
      required: true,
    },
    date: {
      type: String,
      required: true,
    },
    buyer: {
      type: String,
      required: true,
    },
    buyerGstin: {
      type: String,
      default: "",
    },
    note1: {
      type: String,
      default: "",
    },
    note2: {
      type: String,
      default: "",
    },
    note3: {
      type: String,
      default: "",
    },
    note4: {
      type: String,
      default: "",
    },
    items: {
      type: [itemSchema],
      required: true,
      default: [],
    },
    status: {
      type: String,
      enum: ["draft", "completed"],
      default: "draft",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
challanSchema.index({ invoiceNumber: 1 });
challanSchema.index({ status: 1 });
challanSchema.index({ createdAt: -1 });

const Challan = mongoose.model("Challan", challanSchema);

export default Challan;


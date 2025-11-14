import mongoose from "mongoose";

const monthlyReportSchema = new mongoose.Schema(
  {
    year: {
      type: Number,
      required: true,
    },
    month: {
      type: Number,
      required: true,
    },
    filename: {
      type: String,
      required: true,
      unique: true,
    },
    data: {
      type: Buffer,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    invoicesCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

monthlyReportSchema.index({ year: -1, month: -1 });
monthlyReportSchema.index({ filename: 1 }, { unique: true });

const MonthlyReport = mongoose.model("MonthlyReport", monthlyReportSchema);

export default MonthlyReport;


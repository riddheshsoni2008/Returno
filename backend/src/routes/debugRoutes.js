import express from "express";
import { getEmailDiagnostics } from "../services/emailService.js";

const router = express.Router();

// ==========================================
// GET /api/debug/email — Email service diagnostic endpoint
// ==========================================

router.get("/email", async (req, res) => {
  try {
    const diagnostics = await getEmailDiagnostics();
    return res.json({
      success: true,
      diagnostics,
    });
  } catch (error) {
    console.error("[Debug Email] Failed to run diagnostics:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to run email diagnostics.",
      details: error.message,
    });
  }
});

export default router;

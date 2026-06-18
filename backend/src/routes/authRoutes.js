import express from "express";
import {
  sendOtp,
  verifyOtp,
  sendBusinessOtp,
  verifyBusinessOtp,
  me,
  logout,
} from "../controllers/authController.js";

const router = express.Router();

// Customer Auth Routes
router.post("/otp/send", sendOtp);
router.post("/otp/verify", verifyOtp);

// Business Auth Routes
router.post("/business/otp/send", sendBusinessOtp);
router.post("/business/otp/verify", verifyBusinessOtp);

// Session Management
router.get("/me", me);
router.post("/me", logout);

export default router;

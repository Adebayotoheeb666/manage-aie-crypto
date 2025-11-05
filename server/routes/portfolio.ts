import { Router, Request, Response } from "express";
import { supabase } from "../lib/supabase";
import { authMiddleware } from "../middleware/auth";

const router = Router();

// Get portfolio history
router.get("/history", authMiddleware, async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const { days = 30 } = req.query;

    // In a real implementation, you would query historical portfolio data
    // For now, we'll generate mock data
    const history = [];
    const today = new Date();
    const baseValue = 10000; // Starting portfolio value

    for (let i = parseInt(days as string); i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      // Generate a somewhat realistic looking portfolio value
      const dailyChange = Math.random() * 0.04 - 0.02; // -2% to +2% daily change
      const prevValue =
        history.length > 0 ? history[history.length - 1].value : baseValue;
      const value = prevValue * (1 + dailyChange);

      history.push({
        timestamp: date.toISOString().split("T")[0],
        value: parseFloat(value.toFixed(2)),
      });
    }

    res.json({
      success: true,
      history,
    });
  } catch (error) {
    console.error("Error fetching portfolio history:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch portfolio history",
      details: error.message,
    });
  }
});

export default router;

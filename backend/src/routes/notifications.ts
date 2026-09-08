import { Router, Response } from "express";
import { supabaseAdmin } from "../config/supabase";
import { authenticate } from "../middleware/auth";
import { AuthRequest } from "../types";

const router = Router();

// ─── GET /api/notifications ──────────────────────────────────────────────────
// Get user's notifications (paginated)

router.get("/", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.sub;
    const { limit = "20", offset = "0", unread_only } = req.query;

    let query = supabaseAdmin
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(
        parseInt(offset as string),
        parseInt(offset as string) + parseInt(limit as string) - 1
      );

    if (unread_only === "true") {
      query = query.eq("read", false);
    }

    const { data, error } = await query;

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    // Also get unread count
    const { count } = await supabaseAdmin
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("read", false);

    res.json({
      notifications: data || [],
      unread_count: count || 0,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

// ─── PUT /api/notifications/:id/read ─────────────────────────────────────────
// Mark a notification as read

router.put("/:id/read", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const userId = req.user!.sub;

    const { error } = await supabaseAdmin
      .from("notifications")
      .update({ read: true })
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json({ message: "Notification marked as read" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update notification" });
  }
});

// ─── PUT /api/notifications/read-all ─────────────────────────────────────────
// Mark all notifications as read

router.put("/read-all", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.sub;

    const { error } = await supabaseAdmin
      .from("notifications")
      .update({ read: true })
      .eq("user_id", userId)
      .eq("read", false);

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update notifications" });
  }
});

export default router;

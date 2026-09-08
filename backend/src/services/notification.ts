import { supabaseAdmin } from "../config/supabase";
import { Notification, NotificationType } from "../types";
import { getIO } from "./socket";

/**
 * Notification service — creates in-app notifications and pushes them
 * in real-time via Socket.io.
 *
 * Email notifications are stubbed — integrate with Resend when ready.
 */

/**
 * Send a notification to a single user.
 */
export async function sendNotification(params: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  tournamentId?: string;
  matchId?: string;
}): Promise<Notification | null> {
  const { data, error } = await supabaseAdmin
    .from("notifications")
    .insert({
      user_id: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      tournament_id: params.tournamentId || null,
      match_id: params.matchId || null,
    })
    .select()
    .single();

  if (error) {
    console.error("Failed to create notification:", error.message);
    return null;
  }

  // Push via Socket.io in real-time
  try {
    const io = getIO();
    io.to(`user:${params.userId}`).emit("notification:new", data as Notification);
  } catch {
    // Socket.io not initialized yet — notification saved to DB anyway
  }

  // TODO: Email notification via Resend
  // await sendEmailNotification(params.userId, params.title, params.message);

  return data as Notification;
}

/**
 * Send notifications to multiple users at once.
 */
export async function sendBulkNotifications(
  userIds: string[],
  params: {
    type: NotificationType;
    title: string;
    message: string;
    tournamentId?: string;
    matchId?: string;
  }
): Promise<void> {
  const notifications = userIds.map((userId) => ({
    user_id: userId,
    type: params.type,
    title: params.title,
    message: params.message,
    tournament_id: params.tournamentId || null,
    match_id: params.matchId || null,
  }));

  const { error } = await supabaseAdmin
    .from("notifications")
    .insert(notifications);

  if (error) {
    console.error("Failed to create bulk notifications:", error.message);
    return;
  }

  // Push each notification via Socket.io
  try {
    const io = getIO();
    for (const userId of userIds) {
      const notification = notifications.find((n) => n.user_id === userId);
      if (notification) {
        io.to(`user:${userId}`).emit("notification:new", notification as unknown as Notification);
      }
    }
  } catch {
    // Socket.io not initialized
  }
}

/**
 * Notify all participants in a tournament.
 */
export async function notifyTournamentParticipants(
  tournamentId: string,
  params: {
    type: NotificationType;
    title: string;
    message: string;
    excludeUserId?: string; // Don't notify the sender
  }
): Promise<void> {
  const { data: participants } = await supabaseAdmin
    .from("tournament_participants")
    .select("user_id")
    .eq("tournament_id", tournamentId);

  if (!participants) return;

  const userIds = participants
    .map((p) => p.user_id)
    .filter((id) => id !== params.excludeUserId);

  await sendBulkNotifications(userIds, {
    ...params,
    tournamentId,
  });
}

/**
 * Stub: Send email notification via Resend.
 * Implement this when you have a Resend API key.
 */
// async function sendEmailNotification(
//   userId: string,
//   subject: string,
//   body: string
// ): Promise<void> {
//   // Get user email from profiles/auth
//   // const { data: user } = await supabaseAdmin.auth.admin.getUserById(userId);
//   // if (!user?.user?.email) return;
//   //
//   // await resend.emails.send({
//   //   from: 'eFootball Tournaments <noreply@yourdomain.com>',
//   //   to: user.user.email,
//   //   subject,
//   //   text: body,
//   // });
// }

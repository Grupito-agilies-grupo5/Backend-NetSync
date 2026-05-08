// ============================================
// NetSync Backend - Metrics Service
// ============================================

import { db } from '../database';
import { Metrics } from '../models/types';

export function getMetrics(): Metrics {
  const rooms = db.getAllRooms();
  const ratings = db.getAllRatings();
  const reactions = db.getAllReactions();

  // Total and active rooms
  const totalRooms = rooms.length;
  const activeRooms = rooms.filter((r) => r.status !== 'ended').length;

  // Total unique users (from ratings + room users count)
  const allUsers = new Set<string>();
  ratings.forEach((r) => allUsers.add(r.userName));
  rooms.forEach((r) => allUsers.add(r.hostName));
  const totalUsers = Math.max(allUsers.size, rooms.length);

  // Average rating
  const totalRatingsCount = ratings.length;
  const averageRating = totalRatingsCount > 0
    ? Math.round((ratings.reduce((sum, r) => sum + r.score, 0) / totalRatingsCount) * 10) / 10
    : 0;

  // Most used content
  const contentCount = new Map<string, number>();
  rooms.forEach((r) => {
    contentCount.set(r.contentTitle, (contentCount.get(r.contentTitle) || 0) + 1);
  });
  const mostUsedContent = Array.from(contentCount.entries())
    .map(([title, count]) => ({ title, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Reaction counts
  const reactionCountMap = new Map<string, number>();
  reactions.forEach((r) => {
    reactionCountMap.set(r.type, (reactionCountMap.get(r.type) || 0) + 1);
  });
  const reactionCounts = Array.from(reactionCountMap.entries())
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);

  // Average session time (simulated based on room creation/end times)
  let totalSessionMinutes = 0;
  let sessionCount = 0;
  rooms.forEach((r) => {
    if (r.endedAt) {
      const start = new Date(r.createdAt).getTime();
      const end = new Date(r.endedAt).getTime();
      totalSessionMinutes += (end - start) / 60000;
      sessionCount++;
    }
  });
  const averageSessionMinutes = sessionCount > 0
    ? Math.round((totalSessionMinutes / sessionCount) * 10) / 10
    : 0;

  return {
    totalRooms,
    activeRooms,
    totalUsers,
    averageRating,
    totalRatings: totalRatingsCount,
    mostUsedContent,
    reactionCounts,
    averageSessionMinutes,
  };
}

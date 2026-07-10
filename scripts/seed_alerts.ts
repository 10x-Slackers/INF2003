/**
 * Seed saved alerts (MongoDB) and alert notifications (MariaDB) for admin@example.com.
 *
 * Usage: npx tsx --env-file=.env.local scripts/seed_alerts.ts
 *
 * Requires the app env vars (MARIADB_*, MONGO_*) and existing transactions in the DB.
 */

import { db, query } from "@/lib/db";
import { now } from "@/lib/utils";
import { randomUUID } from "node:crypto";

type SavedAlert = {
  _id: string;
  userId: string;
  filters: Record<string, unknown>;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
};

async function main() {
  // 1. Get admin user
  const [admin] = await query<{ id: string }>(
    "SELECT id FROM users WHERE email = 'admin@example.com' LIMIT 1",
  );
  if (!admin)
    throw new Error("admin@example.com not found. Run pnpm seed:users first.");
  const userId = admin.id;
  console.log(`Admin user: ${userId}`);

  // 2. Get some transactions
  const transactions = await query<{ id: string }>(
    "SELECT id FROM resale_transactions ORDER BY transaction_month DESC LIMIT 10",
  );
  if (transactions.length < 3) {
    throw new Error(
      `Need at least 3 transactions to seed notifications, found ${transactions.length}. Run the ETL pipeline first.`,
    );
  }
  console.log(`Found ${transactions.length} transactions`);

  // 3. Get town IDs for realistic filters
  const towns = await query<{ id: string }>("SELECT id FROM towns LIMIT 5");
  const townIds = towns.map((t) => t.id);

  // 4. Insert saved alerts into MongoDB
  const alertsCollection = db.collection<SavedAlert>("alerts");
  const alertDocs: SavedAlert[] = [
    {
      _id: randomUUID(),
      userId,
      filters: {
        price: { min: 300000, max: 600000 },
        floorAreaSqm: { min: 80 },
      },
      isActive: true,
      createdAt: now() - 86400 * 7,
      updatedAt: now() - 86400 * 7,
    },
    {
      _id: randomUUID(),
      userId,
      filters: {
        townId: townIds.slice(0, 2),
        price: { min: 400000, max: 800000 },
        storey: { min: 5, max: 15 },
      },
      isActive: true,
      createdAt: now() - 86400 * 3,
      updatedAt: now() - 86400 * 3,
    },
    {
      _id: randomUUID(),
      userId,
      filters: {
        price: { min: 500000 },
        leaseRemaining: { min: 60 },
      },
      isActive: false,
      createdAt: now() - 86400 * 14,
      updatedAt: now() - 86400 * 14,
    },
  ];

  // Clear existing alerts for this user, then insert
  await alertsCollection.deleteMany({ userId });
  await alertsCollection.insertMany(alertDocs);
  console.log(`Seeded ${alertDocs.length} saved alerts`);

  // 5. Insert alert notifications into MariaDB
  // Clear existing notifications for this user
  await query("DELETE FROM alert_notifications WHERE user_id = ?", [userId]);

  const notifications = [
    {
      alert_uuid: alertDocs[0]._id,
      transaction_id: transactions[0].id,
      read_at: null,
    },
    {
      alert_uuid: alertDocs[0]._id,
      transaction_id: transactions[1].id,
      read_at: null,
    },
    {
      alert_uuid: alertDocs[1]._id,
      transaction_id: transactions[2].id,
      read_at: null,
    },
    {
      alert_uuid: alertDocs[1]._id,
      transaction_id: transactions[3].id,
      read_at: new Date().toISOString().slice(0, 19).replace("T", " "),
    },
    {
      alert_uuid: alertDocs[2]._id,
      transaction_id: transactions[4].id,
      read_at: null,
    },
  ];

  const values = notifications.map(() => "(?, ?, ?)").join(", ");
  const params = notifications.flatMap((n) => [
    userId,
    n.alert_uuid,
    n.transaction_id,
  ]);

  await query(
    `INSERT INTO alert_notifications (user_id, alert_uuid, transaction_id) VALUES ${values}`,
    params,
  );

  // Mark the 4th notification as read
  if (notifications[3].read_at) {
    await query(
      `UPDATE alert_notifications SET read_at = ? WHERE user_id = ? AND alert_uuid = ? AND transaction_id = ?`,
      [
        notifications[3].read_at,
        userId,
        notifications[3].alert_uuid,
        notifications[3].transaction_id,
      ],
    );
  }

  console.log(`Seeded ${notifications.length} alert notifications`);
  console.log("Done!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});

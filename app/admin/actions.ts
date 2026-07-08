"use server";

import { assertAdmin, hashPassword } from "@/lib/auth";
import { bulkUpdateTownProfileTransactionsLast6Months } from "@/lib/collections/town-profile";
import { flushStatisticsTrigger } from "@/lib/collections/statistics-trigger";
import { saveStats } from "@/lib/collections/statistics";
import {
  buildAllPropertyStats,
  buildAllTownStats,
  buildGlobalStats,
  buildTownCountUpdates,
} from "@/lib/services/statistics";
import { listTowns } from "@/lib/tables/towns";
import {
  createUser,
  deleteUser,
  listUsers,
  updateUser,
  type PublicUser,
  type UserRole,
} from "@/lib/tables/users";

export async function fetchUsers(input: {
  page: number;
  pageSize: number;
  search?: string;
}): Promise<{ data: PublicUser[]; total: number }> {
  await assertAdmin();
  return listUsers(input);
}

export async function createUserAction(input: {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
}): Promise<void> {
  await assertAdmin();
  const password_hash = await hashPassword(input.password);
  await createUser({
    name: input.name,
    email: input.email,
    password_hash,
    role: input.role,
  });
}

export async function updateUserAction(input: {
  id: string;
  name?: string;
  email?: string;
  role?: UserRole;
}): Promise<void> {
  await assertAdmin();
  await updateUser({
    id: input.id,
    input: { name: input.name, email: input.email, role: input.role },
  });
}

export async function deleteUserAction(id: string): Promise<void> {
  await assertAdmin();
  await deleteUser(id);
}

export async function generateStatsAction(): Promise<{
  statistics: number;
  towns: number;
}> {
  await assertAdmin();
  try {
    const townIds = (await listTowns()).map((town) => town.id);
    const [globalStats, townStats, townUpdates] = await Promise.all([
      buildGlobalStats(),
      buildAllTownStats(),
      buildTownCountUpdates(townIds),
    ]);
    const stats = [...globalStats, ...townStats];

    await saveStats(stats);
    await bulkUpdateTownProfileTransactionsLast6Months(townUpdates);
    await flushStatisticsTrigger();

    return { statistics: stats.length, towns: townIds.length };
  } catch (error) {
    console.log("Error generating stats:", error);
    return { statistics: 0, towns: 0 };
  }
}

export async function generatePropertyStatsAction(): Promise<{
  statistics: number;
  properties: number;
}> {
  await assertAdmin();
  try {
    const stats = await buildAllPropertyStats();
    const propertyIds = new Set<string>();

    for (const stat of stats) {
      if (stat.dimensions.propertyId)
        propertyIds.add(stat.dimensions.propertyId);
    }

    await saveStats(stats);

    return { statistics: stats.length, properties: propertyIds.size };
  } catch (error) {
    console.log("Error generating property stats:", error);
    return { statistics: 0, properties: 0 };
  }
}

import { db } from "@/lib/db/mongodb";
import { idSchema } from "@/lib/schema/mongodb-common";
import {
  upsertTownProfileSchema,
  TownProfile,
} from "@/lib/schema/town-profile";

const towns = db.collection<TownProfile>("towns");

const now = () => Math.floor(Date.now() / 1000);

export async function listTownProfiles(): Promise<TownProfile[]> {
  return towns.find({}).sort({ _id: 1 }).toArray();
}

export async function getTownProfileById(
  id: string,
): Promise<TownProfile | null> {
  return towns.findOne({ _id: idSchema.parse(id) });
}

export async function upsertTownProfile(
  input: TownProfile,
): Promise<TownProfile> {
  // updates the town profile if it exists, otherwise inserts a new one
  const data = upsertTownProfileSchema.parse(input);
  const townProfile: TownProfile = { ...data, updated_at: now() };

  await towns.updateOne(
    { _id: townProfile._id },
    { $set: townProfile },
    { upsert: true },
  );
  return townProfile;
}

export async function deleteTownProfile(id: string): Promise<boolean> {
  const result = await towns.deleteOne({ _id: idSchema.parse(id) });
  return result.deletedCount > 0;
}

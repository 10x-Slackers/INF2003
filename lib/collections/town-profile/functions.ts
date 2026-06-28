import { db } from "@/lib/db";
import { handleDbError, type DbResult } from "@/lib/utils";
import {
  idSchema,
  type TownProfile,
  type TownProfileUpsert,
  UpsertTownProfileSchema,
} from "./types";

const towns = db.collection<TownProfile>("towns");
const now = () => Math.floor(Date.now() / 1000);

export async function listTownProfiles(): Promise<DbResult<TownProfile[]>> {
  try {
    return await towns.find({}).sort({ _id: 1 }).toArray();
  } catch (error) {
    return handleDbError(error);
  }
}

export async function getTownProfileById(
  id: string,
): Promise<DbResult<TownProfile | null>> {
  try {
    return await towns.findOne({ _id: idSchema.parse(id) });
  } catch (error) {
    return handleDbError(error);
  }
}

export async function upsertTownProfile(
  input: TownProfileUpsert,
): Promise<DbResult<TownProfile>> {
  try {
    const data = UpsertTownProfileSchema.parse(input);
    const townProfile: TownProfile = { ...data, updated_at: now() };

    await towns.updateOne(
      { _id: townProfile._id },
      {
        $set: {
          transaction_summary: townProfile.transaction_summary,
          coordinates: townProfile.coordinates,
          updated_at: townProfile.updated_at,
        },
      },
      { upsert: true },
    );
    return townProfile;
  } catch (error) {
    return handleDbError(error);
  }
}

export async function deleteTownProfile(
  id: string,
): Promise<DbResult<boolean>> {
  try {
    const result = await towns.deleteOne({ _id: idSchema.parse(id) });
    return result.deletedCount > 0;
  } catch (error) {
    return handleDbError(error);
  }
}

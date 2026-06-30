import { db } from "@/lib/db";
import {
  idSchema,
  UpsertTownProfileSchema,
  type TownProfile,
  type TownProfileUpsert,
} from "./types";
import { handleDbError, now } from "@/lib/utils";

const towns = db.collection<TownProfile>("towns");

export async function listTownProfiles(): Promise<TownProfile[]> {
  try {
    return await towns.find({}).toArray();
  } catch (error) {
    return handleDbError(error);
  }
}

export async function getTownProfileById(
  id: string,
): Promise<TownProfile | null> {
  try {
    return await towns.findOne({ _id: idSchema.parse(id) });
  } catch (error) {
    return handleDbError(error);
  }
}

// checks if document exist, if it does, update it, if not, create a new one
export async function upsertTownProfile(
  input: TownProfileUpsert,
): Promise<TownProfile> {
  try {
    const data = UpsertTownProfileSchema.parse(input);
    const townProfile: TownProfile = { ...data, updatedAt: now() };

    await towns.updateOne(
      { _id: townProfile._id },
      {
        $set: {
          transactionSummary: townProfile.transactionSummary,
          coordinates: townProfile.coordinates,
          updatedAt: townProfile.updatedAt,
        },
      },
      { upsert: true },
    );
    return townProfile;
  } catch (error) {
    return handleDbError(error);
  }
}

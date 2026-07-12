import { z } from "zod";

export const regionSchema = z.enum([
  "NORTH REGION",
  "NORTH-EAST REGION",
  "EAST REGION",
  "WEST REGION",
  "CENTRAL REGION",
]);

type Region = z.infer<typeof regionSchema>;

export type Town = {
  id: string;
  region: Region;
  name: string;
};

export type TownAmenity = {
  id: string;
  town_id: string;
  amenity_type_id: number;
  name: string;
  street_name: string | null;
  postal_code: string | null;
  longitude: number | null;
  latitude: number | null;
  amenity_type_name: string;
};

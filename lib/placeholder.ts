export const flatTypes = [
  { id: "1", name: "3 Room" },
  { id: "2", name: "4 Room" },
  { id: "3", name: "5 Room" },
] as const;

export const flatModels = [
  { id: "1", name: "Improved" },
  { id: "2", name: "Model A" },
  { id: "3", name: "Premium Apartment" },
] as const;

export type propertyType = {
  id: string;
  townId: string;
  town: string;
  flatTypeId: string;
  flatType: string;
  flatModelId: string;
  flatModel: string;
  block: string;
  streetName: string;
  leaseCommenceYear: number;
  resalePrice: number;
};

export const properties = [
  {
    id: "01979e02-7400-7000-8000-000000000101",
    townId: "01979e02-7400-7000-9000-000000000001",
    town: "Ang Mo Kio",
    flatTypeId: "1",
    flatType: "3 Room",
    flatModelId: "1",
    flatModel: "Improved",
    block: "123",
    streetName: "Ang Mo Kio Avenue 3",
    leaseCommenceYear: 1980,
    resalePrice: 385000,
  },
  {
    id: "01979e02-7400-7000-8000-000000000102",
    townId: "01979e02-7400-7000-9000-000000000002",
    town: "Bishan",
    flatTypeId: "2",
    flatType: "4 Room",
    flatModelId: "2",
    flatModel: "Model A",
    block: "245",
    streetName: "Bishan Street 22",
    leaseCommenceYear: 1992,
    resalePrice: 620000,
  },
  {
    id: "01979e02-7400-7000-8000-000000000103",
    townId: "01979e02-7400-7000-9000-000000000003",
    town: "Tampines",
    flatTypeId: "3",
    flatType: "5 Room",
    flatModelId: "3",
    flatModel: "Premium Apartment",
    block: "876",
    streetName: "Tampines Street 84",
    leaseCommenceYear: 1988,
    resalePrice: 745000,
  },
  {
    id: "01979e02-7400-7000-8000-000000000104",
    townId: "01979e02-7400-7000-9000-000000000001",
    town: "Ang Mo Kio",
    flatTypeId: "2",
    flatType: "4 Room",
    flatModelId: "1",
    flatModel: "Improved",
    block: "321",
    streetName: "Ang Mo Kio Avenue 10",
    leaseCommenceYear: 1985,
    resalePrice: 560000,
  },
  {
    id: "01979e02-7400-7000-8000-000000000105",
    townId: "01979e02-7400-7000-9000-000000000003",
    town: "Tampines",
    flatTypeId: "1",
    flatType: "3 Room",
    flatModelId: "2",
    flatModel: "Model A",
    block: "492",
    streetName: "Tampines Avenue 9",
    leaseCommenceYear: 1995,
    resalePrice: 430000,
  },
] satisfies Array<{
  id: string;
  townId: string;
  town: string;
  flatTypeId: string;
  flatType: string;
  flatModelId: string;
  flatModel: string;
  block: string;
  streetName: string;
  leaseCommenceYear: number;
  resalePrice: number;
}>;

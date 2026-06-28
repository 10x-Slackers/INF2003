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

export type resaleTransactionType = {
  id: string;
  propertyId: string;
  flatTypeId: string;
  flatType: string;
  flatModelId: string;
  flatModel: string;
  storeyRangeId: string;
  storeyRange: string;
  floorAreaSqm: number;
  transactionMonth: string;
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

export const resaleTransactions = [
  {
    id: "01979e02-7400-7000-a000-000000000101",
    propertyId: "01979e02-7400-7000-8000-000000000101",
    flatTypeId: "1",
    flatType: "3 Room",
    flatModelId: "1",
    flatModel: "Improved",
    storeyRangeId: "1",
    storeyRange: "04 To 06",
    floorAreaSqm: 67,
    transactionMonth: "2025-11-01",
    resalePrice: 385000,
  },
  {
    id: "01979e02-7400-7000-a000-000000000102",
    propertyId: "01979e02-7400-7000-8000-000000000101",
    flatTypeId: "1",
    flatType: "3 Room",
    flatModelId: "1",
    flatModel: "Improved",
    storeyRangeId: "2",
    storeyRange: "07 To 09",
    floorAreaSqm: 67,
    transactionMonth: "2024-08-01",
    resalePrice: 360000,
  },
  {
    id: "01979e02-7400-7000-a000-000000000108",
    propertyId: "01979e02-7400-7000-8000-000000000101",
    flatTypeId: "1",
    flatType: "3 Room",
    flatModelId: "1",
    flatModel: "Improved",
    storeyRangeId: "1",
    storeyRange: "04 To 06",
    floorAreaSqm: 67,
    transactionMonth: "2023-03-01",
    resalePrice: 342000,
  },
  {
    id: "01979e02-7400-7000-a000-000000000103",
    propertyId: "01979e02-7400-7000-8000-000000000102",
    flatTypeId: "2",
    flatType: "4 Room",
    flatModelId: "2",
    flatModel: "Model A",
    storeyRangeId: "3",
    storeyRange: "10 To 12",
    floorAreaSqm: 93,
    transactionMonth: "2025-09-01",
    resalePrice: 620000,
  },
  {
    id: "01979e02-7400-7000-a000-000000000104",
    propertyId: "01979e02-7400-7000-8000-000000000102",
    flatTypeId: "2",
    flatType: "4 Room",
    flatModelId: "2",
    flatModel: "Model A",
    storeyRangeId: "2",
    storeyRange: "07 To 09",
    floorAreaSqm: 93,
    transactionMonth: "2023-12-01",
    resalePrice: 585000,
  },
  {
    id: "01979e02-7400-7000-a000-000000000105",
    propertyId: "01979e02-7400-7000-8000-000000000103",
    flatTypeId: "3",
    flatType: "5 Room",
    flatModelId: "3",
    flatModel: "Premium Apartment",
    storeyRangeId: "4",
    storeyRange: "13 To 15",
    floorAreaSqm: 112,
    transactionMonth: "2025-07-01",
    resalePrice: 745000,
  },
  {
    id: "01979e02-7400-7000-a000-000000000106",
    propertyId: "01979e02-7400-7000-8000-000000000104",
    flatTypeId: "2",
    flatType: "4 Room",
    flatModelId: "1",
    flatModel: "Improved",
    storeyRangeId: "1",
    storeyRange: "04 To 06",
    floorAreaSqm: 90,
    transactionMonth: "2025-05-01",
    resalePrice: 560000,
  },
  {
    id: "01979e02-7400-7000-a000-000000000107",
    propertyId: "01979e02-7400-7000-8000-000000000105",
    flatTypeId: "1",
    flatType: "3 Room",
    flatModelId: "2",
    flatModel: "Model A",
    storeyRangeId: "2",
    storeyRange: "07 To 09",
    floorAreaSqm: 70,
    transactionMonth: "2025-04-01",
    resalePrice: 430000,
  },
] satisfies resaleTransactionType[];

export type PropertyListFilters = {
  flatModelId?: string;
  flatTypeId?: string;
  maxPrice?: number;
  minPrice?: number;
  page: number;
  pageSize: number;
};

export function listPlaceholderProperties({
  flatModelId,
  flatTypeId,
  maxPrice,
  minPrice,
  page,
  pageSize,
}: PropertyListFilters): { data: propertyType[]; total: number } {
  const filteredProperties = properties.filter(
    (property) =>
      (flatTypeId === undefined || property.flatTypeId === flatTypeId) &&
      (flatModelId === undefined || property.flatModelId === flatModelId) &&
      (minPrice === undefined || property.resalePrice >= minPrice) &&
      (maxPrice === undefined || property.resalePrice <= maxPrice),
  );
  const pageCount = Math.max(
    1,
    Math.ceil(filteredProperties.length / pageSize),
  );
  const currentPage = Math.min(page, pageCount);

  return {
    data: filteredProperties.slice(
      (currentPage - 1) * pageSize,
      currentPage * pageSize,
    ),
    total: filteredProperties.length,
  };
}

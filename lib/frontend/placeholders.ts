import type {
  PlaceholderProperty,
  PlaceholderTransaction,
  PropertyAlert,
} from "@/lib/frontend/types";

export const properties: PlaceholderProperty[] = [
  {
    id: "property-queenstown-12",
    town: "QUEENSTOWN",
    block: "12",
    streetName: "DOVER CLOSE EAST",
    leaseCommenceYear: 1978,
  },
  {
    id: "property-tampines-220",
    town: "TAMPINES",
    block: "220",
    streetName: "TAMPINES STREET 24",
    leaseCommenceYear: 1984,
  },
  {
    id: "property-bishan-150",
    town: "BISHAN",
    block: "150",
    streetName: "BISHAN STREET 11",
    leaseCommenceYear: 1987,
  },
];

export const transactions: PlaceholderTransaction[] = [
  {
    id: "txn-001",
    propertyId: "property-queenstown-12",
    town: "QUEENSTOWN",
    flatType: "4 ROOM",
    flatModel: "Improved",
    storeyRange: "10 to 12",
    floorAreaSqm: "92",
    month: "2026-05",
    price: "$780,000",
  },
  {
    id: "txn-002",
    propertyId: "property-tampines-220",
    town: "TAMPINES",
    flatType: "5 ROOM",
    flatModel: "Model A",
    storeyRange: "07 to 09",
    floorAreaSqm: "121",
    month: "2026-04",
    price: "$690,000",
  },
  {
    id: "txn-003",
    propertyId: "property-bishan-150",
    town: "BISHAN",
    flatType: "3 ROOM",
    flatModel: "New Generation",
    storeyRange: "04 to 06",
    floorAreaSqm: "67",
    month: "2026-03",
    price: "$520,000",
  },
  {
    id: "txn-004",
    propertyId: "property-queenstown-12",
    town: "QUEENSTOWN",
    flatType: "3 ROOM",
    flatModel: "Improved",
    storeyRange: "04 to 06",
    floorAreaSqm: "68",
    month: "2026-02",
    price: "$610,000",
  },
  {
    id: "txn-005",
    propertyId: "property-queenstown-12",
    town: "QUEENSTOWN",
    flatType: "4 ROOM",
    flatModel: "Improved",
    storeyRange: "07 to 09",
    floorAreaSqm: "91",
    month: "2026-01",
    price: "$748,000",
  },
];

export const bookmarkedPropertyIds: string[] = [];

export const propertyAlerts: PropertyAlert[] = [
  {
    id: "alert-001",
    propertyId: "property-queenstown-12",
    metric: "resalePrice",
    matchValue: "",
    minValue: "600000",
    maxValue: "800000",
    isActive: true,
    createdAt: "2026-06-01",
  },
  {
    id: "alert-002",
    propertyId: "property-bishan-150",
    metric: "flatType",
    matchValue: "4 ROOM",
    minValue: "",
    maxValue: "",
    isActive: true,
    createdAt: "2026-06-12",
  },
];

export const flatTypeOptions = [
  { value: "1", label: "3 ROOM" },
  { value: "2", label: "4 ROOM" },
  { value: "3", label: "5 ROOM" },
];

export const flatModelOptions = [
  { value: "1", label: "Improved" },
  { value: "2", label: "Model A" },
  { value: "3", label: "New Generation" },
];

export const storeyRangeOptions = [
  { value: "1", label: "01 to 03" },
  { value: "2", label: "04 to 06" },
  { value: "3", label: "07 to 09" },
];

export const alertMetricOptions = [
  { value: "resalePrice", label: "Resale price" },
  { value: "floorAreaSqm", label: "Floor area sqm" },
  { value: "leaseCommenceYear", label: "Lease commence year" },
  { value: "flatType", label: "Flat type" },
  { value: "flatModel", label: "Flat model" },
  { value: "storeyRange", label: "Storey range" },
];

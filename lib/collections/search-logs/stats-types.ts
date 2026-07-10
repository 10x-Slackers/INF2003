export type NamedCount = {
  id: string;
  name: string;
  count: number;
};

export type PriceRangeStat = {
  range: string;
  min: number;
  max: number;
  count: number;
};

export type SearchStats = {
  totalSearches: number;
  topTowns: NamedCount[];
  topFlatTypes: NamedCount[];
  topFlatModels: NamedCount[];
  priceRanges: PriceRangeStat[];
};

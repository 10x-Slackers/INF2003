import { listProperties } from "@/lib/tables/properties";
import { listTowns } from "@/lib/tables/towns";
import { listFlatModels, listFlatTypes } from "@/lib/tables/lookups";
import { PropertiesTable } from "@/components/properties/properties-table";

const PAGE_SIZE = 20;

export default async function PropertiesPage() {
  const [{ data, total }, towns, flatTypes, flatModels] = await Promise.all([
    listProperties({ page: 1, pageSize: PAGE_SIZE }),
    listTowns(),
    listFlatTypes(),
    listFlatModels(),
  ]);

  return (
    <main className="container mx-auto flex flex-col gap-6 px-5 py-6">
      <h1 className="text-2xl font-medium tracking-tight">Properties</h1>
      <PropertiesTable
        initialData={data}
        initialTotal={total}
        towns={towns}
        flatTypes={flatTypes}
        flatModels={flatModels}
      />
    </main>
  );
}

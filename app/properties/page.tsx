import { PropertiesPanel } from "@/components/properties/properties-panel";

export default function PropertiesPage() {
  return (
    <main className="container mx-auto flex flex-col gap-6 px-5 py-6">
      <h1 className="text-2xl font-semibold">Properties</h1>
      <PropertiesPanel />
    </main>
  );
}

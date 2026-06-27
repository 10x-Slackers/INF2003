import { MetricCard } from "@/components/metric-card";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <main className="container mx-auto grid gap-7 px-5 py-6">
      <Card className="min-h-[480px]">
        <CardHeader>
          <CardTitle>Town map</CardTitle>
        </CardHeader>
      </Card>

      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Average price" value="$735,000" caption="May 2026" />
        <MetricCard label="Sales this month" value="2" caption="May 2026" />
        <MetricCard
          label="Price trend"
          value="$9,100 (+1.3%)"
          caption="vs last year"
          valueClassName="text-emerald-600"
        />
      </section>
    </main>
  );
}

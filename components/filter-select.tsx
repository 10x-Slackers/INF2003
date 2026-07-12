import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type FilterOption = { id: string | number; name: string };

type FilterSelectProps = {
  id: string;
  label: string;
  allLabel: string;
  value: string;
  onValueChange: (value: string) => void;
  options: FilterOption[];
};

export function FilterSelect({
  id,
  label,
  allLabel,
  value,
  onValueChange,
  options,
}: FilterSelectProps) {
  return (
    <div className="flex min-w-40 flex-1 flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger id={id} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{allLabel}</SelectItem>
          {options.map((opt) => (
            <SelectItem key={opt.id} value={String(opt.id)}>
              {opt.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

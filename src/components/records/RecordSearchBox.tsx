import { Input } from "@/components/ui/Input";

export function RecordSearchBox({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  return <Input placeholder="お店・相手先やメモで検索" value={value} onChange={(e) => onChange(e.target.value)} />;
}

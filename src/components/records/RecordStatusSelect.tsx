import { Select } from "@/components/ui/Select";

export function RecordStatusSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <Select value={value} onChange={(event) => onChange(event.target.value)}>
      <option value="unconfirmed">通常</option>
      <option value="confirmed">確認済み</option>
      <option value="filed">整理済み</option>
      <option value="hold">保留</option>
    </Select>
  );
}

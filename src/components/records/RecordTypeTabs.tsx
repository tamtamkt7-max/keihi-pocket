import { Tabs } from "@/components/ui/Tabs";

export function RecordTypeTabs({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <Tabs
      value={value}
      onChange={onChange}
      options={[
        { label: "経費", value: "expense" },
        { label: "売上", value: "income" },
      ]}
    />
  );
}

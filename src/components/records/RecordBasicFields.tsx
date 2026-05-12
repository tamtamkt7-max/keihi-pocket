import { Category } from "@/types/category";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

interface Props {
  values: any;
  categories: Category[];
  onChange: (key: string, value: any) => void;
}

export function RecordBasicFields({ values, categories, onChange }: Props) {
  const filteredCategories = categories.filter((item) => item.type === values.recordType || item.type === "common");

  return (
    <div className="simple-form">
      <div className="field">
        <label>日付</label>
        <Input type="date" value={values.transactionDate} onChange={(event) => onChange("transactionDate", event.target.value)} />
      </div>
      <div className="field amount-field">
        <label>金額</label>
        <Input
          inputMode="numeric"
          type="number"
          min={0}
          value={values.amount || ""}
          placeholder="0"
          onChange={(event) => onChange("amount", Number(event.target.value))}
        />
      </div>
      <div className="field">
        <label>{values.recordType === "income" ? "入金元" : "お店・相手先"}</label>
        <Input value={values.vendorName} onChange={(event) => onChange("vendorName", event.target.value)} placeholder="例: コンビニ、取引先名" />
      </div>
      <div className="field">
        <label>分類</label>
        <Select value={values.categoryId || ""} onChange={(event) => onChange("categoryId", event.target.value || null)}>
          <option value="">あとで選ぶ</option>
          {filteredCategories.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </Select>
        <small>迷ったときは、あとで見直せます。</small>
      </div>
    </div>
  );
}

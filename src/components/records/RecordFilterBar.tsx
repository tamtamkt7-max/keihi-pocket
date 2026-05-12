import { Category } from "@/types/category";
import { Select } from "@/components/ui/Select";

export function RecordFilterBar({
  filters,
  categories,
  onChange,
}: {
  filters: {
    month: string;
    recordType: string;
    status: string;
    categoryId: string;
  };
  categories: Category[];
  onChange: (key: string, value: string) => void;
}) {
  return (
    <div className="grid-2">
      <div className="field">
        <label>月</label>
        <Select value={filters.month} onChange={(e) => onChange("month", e.target.value)}>
          <option value="">すべて</option>
          {Array.from({ length: 24 }).map((_, index) => {
            const current = new Date();
            current.setMonth(current.getMonth() - index);
            const year = current.getFullYear();
            const month = `${current.getMonth() + 1}`.padStart(2, "0");
            const key = `${year}-${month}`;
            return (
              <option key={key} value={key}>
                {year}年{month}月
              </option>
            );
          })}
        </Select>
      </div>
      <div className="field">
        <label>種類</label>
        <Select value={filters.recordType} onChange={(e) => onChange("recordType", e.target.value)}>
          <option value="">すべて</option>
          <option value="expense">経費</option>
          <option value="income">売上</option>
        </Select>
      </div>
      <div className="field">
        <label>状態</label>
        <Select value={filters.status} onChange={(e) => onChange("status", e.target.value)}>
          <option value="">すべて</option>
          <option value="confirmed">確認済み</option>
          <option value="filed">申告に反映済み</option>
          <option value="hold">保留</option>
        </Select>
      </div>
      <div className="field">
        <label>分類</label>
        <Select value={filters.categoryId} onChange={(e) => onChange("categoryId", e.target.value)}>
          <option value="">すべて</option>
          {categories.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}

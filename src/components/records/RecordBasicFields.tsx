import { Category } from "@/types/category";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { getDefaultCategoriesForRecordType, getDefaultCategoryDescription } from "@/lib/categories/defaultCategories";

interface Props {
  values: any;
  categories: Category[];
  categoriesLoading?: boolean;
  onChange: (key: string, value: any) => void;
}

function isVisibleForRecordType(category: Category, recordType: string) {
  const type = String(category.type || "");
  return !type || type === recordType || type === "common" || type === "both" || type === "all";
}

export function RecordBasicFields({ values, categories, categoriesLoading = false, onChange }: Props) {
  const activeCategories = categories
    .filter((item) => item.isActive !== false)
    .sort((a, b) => (a.sortOrder ?? 9999) - (b.sortOrder ?? 9999));
  const filteredCategories = activeCategories.filter((item) => isVisibleForRecordType(item, values.recordType));
  const fallbackCategories = getDefaultCategoriesForRecordType(values.recordType);
  const visibleCategories =
    filteredCategories.length > 0
      ? filteredCategories
      : activeCategories.length > 0
        ? activeCategories
        : fallbackCategories;
  const selectedCategory = [...activeCategories, ...fallbackCategories].find((item) => item.id === values.categoryId);

  if (process.env.NODE_ENV !== "production") {
    console.info("category filter result", {
      categoriesCount: categories.length,
      visibleCategoriesCount: visibleCategories.length,
      recordType: values.recordType,
      categoryTypes: [...new Set(categories.map((item) => item.type || "none"))],
    });
    console.info("categories count", categories.length);
    console.info("visible categories count", visibleCategories.length);
    console.info("record type", values.recordType);
  }

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
        <Select
          value={values.categoryId || ""}
          disabled={categoriesLoading && visibleCategories.length === 0}
          onChange={(event) => {
            const nextId = event.target.value || null;
            const nextCategory = [...activeCategories, ...fallbackCategories].find((item) => item.id === nextId);
            onChange("categoryId", nextId);
            onChange("categoryName", nextCategory?.name || "");
          }}
        >
          <option value="">あとで選ぶ</option>
          {selectedCategory && !visibleCategories.some((item) => item.id === selectedCategory.id) ? (
            <option value={selectedCategory.id}>{selectedCategory.name}</option>
          ) : null}
          {visibleCategories.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </Select>
        <small>
          {categoriesLoading && visibleCategories.length === 0
            ? "分類を開いています..."
            : values.categoryId
            ? selectedCategory?.description || getDefaultCategoryDescription(selectedCategory?.name || "")
            : "迷ったときは、あとで選べます。未分類として集計に出ます。"}
        </small>
      </div>
    </div>
  );
}

import { Category } from "@/types/category";
import { VendorSuggestion } from "@/types/vendorSuggestion";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { getDefaultCategoriesForRecordType, getDefaultCategoryDescription } from "@/lib/categories/defaultCategories";

interface Props {
  values: any;
  categories: Category[];
  vendorSuggestions?: VendorSuggestion[];
  categoriesLoading?: boolean;
  onChange: (key: string, value: any) => void;
}

function isVisibleForRecordType(category: Category, recordType: string) {
  const type = String(category.type || "");
  return !type || type === recordType || type === "common" || type === "both" || type === "all";
}

export function RecordBasicFields({ values, categories, vendorSuggestions = [], categoriesLoading = false, onChange }: Props) {
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
  const shownVendorSuggestions = vendorSuggestions
    .filter((item) => item.name && item.name !== values.vendorName)
    .slice(0, 4);

  if (process.env.NODE_ENV !== "production") {
    console.info("category filter result", {
      categoriesCount: categories.length,
      visibleCategoriesCount: visibleCategories.length,
      recordType: values.recordType,
      categoryTypes: [...new Set(categories.map((item) => item.type || "none"))],
    });
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
        <Input
          value={values.vendorName}
          list="vendor-suggestions"
          onChange={(event) => onChange("vendorName", event.target.value)}
          placeholder="例: コンビニ、取引先名"
        />
        {vendorSuggestions.length > 0 ? (
          <datalist id="vendor-suggestions">
            {vendorSuggestions.slice(0, 12).map((item) => (
              <option key={item.id} value={item.name} />
            ))}
          </datalist>
        ) : null}
        {shownVendorSuggestions.length > 0 ? (
          <div className="readiness-list">
            {shownVendorSuggestions.map((item) => (
              <button key={item.id} type="button" className="readiness-pill" onClick={() => onChange("vendorName", item.name)}>
                {item.name}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      {values.recordType === "expense" ? (
        <div className="field">
          <label>記録の種類</label>
          <Select value={values.usageType || "spending"} onChange={(event) => onChange("usageType", event.target.value)}>
            <option value="spending">支出</option>
            <option value="business_expense">経費</option>
          </Select>
          <small>{values.usageType === "business_expense" ? "仕事に使った支払い" : "ふつうの支払い"}</small>
        </div>
      ) : null}
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
              : "あとから選べます。"}
        </small>
      </div>
    </div>
  );
}

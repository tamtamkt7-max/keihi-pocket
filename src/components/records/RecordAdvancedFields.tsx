import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";

export function RecordAdvancedFields({
  values,
  onChange,
}: {
  values: any;
  onChange: (key: string, value: any) => void;
}) {
  return (
    <details className="card quiet-details">
      <summary>詳細な項目</summary>
      <div className="section" style={{ marginTop: 16 }}>
        <div className="grid-2">
          <div className="field">
            <label>支払い方法</label>
            <Select value={values.paymentMethod} onChange={(event) => onChange("paymentMethod", event.target.value)}>
              <option value="cash">現金</option>
              <option value="credit">カード</option>
              <option value="bank">振込</option>
              <option value="e_money">電子マネー</option>
              <option value="other">その他</option>
            </Select>
          </div>
          <div className="field">
            <label>書類の種類</label>
            <Select value={values.documentType} onChange={(event) => onChange("documentType", event.target.value)}>
              <option value="receipt">レシート</option>
              <option value="invoice">請求書</option>
              <option value="statement">明細</option>
              <option value="delivery_note">納品書</option>
              <option value="other">その他</option>
            </Select>
          </div>
          <div className="field">
            <label>事業で使う割合 (%)</label>
            <Input
              type="number"
              min={0}
              max={100}
              value={values.businessUsePercent}
              onChange={(event) => onChange("businessUsePercent", Number(event.target.value))}
            />
          </div>
          <div className="field">
            <label>税の設定</label>
            <Select value={values.taxType} onChange={(event) => onChange("taxType", event.target.value)}>
              <option value="inclusive">税込</option>
              <option value="exclusive">税抜</option>
              <option value="none">対象外</option>
            </Select>
          </div>
          <div className="field">
            <label>税率 (%)</label>
            <Input
              type="number"
              value={values.taxRate ?? ""}
              onChange={(event) => onChange("taxRate", event.target.value ? Number(event.target.value) : null)}
            />
          </div>
        </div>
        <div className="field">
          <label>メモ</label>
          <Textarea value={values.memo} onChange={(event) => onChange("memo", event.target.value)} />
        </div>
      </div>
    </details>
  );
}

"use client";

import { useState } from "react";
import { Category } from "@/types/category";
import { PaymentMethod, RecordType, TaxType } from "@/types/record";
import { saveRecurringTemplate } from "@/lib/firestore/recurringTemplates";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

type FormValues = {
  name: string;
  recordType: RecordType;
  amount: number;
  vendorName: string;
  categoryId: string;
  paymentMethod: PaymentMethod;
  businessUsePercent: number;
  taxType: TaxType;
  taxRate: number;
  memo: string;
  dayOfMonth: number;
  isAutoCreate: boolean;
  isActive: boolean;
};

const emptyValues: FormValues = {
  name: "",
  recordType: "expense",
  amount: 0,
  vendorName: "",
  categoryId: "",
  paymentMethod: "credit",
  businessUsePercent: 100,
  taxType: "inclusive",
  taxRate: 10,
  memo: "",
  dayOfMonth: 1,
  isAutoCreate: false,
  isActive: true,
};

export function RecurringTemplateForm({
  userId,
  categories,
  onSaved,
}: {
  userId: string;
  categories: Category[];
  onSaved: () => void;
}) {
  const [values, setValues] = useState<FormValues>(emptyValues);

  function update(key: keyof FormValues, value: FormValues[keyof FormValues]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <Card className="list-card">
      <div className="heading">
        <h3>定期支出を追加</h3>
      </div>
      <p className="subtitle" style={{ marginTop: -4 }}>
        家賃や通信費など、毎月同じように入れる支払いに使えます。
      </p>
      <div className="grid-2">
        <div className="field">
          <label>名前</label>
          <Input value={values.name} onChange={(event) => update("name", event.target.value)} placeholder="例: 携帯料金" />
        </div>
        <div className="field">
          <label>金額</label>
          <Input type="number" value={values.amount} onChange={(event) => update("amount", Number(event.target.value))} />
        </div>
        <div className="field">
          <label>相手先</label>
          <Input value={values.vendorName} onChange={(event) => update("vendorName", event.target.value)} />
        </div>
        <div className="field">
          <label>分類</label>
          <Select value={values.categoryId} onChange={(event) => update("categoryId", event.target.value)}>
            <option value="">あとで選ぶ</option>
            {categories.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="field">
          <label>毎月の日付</label>
          <Input type="number" min={1} max={31} value={values.dayOfMonth} onChange={(event) => update("dayOfMonth", Number(event.target.value))} />
        </div>
      </div>
      <Button
        onClick={async () => {
          await saveRecurringTemplate({
            userId,
            ...values,
            categoryId: values.categoryId || null,
          });
          setValues(emptyValues);
          onSaved();
        }}
      >
        保存する
      </Button>
    </Card>
  );
}

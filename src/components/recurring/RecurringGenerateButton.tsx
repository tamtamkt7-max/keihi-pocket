"use client";

import { saveRecord } from "@/lib/firestore/records";
import { RecurringTemplate } from "@/types/recurring";
import { Button } from "@/components/ui/Button";

export function RecurringGenerateButton({
  userId,
  templates,
  fiscalYearStartMonth,
  onDone,
}: {
  userId: string;
  templates: RecurringTemplate[];
  fiscalYearStartMonth: number;
  onDone: () => void;
}) {
  return (
    <Button
      variant="secondary"
      onClick={async () => {
        const today = new Date().toISOString().slice(0, 10);
        await Promise.all(
          templates
            .filter((item) => item.isActive)
            .map((item) =>
              saveRecord({
                userId,
                fiscalYearStartMonth,
                recordType: item.recordType,
                documentType: "other",
                transactionDate: today,
                amount: item.amount,
                vendorName: item.vendorName,
                categoryId: item.categoryId,
                tagIds: [],
                paymentMethod: item.paymentMethod,
                businessUsePercent: item.businessUsePercent,
                taxType: item.taxType,
                taxRate: item.taxRate,
                taxAmount: null,
                invoiceNumberMemo: "",
                memo: item.memo,
                status: "confirmed",
                imageUrls: [],
                thumbnailUrl: null,
                ocrRawText: "",
                recurringTemplateId: item.id,
              })
            )
        );
        onDone();
      }}
    >
      今月分を追加
    </Button>
  );
}

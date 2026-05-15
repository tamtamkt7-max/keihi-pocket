"use client";

import { ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { OcrExtracted } from "@/types/record";
import { formatCurrency } from "@/lib/utils/formatCurrency";

export function OcrCandidatePanel({
  loading,
  extracted,
  onApply,
}: {
  loading: boolean;
  extracted?: OcrExtracted;
  onApply: (field: "date" | "amount" | "vendorName", value: string | number | undefined) => void;
}) {
  const dateCandidates = (extracted?.dateCandidates || []).filter((value) => value && value !== extracted?.date);
  const amountCandidates = (extracted?.amountCandidates || [])
    .filter((candidate) => typeof candidate === "number" || !candidate.excludedReason)
    .map((candidate) => (typeof candidate === "number" ? candidate : candidate.value))
    .filter((value, index, all) => value && value !== extracted?.amount && all.indexOf(value) === index);
  const vendorCandidates = (extracted?.vendorNameCandidates || []).filter((value) => value && value !== extracted?.vendorName);
  const hasCandidates = dateCandidates.length > 0 || amountCandidates.length > 0 || vendorCandidates.length > 0;

  if (loading) {
    return (
      <Card className="list-card reading-status-card">
        <div className="heading reading-status-heading" style={{ marginBottom: 0 }}>
          <h3>写真を確認しています...</h3>
          <span className="badge primary">自動入力中</span>
        </div>
      </Card>
    );
  }

  if (!hasCandidates) return null;

  return (
    <details className="card candidate-card">
      <summary>
        <span>ほかの候補</span>
        <small>違うときはタップして入れ替えられます</small>
      </summary>
      <div className="candidate-body">

      {dateCandidates.length > 0 ? (
        <CandidateRow label="日付">
          {dateCandidates.map((date) => (
            <Button key={date} variant="secondary" type="button" onClick={() => onApply("date", date)}>
              {date}
            </Button>
          ))}
        </CandidateRow>
      ) : null}

      {amountCandidates.length > 0 ? (
        <CandidateRow label="金額">
          {amountCandidates.map((amount) => (
            <Button key={amount} variant="secondary" type="button" onClick={() => onApply("amount", amount)}>
              {formatCurrency(amount)}
            </Button>
          ))}
        </CandidateRow>
      ) : null}

      {vendorCandidates.length > 0 ? (
        <CandidateRow label="相手先">
          {vendorCandidates.map((vendor) => (
            <Button key={vendor} variant="secondary" type="button" onClick={() => onApply("vendorName", vendor)}>
              {vendor}
            </Button>
          ))}
        </CandidateRow>
      ) : null}
      </div>
    </details>
  );
}

function CandidateRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="candidate-row">
      <span>{label}</span>
      <div className="wrap">{children}</div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

const STORAGE_KEY = "keihi-pocket-guide-seen";

export function FirstRunGuide() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(localStorage.getItem(STORAGE_KEY) !== "1");
  }, []);

  if (!visible) return null;

  return (
    <Card className="list-card first-run-guide">
      <div className="heading">
        <div>
          <h2>はじめ方</h2>
          <p className="subtitle">最初はこの3つだけ覚えておけば大丈夫です。</p>
        </div>
        <Button
          variant="ghost"
          onClick={() => {
            localStorage.setItem(STORAGE_KEY, "1");
            setVisible(false);
          }}
        >
          閉じる
        </Button>
      </div>
      <ol className="guide-steps" aria-label="はじめ方の手順">
        <li>
          <span>1</span>
          <strong>レシートを撮る</strong>
        </li>
        <li>
          <span>2</span>
          <strong>内容を確認する</strong>
        </li>
        <li>
          <span>3</span>
          <strong>保存して集計を見る</strong>
        </li>
      </ol>
      <Link href="/records/new" className="button primary guide-action">
        <PlusCircle size={18} />
        はじめる
      </Link>
    </Card>
  );
}

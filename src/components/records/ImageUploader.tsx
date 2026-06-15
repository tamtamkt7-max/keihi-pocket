"use client";

import { useState } from "react";
import { Camera, ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function ImageUploader({
  mode,
  previews,
  onChange,
  onRemove,
}: {
  mode: "camera" | "upload";
  previews: { url: string; name: string }[];
  onChange: (files: FileList | null) => void;
  onRemove: (index: number) => void;
}) {
  const isCamera = mode === "camera";
  const Icon = isCamera ? Camera : ImagePlus;
  const hasPreview = previews.length > 0;
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  return (
    <div className="section">
      {previews.length > 0 ? (
        <div className="preview-grid">
          {previews.map((item, index) => (
            <div className="preview-item" key={`${item.url}-${index}`}>
              {brokenImages[item.url] ? (
                <div className="preview-placeholder">
                  <ImagePlus size={22} />
                  <span>写真を表示できません</span>
                </div>
              ) : (
                <img
                  src={item.url}
                  alt="登録する写真"
                  onError={() => setBrokenImages((prev) => ({ ...prev, [item.url]: true }))}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              )}
              <Button variant="danger" onClick={() => onRemove(index)} aria-label="写真を削除">
                <X size={14} />
              </Button>
            </div>
          ))}
        </div>
      ) : null}

      <label className="capture-button capture-button-compact">
        <Icon size={22} />
        <span>{isCamera ? (hasPreview ? "撮り直す" : "レシートを撮る") : hasPreview ? "選び直す" : "写真を選ぶ"}</span>
        <input
          hidden
          type="file"
          accept="image/*"
          multiple
          capture={isCamera ? "environment" : undefined}
          onChange={(event) => onChange(event.target.files)}
        />
      </label>
    </div>
  );
}

export function RecordImagePreview({ url }: { url?: string | null }) {
  if (!url) return null;
  return (
    <div className="card" style={{ overflow: "hidden" }}>
      <img src={url} alt="" style={{ width: "100%", maxHeight: 360, objectFit: "cover" }} />
    </div>
  );
}

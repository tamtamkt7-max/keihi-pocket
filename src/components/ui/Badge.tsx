import { HTMLAttributes } from "react";

export function Badge({
  className = "",
  tone = "default",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: "default" | "primary" | "success" | "warning" | "danger" }) {
  const mapped = tone === "default" ? "" : tone;
  return <span className={`badge ${mapped} ${className}`.trim()} {...props} />;
}

import Link from "next/link";
import { Camera, ImagePlus, WalletCards } from "lucide-react";
import { Card } from "@/components/ui/Card";

const actions = [
  {
    href: "/records/new?entry=camera",
    label: "撮る",
    description: "レシートや領収書を撮って登録します。",
    icon: Camera,
    primary: true,
  },
  {
    href: "/records/new?entry=upload",
    label: "写真を選ぶ",
    description: "保存済みの写真から登録します。",
    icon: ImagePlus,
  },
  {
    href: "/records/new?type=income&entry=income",
    label: "売上を入れる",
    description: "入金や売上を記録します。",
    icon: WalletCards,
  },
];

export function QuickActions() {
  return (
    <Card className="list-card">
      <div className="heading">
        <h3>すぐに始める</h3>
      </div>
      <div className="action-grid">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link key={action.label} href={action.href} className={`action-card ${action.primary ? "action-card-primary" : ""}`}>
              <span className="action-card-icon">
                <Icon size={20} />
              </span>
              <div>
                <strong>{action.label}</strong>
                <p>{action.description}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </Card>
  );
}

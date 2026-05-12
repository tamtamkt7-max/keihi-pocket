import { ReactNode } from "react";
import { AccountMenu } from "@/components/auth/AccountMenu";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="heading">
      <div>
        <h1>{title}</h1>
        {description ? <p className="subtitle">{description}</p> : null}
      </div>
      <div className="page-header-actions">
        {actions}
        <AccountMenu />
      </div>
    </div>
  );
}

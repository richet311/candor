import { Link } from "react-router-dom";
import { Card, CardBody } from "./ui/Card";
import { Badge } from "./ui/Badge";
import { ProgressBar } from "./ui/ProgressBar";
import { formatCents } from "../lib/money";
import type { Fund } from "../lib/types";

export function FundCard({ fund }: { fund: Fund }) {
  return (
    <Link to={`/funds/${fund.slug}`}>
      <Card className="h-full transition-shadow hover:shadow-md">
        <CardBody className="flex h-full flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-base font-semibold text-[var(--color-ink)]">{fund.name}</h3>
            <Badge tone="accent">{fund.category}</Badge>
          </div>

          {fund.organization && <p className="text-xs text-[var(--color-ink-soft)]">{fund.organization.name}</p>}

          <p className="line-clamp-2 flex-1 text-sm text-[var(--color-ink-soft)]">{fund.description}</p>

          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-[var(--color-ink)]">{formatCents(fund.raisedCents)} raised</span>
            <span className="text-[var(--color-ink-soft)]">of {formatCents(fund.goalCents)}</span>
          </div>

          <ProgressBar raisedCents={fund.raisedCents} goalCents={fund.goalCents} />
        </CardBody>
      </Card>
    </Link>
  );
}

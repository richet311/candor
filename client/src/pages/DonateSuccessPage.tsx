import { Link } from "react-router-dom";
import { PageContainer } from "../components/layout/PageContainer";
import { Card, CardBody } from "../components/ui/Card";
import { Button } from "../components/ui/Button";

export function DonateSuccessPage() {
  return (
    <PageContainer className="max-w-md">
      <Card>
        <CardBody className="flex flex-col items-center gap-4 py-10 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-success)]/10 text-2xl text-[var(--color-success)]">
            ✓
          </span>
          <h1 className="text-lg font-semibold text-[var(--color-ink)]">Thank you</h1>
          <p className="text-sm text-[var(--color-ink-soft)]">
            Your donation is being confirmed by Stripe. It'll show up in your giving history and on the fund's public
            ledger within a few seconds.
          </p>
          <Link to="/dashboard">
            <Button>View my giving</Button>
          </Link>
        </CardBody>
      </Card>
    </PageContainer>
  );
}

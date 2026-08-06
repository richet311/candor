import { Link } from "react-router-dom";
import { PageContainer } from "../components/layout/PageContainer";
import { Card, CardBody } from "../components/ui/Card";
import { Button } from "../components/ui/Button";

export function DonateCancelledPage() {
  return (
    <PageContainer className="max-w-md">
      <Card>
        <CardBody className="flex flex-col items-center gap-4 py-10 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/5 text-2xl text-[var(--color-ink-soft)]">
            ×
          </span>
          <h1 className="text-lg font-semibold text-[var(--color-ink)]">Checkout cancelled</h1>
          <p className="text-sm text-[var(--color-ink-soft)]">No charge was made. You can try again any time.</p>
          <Link to="/funds">
            <Button variant="ghost">Back to funds</Button>
          </Link>
        </CardBody>
      </Card>
    </PageContainer>
  );
}

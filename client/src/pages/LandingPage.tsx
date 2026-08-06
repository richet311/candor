import { Link } from "react-router-dom";
import { PageContainer } from "../components/layout/PageContainer";
import { Button } from "../components/ui/Button";
import { Card, CardBody } from "../components/ui/Card";

const STEPS = [
  {
    title: "A nonprofit opens a fund",
    body: "Staff set a goal, describe the need, and start logging every expense against it as it happens.",
  },
  {
    title: "Donors see the ledger, not just a thermometer",
    body: "Every dollar raised and every dollar spent is broken down by category, in the order it happened.",
  },
  {
    title: "Giving is a few clicks, backed by Stripe",
    body: "Card payments are processed by Stripe. ClearFund never touches or stores card details.",
  },
];

export function LandingPage() {
  return (
    <div>
      <section className="border-b border-[var(--color-border)] bg-[var(--color-navy-dark)]">
        <PageContainer className="flex flex-col items-start gap-6 py-20 text-white">
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-wide">
            Financial transparency for nonprofits
          </span>
          <h1 className="max-w-2xl text-4xl font-semibold leading-tight sm:text-5xl">
            Show donors exactly where their money went.
          </h1>
          <p className="max-w-xl text-white/80">
            ClearFund replaces the vague progress bar with an open ledger: every donation in, every expense out,
            organized by fund and category, visible to anyone before they give.
          </p>
          <div className="flex gap-3">
            <Link to="/funds">
              <Button variant="secondary">Browse funds</Button>
            </Link>
            <Link to="/register">
              <Button variant="ghost" className="border-white/30 text-white hover:bg-white/10">
                Register a nonprofit
              </Button>
            </Link>
          </div>
        </PageContainer>
      </section>

      <PageContainer className="flex flex-col gap-8 py-16">
        <h2 className="text-xl font-semibold text-[var(--color-ink)]">How it works</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <Card key={step.title}>
              <CardBody className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-[var(--color-accent)]">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="font-medium text-[var(--color-ink)]">{step.title}</h3>
                <p className="text-sm text-[var(--color-ink-soft)]">{step.body}</p>
              </CardBody>
            </Card>
          ))}
        </div>
      </PageContainer>
    </div>
  );
}

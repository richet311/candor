import type { ReactNode } from "react";
import { PageContainer } from "./PageContainer";
import { Card, CardBody } from "../ui/Card";

export function LegalPageLayout({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <PageContainer className="max-w-3xl py-12">
      <h1 className="text-3xl font-bold tracking-tight text-[var(--color-ink)]">{title}</h1>
      <p className="mt-1 text-sm text-[var(--color-ink-soft)]">Last updated {updated}</p>

      <Card className="mt-6">
        <CardBody className="flex flex-col gap-5 text-sm leading-relaxed text-[var(--color-ink)] [&_h2]:mt-2 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-[var(--color-ink)] [&_p]:text-[var(--color-ink-soft)] [&_li]:text-[var(--color-ink-soft)] [&_ul]:list-disc [&_ul]:pl-5 [&_a]:text-[var(--color-accent)] [&_a]:hover:underline">
          {children}
        </CardBody>
      </Card>
    </PageContainer>
  );
}

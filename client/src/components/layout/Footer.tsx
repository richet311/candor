import { Link } from "react-router-dom";
import { Logo } from "../Logo";

const GITHUB_URL = "https://github.com/richet311/candor";

export function Footer() {
  return (
    <footer className="border-t border-[var(--color-border)]/60 bg-[var(--color-paper-raised)]">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-12 sm:grid-cols-4">
        <div className="flex flex-col gap-2 sm:col-span-1">
          <Logo className="text-xl text-[var(--color-navy)]" />
          <p className="max-w-xs text-sm text-[var(--color-ink-soft)]">
            An open ledger for nonprofit fundraising: every donation in, every expense out, visible before you give.
          </p>
        </div>

        <div className="flex flex-col gap-2 text-sm">
          <span className="font-semibold text-[var(--color-ink)]">Product</span>
          <Link to="/funds" className="text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]">
            Browse funds
          </Link>
          <Link to="/organizations" className="text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]">
            Nonprofits
          </Link>
          <Link to="/register" className="text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]">
            Register a nonprofit
          </Link>
          <Link to="/login" className="text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]">
            Log in
          </Link>
        </div>

        <div className="flex flex-col gap-2 text-sm">
          <span className="font-semibold text-[var(--color-ink)]">Project</span>
          <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]">
            Source on GitHub
          </a>
          <a
            href={`${GITHUB_URL}#security`}
            target="_blank"
            rel="noreferrer"
            className="text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
          >
            Security notes
          </a>
        </div>

        <div className="flex flex-col gap-2 text-sm">
          <span className="font-semibold text-[var(--color-ink)]">Legal</span>
          <Link to="/terms" className="text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]">
            Terms of Service
          </Link>
          <Link to="/privacy" className="text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]">
            Privacy Policy
          </Link>
        </div>
      </div>

      <div className="border-t border-[var(--color-border)]/60 px-4 py-4">
        <p className="mx-auto w-full max-w-7xl text-xs text-[var(--color-ink-soft)]">
          Candor is a demo project, not a registered charity or payment processor. All payments run through Stripe in
          test mode, no real money moves. Nonprofit identities are real and verified against the IRS registry, but
          those organizations don't receive funds through this site; donation activity shown is a mix of real gifts
          and simulated activity used to demonstrate the ledger.
        </p>
      </div>
    </footer>
  );
}

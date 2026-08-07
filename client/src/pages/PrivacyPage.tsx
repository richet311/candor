import { LegalPageLayout } from "../components/layout/LegalPageLayout";

const GITHUB_URL = "https://github.com/richet311/candor";

export function PrivacyPage() {
  return (
    <LegalPageLayout title="Privacy Policy" updated="August 2026">
      <div>
        <h2>What this covers</h2>
        <p>
          Candor is a personal portfolio project, not a company. This page explains what data the app collects and
          why, in plain terms, so you know what happens if you create an account or make a test donation.
        </p>
      </div>

      <div>
        <h2>What we collect</h2>
        <ul>
          <li>Account info you provide: name, email, and a hashed (never plaintext) password.</li>
          <li>If you sign in with Google or GitHub, the basic profile info those services share (name, email).</li>
          <li>Optional profile fields you choose to add: avatar photo, bio, or organization logo/banner/website.</li>
          <li>Donation records you create: amount, fund, timestamp, and whether you chose to donate anonymously.</li>
          <li>Standard server logs (timestamps, IP, request path) used for debugging and abuse prevention.</li>
        </ul>
      </div>

      <div>
        <h2>What we don't collect</h2>
        <p>
          Candor never sees or stores your card number or other payment details. Checkout happens entirely on
          Stripe's own hosted page; Candor only receives a confirmation that a (test-mode) payment succeeded.
        </p>
      </div>

      <div>
        <h2>Third parties involved</h2>
        <ul>
          <li>
            <strong>Stripe</strong> — processes checkout (test mode only). See Stripe's own privacy policy for how
            they handle payment data.
          </li>
          <li>
            <strong>Google / GitHub</strong> — optional sign-in providers, if you choose to use them instead of a
            password.
          </li>
        </ul>
        <p>We don't sell or share your data with advertisers, and we don't send marketing email.</p>
      </div>

      <div>
        <h2>How data is stored</h2>
        <p>
          Account and donation data live in a Postgres database. Uploaded images (avatars, org logos/banners) are
          stored on the app server. Sessions use a short-lived access token plus a longer-lived refresh token stored
          in an httpOnly cookie, so it isn't readable by page scripts.
        </p>
      </div>

      <div>
        <h2>Your choices</h2>
        <p>
          You can mark any individual donation anonymous, which hides your name from that fund's public activity log
          (it's still tied to your account for your own donation history). To request that your account and data be
          deleted, reach out via the project's{" "}
          <a href={GITHUB_URL} target="_blank" rel="noreferrer">
            GitHub repository
          </a>
          .
        </p>
      </div>

      <div>
        <h2>Children's privacy</h2>
        <p>Candor is not directed at, and should not be used by, children under 13.</p>
      </div>

      <div>
        <h2>Changes</h2>
        <p>This policy may be updated as the project evolves.</p>
      </div>
    </LegalPageLayout>
  );
}

import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { PageContainer } from "../components/layout/PageContainer";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { OAuthButtons } from "../components/OAuthButtons";
import { ApiError } from "../lib/api";

type Mode = "donor" | "organization";

export function RegisterPage() {
  const { registerDonor, registerOrganization, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("donor");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [donorForm, setDonorForm] = useState({ firstName: "", lastName: "", username: "", email: "", password: "" });
  const [orgForm, setOrgForm] = useState({ orgName: "", adminFirstName: "", adminLastName: "", adminEmail: "", adminPassword: "" });

  async function handleDonorSubmit(e: FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await registerDonor(donorForm);
      navigate("/");
    } catch (err) {
      // toast already shown by AuthContext
      if (err instanceof ApiError && err.status === 409) {
        navigate("/login", { state: { email: donorForm.email, notice: "An account already exists with this email. Log in below." } });
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleOrgSubmit(e: FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await registerOrganization(orgForm);
      navigate("/admin");
    } catch (err) {
      // toast already shown by AuthContext
      if (err instanceof ApiError && err.status === 409) {
        navigate("/login", { state: { email: orgForm.adminEmail, notice: "An account already exists with this email. Log in below." } });
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGoogleCredential(idToken: string) {
    try {
      await loginWithGoogle(idToken);
      navigate("/");
    } catch {
      // toast already shown by AuthContext
    }
  }

  return (
    <PageContainer className="max-w-md">
      <Card>
        <CardHeader className="flex flex-col items-center gap-3 text-center">
          <h1 className="text-xl font-bold tracking-tight text-[var(--color-ink)]">Create an account</h1>
          <div className="flex gap-2 text-sm">
            <button
              type="button"
              onClick={() => setMode("donor")}
              className={`rounded-full px-3 py-1 ${mode === "donor" ? "bg-[var(--color-navy)] text-white" : "text-[var(--color-ink-soft)]"}`}
            >
              I'm a donor
            </button>
            <button
              type="button"
              onClick={() => setMode("organization")}
              className={`rounded-full px-3 py-1 ${mode === "organization" ? "bg-[var(--color-navy)] text-white" : "text-[var(--color-ink-soft)]"}`}
            >
              I'm a nonprofit
            </button>
          </div>
        </CardHeader>

        <CardBody className="flex flex-col gap-4">
          {mode === "donor" && (
            <>
              <OAuthButtons onGoogleCredential={handleGoogleCredential} />
              <div className="flex items-center gap-3 text-xs text-[var(--color-ink-soft)]">
                <div className="h-px flex-1 bg-[var(--color-border)]" />
                or with email
                <div className="h-px flex-1 bg-[var(--color-border)]" />
              </div>
              <form onSubmit={handleDonorSubmit} className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="First name"
                    required
                    value={donorForm.firstName}
                    onChange={(e) => setDonorForm({ ...donorForm, firstName: e.target.value })}
                    autoComplete="given-name"
                  />
                  <Input
                    label="Last name"
                    required
                    value={donorForm.lastName}
                    onChange={(e) => setDonorForm({ ...donorForm, lastName: e.target.value })}
                    autoComplete="family-name"
                  />
                </div>
                <Input
                  label="Username"
                  required
                  minLength={3}
                  maxLength={24}
                  pattern="[a-zA-Z0-9_]+"
                  title="Letters, numbers, and underscores only"
                  hint="Shown on your public donations instead of your real name"
                  value={donorForm.username}
                  onChange={(e) => setDonorForm({ ...donorForm, username: e.target.value })}
                  autoComplete="username"
                />
                <Input
                  label="Email"
                  type="email"
                  required
                  value={donorForm.email}
                  onChange={(e) => setDonorForm({ ...donorForm, email: e.target.value })}
                  autoComplete="email"
                />
                <Input
                  label="Password"
                  type="password"
                  required
                  minLength={10}
                  value={donorForm.password}
                  onChange={(e) => setDonorForm({ ...donorForm, password: e.target.value })}
                  autoComplete="new-password"
                />
                <Button type="submit" isLoading={isSubmitting} className="w-full">
                  Create donor account
                </Button>
              </form>
            </>
          )}

          {mode === "organization" && (
            <form onSubmit={handleOrgSubmit} className="flex flex-col gap-4">
              <Input label="Organization name" required value={orgForm.orgName} onChange={(e) => setOrgForm({ ...orgForm, orgName: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="First name"
                  required
                  value={orgForm.adminFirstName}
                  onChange={(e) => setOrgForm({ ...orgForm, adminFirstName: e.target.value })}
                  autoComplete="given-name"
                />
                <Input
                  label="Last name"
                  required
                  value={orgForm.adminLastName}
                  onChange={(e) => setOrgForm({ ...orgForm, adminLastName: e.target.value })}
                  autoComplete="family-name"
                />
              </div>
              <Input
                label="Work email"
                type="email"
                required
                value={orgForm.adminEmail}
                onChange={(e) => setOrgForm({ ...orgForm, adminEmail: e.target.value })}
                autoComplete="email"
              />
              <Input
                label="Password"
                type="password"
                required
                minLength={10}
                value={orgForm.adminPassword}
                onChange={(e) => setOrgForm({ ...orgForm, adminPassword: e.target.value })}
                autoComplete="new-password"
              />
              <Button type="submit" isLoading={isSubmitting} className="w-full">
                Set up organization
              </Button>
            </form>
          )}

          <p className="text-center text-sm text-[var(--color-ink-soft)]">
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-[var(--color-navy)]">
              Log in
            </Link>
          </p>

          <p className="text-center text-xs text-[var(--color-ink-soft)]">
            By creating an account, you agree to Candor's{" "}
            <Link to="/terms" className="underline hover:text-[var(--color-ink)]">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link to="/privacy" className="underline hover:text-[var(--color-ink)]">
              Privacy Policy
            </Link>
            .
          </p>
        </CardBody>
      </Card>
    </PageContainer>
  );
}

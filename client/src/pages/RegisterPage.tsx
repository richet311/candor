import { useCallback, useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { PageContainer } from "../components/layout/PageContainer";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { OAuthButtons } from "../components/OAuthButtons";
import { PickDetailsStep } from "../components/PickDetailsStep";
import { PickAvatarStep } from "../components/PickAvatarStep";
import { ApiError } from "../lib/api";

type Mode = "donor" | "organization";
// Shared slide track for both modes: organization mode never visits "details" (org admins have
// no username field at all), it goes straight from "start" to "avatar".
type Step = "start" | "details" | "avatar";
type SignupMethod = "email" | "oauth" | null;

const STEP_INDEX: Record<Step, number> = { start: 0, details: 1, avatar: 2 };

export function RegisterPage() {
  const { registerDonor, registerOrganization, loginWithGoogle, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("donor");
  const [step, setStep] = useState<Step>("start");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showEmailFields, setShowEmailFields] = useState(false);
  const [emailCreds, setEmailCreds] = useState({ email: "", password: "" });
  const [signupMethod, setSignupMethod] = useState<SignupMethod>(null);
  const [detailsPrefill, setDetailsPrefill] = useState({ firstName: "", lastName: "", username: "" });

  const [orgForm, setOrgForm] = useState({ orgName: "", adminFirstName: "", adminLastName: "", adminEmail: "", adminPassword: "" });

  function handleEmailContinue(e: FormEvent) {
    e.preventDefault();
    setSignupMethod("email");
    setStep("details");
  }

  async function handleDetailsSubmit(details: { firstName: string; lastName: string; username: string }) {
    if (signupMethod === "email") {
      await registerDonor({ ...emailCreds, ...details });
    } else {
      await updateProfileForOAuth(details);
    }
    setStep("avatar");
  }

  async function updateProfileForOAuth(details: { firstName: string; lastName: string; username: string }) {
    await updateProfile({ name: `${details.firstName} ${details.lastName}`.trim(), username: details.username });
  }

  // Memoized: GoogleSignInButton stays mounted through the whole wizard (its GIS init needs to
  // survive step changes), and its own effect depends on this callback's identity to decide
  // whether to re-run. Without useCallback, every step transition re-renders RegisterPage with
  // a fresh function here, which tears down and rebuilds Google's iframe mid-slide-animation.
  const handleGoogleCredential = useCallback(
    async (idToken: string) => {
      try {
        const { user, event } = await loginWithGoogle(idToken);
        if (event === "created") {
          const [firstName, ...rest] = user.name.split(" ");
          setSignupMethod("oauth");
          setDetailsPrefill({ firstName: firstName ?? "", lastName: rest.join(" "), username: user.username ?? "" });
          setStep("details");
        } else {
          navigate("/");
        }
      } catch {
        // toast already shown by AuthContext
      }
    },
    [loginWithGoogle, navigate],
  );

  async function handleOrgSubmit(e: FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await registerOrganization(orgForm);
      setStep("avatar");
    } catch (err) {
      // toast already shown by AuthContext
      if (err instanceof ApiError && err.status === 409) {
        navigate("/login", { state: { email: orgForm.adminEmail, notice: "An account already exists with this email. Log in below." } });
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const stepIndex = STEP_INDEX[step];
  const title =
    step === "avatar"
      ? "Pick an avatar"
      : step === "details"
        ? "Make it yours"
        : mode === "donor"
          ? "Create an account"
          : "Register your nonprofit";

  return (
    <PageContainer className="max-w-md">
      <Card>
        <CardHeader className="flex flex-col items-center gap-3 text-center">
          {step === "details" && (
            <button
              type="button"
              onClick={() => setStep("start")}
              className="self-start text-sm font-medium text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
            >
              &larr; Back
            </button>
          )}
          <h1 className="text-xl font-bold tracking-tight text-[var(--color-ink)]">{title}</h1>
          {step === "start" && (
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
          )}
        </CardHeader>

        <CardBody className="overflow-hidden">
          <div className="flex min-h-[420px] transition-transform duration-300 ease-in-out" style={{ transform: `translateX(-${stepIndex * 100}%)` }}>
            <div className="w-full shrink-0">
              {mode === "donor" ? (
                <div className="flex flex-col gap-4">
                  <OAuthButtons onGoogleCredential={handleGoogleCredential} />
                  <div className="flex items-center gap-3 text-xs text-[var(--color-ink-soft)]">
                    <div className="h-px flex-1 bg-[var(--color-border)]" />
                    or with email
                    <div className="h-px flex-1 bg-[var(--color-border)]" />
                  </div>
                  {showEmailFields ? (
                    <form onSubmit={handleEmailContinue} className="flex flex-col gap-4">
                      <Input
                        label="Email"
                        type="email"
                        required
                        value={emailCreds.email}
                        onChange={(e) => setEmailCreds({ ...emailCreds, email: e.target.value })}
                        autoComplete="email"
                      />
                      <Input
                        label="Password"
                        type="password"
                        required
                        minLength={10}
                        value={emailCreds.password}
                        onChange={(e) => setEmailCreds({ ...emailCreds, password: e.target.value })}
                        autoComplete="new-password"
                      />
                      <Button type="submit" className="w-full">
                        Continue
                      </Button>
                    </form>
                  ) : (
                    <Button type="button" variant="ghost" onClick={() => setShowEmailFields(true)} className="w-full">
                      Continue with email
                    </Button>
                  )}
                </div>
              ) : (
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
            </div>

            <div className="w-full shrink-0 px-0.5">
              {step === "details" && (
                <PickDetailsStep
                  initialFirstName={detailsPrefill.firstName}
                  initialLastName={detailsPrefill.lastName}
                  initialUsername={detailsPrefill.username}
                  onSubmit={handleDetailsSubmit}
                />
              )}
            </div>

            <div className="w-full shrink-0 px-0.5">
              {step === "avatar" && <PickAvatarStep onDone={() => navigate(mode === "organization" ? "/admin" : "/")} />}
            </div>
          </div>
        </CardBody>

        {step === "start" && (
          <CardBody className="flex flex-col gap-4 pt-0">
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
        )}
      </Card>
    </PageContainer>
  );
}

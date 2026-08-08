import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { Spinner } from "../components/ui/Spinner";
import { PageContainer } from "../components/layout/PageContainer";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { PickDetailsStep } from "../components/PickDetailsStep";
import { PickAvatarStep } from "../components/PickAvatarStep";
import { oauthWelcomeMessage } from "../lib/oauthMessages";
import type { OAuthEvent } from "../lib/types";

type WizardStep = "details" | "avatar";

export function OAuthCompletePage() {
  const [searchParams] = useSearchParams();
  const { user, isLoading, updateProfile } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const error = searchParams.get("error");
  const event = searchParams.get("event") as OAuthEvent | null;

  const [wizardStep, setWizardStep] = useState<WizardStep | null>(null);
  const [entered, setEntered] = useState(false);
  const hasHandled = useRef(false);

  useEffect(() => {
    if (error) {
      toast.error(error);
      navigate("/login", { replace: true });
      return;
    }

    if (!isLoading && !hasHandled.current) {
      if (user) {
        hasHandled.current = true;
        toast.success(oauthWelcomeMessage(event ?? undefined, user.name));
        if (event === "created") {
          setWizardStep("details");
        } else {
          navigate("/", { replace: true });
        }
      } else {
        toast.error("Sign-in did not complete. Please try again.");
        navigate("/login", { replace: true });
      }
    }
    // toast not in deps here either, same reason as useToast
  }, [error, isLoading, user, event, navigate]);

  useEffect(() => {
    if (wizardStep) requestAnimationFrame(() => setEntered(true));
  }, [wizardStep]);

  async function handleDetailsSubmit(details: { firstName: string; lastName: string; username: string }) {
    await updateProfile({ name: `${details.firstName} ${details.lastName}`.trim(), username: details.username });
    setWizardStep("avatar");
  }

  if (!wizardStep) return <Spinner label="Finishing sign-in..." />;

  const [firstName, ...rest] = (user?.name ?? "").split(" ");

  return (
    <PageContainer className="max-w-md">
      <Card className={`transition-transform duration-300 ease-out ${entered ? "translate-x-0" : "translate-x-full"}`}>
        <CardHeader className="text-center">
          <h1 className="text-xl font-bold tracking-tight text-[var(--color-ink)]">
            {wizardStep === "details" ? "Make it yours" : "Pick an avatar"}
          </h1>
        </CardHeader>
        <CardBody>
          {wizardStep === "details" ? (
            <PickDetailsStep
              initialFirstName={firstName ?? ""}
              initialLastName={rest.join(" ")}
              initialUsername={user?.username ?? ""}
              onSubmit={handleDetailsSubmit}
            />
          ) : (
            <PickAvatarStep onDone={() => navigate("/", { replace: true })} />
          )}
        </CardBody>
      </Card>
    </PageContainer>
  );
}

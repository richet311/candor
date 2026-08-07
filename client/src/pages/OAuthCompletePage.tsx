import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { Spinner } from "../components/ui/Spinner";
import { oauthWelcomeMessage } from "../lib/oauthMessages";
import type { OAuthEvent } from "../lib/types";

export function OAuthCompletePage() {
  const [searchParams] = useSearchParams();
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const error = searchParams.get("error");
  const event = searchParams.get("event") as OAuthEvent | null;

  useEffect(() => {
    if (error) {
      toast.error(error);
      navigate("/login", { replace: true });
      return;
    }

    if (!isLoading) {
      if (user) {
        toast.success(oauthWelcomeMessage(event ?? undefined, user.name));
        navigate("/", { replace: true });
      } else {
        toast.error("Sign-in did not complete. Please try again.");
        navigate("/login", { replace: true });
      }
    }
    // toast not in deps here either, same reason as useToast
  }, [error, isLoading, user, event, navigate]);

  return <Spinner label="Finishing sign-in..." />;
}

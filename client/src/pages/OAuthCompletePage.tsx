import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { Spinner } from "../components/ui/Spinner";

export function OAuthCompletePage() {
  const [searchParams] = useSearchParams();
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const error = searchParams.get("error");

  useEffect(() => {
    if (error) {
      toast.error(error);
      navigate("/login", { replace: true });
      return;
    }

    if (!isLoading) {
      if (user) {
        toast.success(`Welcome, ${user.name}`);
        navigate("/", { replace: true });
      } else {
        toast.error("Sign-in did not complete. Please try again.");
        navigate("/login", { replace: true });
      }
    }
    // toast intentionally omitted: its wrapper identity changes every render,
    // but it always dispatches through the same stable ToastContext.push
  }, [error, isLoading, user, navigate]);

  return <Spinner label="Finishing sign-in..." />;
}

import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { PageContainer } from "../components/layout/PageContainer";
import { Card, CardBody } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Spinner } from "../components/ui/Spinner";
import { ApiError } from "../lib/api";
import { useAuth } from "../context/AuthContext";

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const { verifyEmail } = useAuth();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    if (!token) {
      setStatus("error");
      setMessage("This verification link is missing its token.");
      return;
    }

    verifyEmail(token)
      .then(() => setStatus("success"))
      .catch((err) => {
        setStatus("error");
        setMessage(err instanceof ApiError ? err.message : "This verification link is invalid or has expired.");
      });
  }, [token, verifyEmail]);

  return (
    <PageContainer className="max-w-md">
      <Card>
        <CardBody className="flex flex-col items-center gap-4 py-10 text-center">
          {status === "loading" && <Spinner label="Verifying your email" />}

          {status === "success" && (
            <>
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-success)]/10 text-2xl text-[var(--color-success)]">
                ✓
              </span>
              <h1 className="text-lg font-semibold text-[var(--color-ink)]">Email verified</h1>
              <p className="text-sm text-[var(--color-ink-soft)]">You're all set. You can now donate to any fund on Candor.</p>
              <Link to="/funds">
                <Button>Browse funds</Button>
              </Link>
            </>
          )}

          {status === "error" && (
            <>
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-danger)]/10 text-2xl text-[var(--color-danger)]">
                !
              </span>
              <h1 className="text-lg font-semibold text-[var(--color-ink)]">Couldn't verify your email</h1>
              <p className="text-sm text-[var(--color-ink-soft)]">{message}</p>
              <Link to="/login">
                <Button variant="ghost">Log in</Button>
              </Link>
            </>
          )}
        </CardBody>
      </Card>
    </PageContainer>
  );
}

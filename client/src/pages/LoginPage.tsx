import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { PageContainer } from "../components/layout/PageContainer";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { GoogleSignInButton } from "../components/GoogleSignInButton";

export function LoginPage() {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await login(email, password);
      navigate("/");
    } catch {
      // toast already shown by AuthContext
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
        <CardHeader>
          <h1 className="text-lg font-semibold text-[var(--color-ink)]">Log in</h1>
        </CardHeader>
        <CardBody className="flex flex-col gap-4">
          <GoogleSignInButton onCredential={handleGoogleCredential} />

          <div className="flex items-center gap-3 text-xs text-[var(--color-ink-soft)]">
            <div className="h-px flex-1 bg-[var(--color-border)]" />
            or with email
            <div className="h-px flex-1 bg-[var(--color-border)]" />
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            <Input
              label="Password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            <Button type="submit" isLoading={isSubmitting} className="w-full">
              Log in
            </Button>
          </form>

          <p className="text-center text-sm text-[var(--color-ink-soft)]">
            No account yet?{" "}
            <Link to="/register" className="font-medium text-[var(--color-navy)]">
              Sign up
            </Link>
          </p>
        </CardBody>
      </Card>
    </PageContainer>
  );
}

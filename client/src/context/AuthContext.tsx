import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { apiFetch, ApiError, setAccessToken, setUnauthorizedHandler } from "../lib/api";
import { createLogger } from "../lib/logger";
import { oauthWelcomeMessage } from "../lib/oauthMessages";
import { useToast } from "./ToastContext";
import type { OAuthEvent, User } from "../lib/types";

interface AuthResponse {
  user: User;
  accessToken: string;
  event?: OAuthEvent;
}

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  registerDonor: (input: { email: string; password: string; firstName: string; lastName: string; username: string }) => Promise<void>;
  registerOrganization: (input: {
    orgName: string;
    adminEmail: string;
    adminPassword: string;
    adminFirstName: string;
    adminLastName: string;
  }) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (input: { name?: string; avatarUrl?: string; bio?: string }) => Promise<void>;
  verifyEmail: (token: string) => Promise<User>;
  resendVerificationEmail: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const log = createLogger("auth");

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    setUnauthorizedHandler(() => {
      log.warn("session expired, clearing local user state");
      setUser(null);
      setAccessToken(null);
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      try {
        const res = await fetch(`${(import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:4000/api"}/auth/refresh`, {
          method: "POST",
          credentials: "include",
        });
        if (!res.ok) throw new Error("no active session");
        const data = (await res.json()) as AuthResponse;
        if (cancelled) return;
        setAccessToken(data.accessToken);
        setUser(data.user);
        log.info("restored session from refresh cookie", { userId: data.user.id });
      } catch {
        if (!cancelled) log.debug("no active session to restore");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void restoreSession();
    return () => {
      cancelled = true;
    };
  }, []);

  function applySession(data: AuthResponse) {
    setAccessToken(data.accessToken);
    setUser(data.user);
  }

  async function login(email: string, password: string) {
    try {
      const data = await apiFetch<AuthResponse>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
      applySession(data);
      toast.success(`Welcome back, ${data.user.name}`);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Could not sign in right now";
      toast.error(message, err);
      throw err;
    }
  }

  async function registerDonor(input: { email: string; password: string; firstName: string; lastName: string; username: string }) {
    try {
      const data = await apiFetch<AuthResponse>("/auth/register", { method: "POST", body: JSON.stringify(input) });
      applySession(data);
      toast.success(`Account created. Check your email to verify it, ${data.user.name}`);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Could not create your account right now";
      toast.error(message, err);
      throw err;
    }
  }

  async function registerOrganization(input: {
    orgName: string;
    adminEmail: string;
    adminPassword: string;
    adminFirstName: string;
    adminLastName: string;
  }) {
    try {
      const data = await apiFetch<AuthResponse>("/auth/register-organization", { method: "POST", body: JSON.stringify(input) });
      applySession(data);
      toast.success(`${input.orgName} is set up. Check your email to verify it, ${data.user.name}`);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Could not register your organization right now";
      toast.error(message, err);
      throw err;
    }
  }

  async function loginWithGoogle(idToken: string) {
    try {
      const data = await apiFetch<AuthResponse>("/auth/google", { method: "POST", body: JSON.stringify({ idToken }) });
      applySession(data);
      toast.success(oauthWelcomeMessage(data.event, data.user.name));
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Google sign-in failed";
      toast.error(message, err);
      throw err;
    }
  }

  async function updateProfile(input: { name?: string; avatarUrl?: string; bio?: string }) {
    try {
      const data = await apiFetch<{ user: User }>("/auth/me", { method: "PATCH", body: JSON.stringify(input) });
      setUser(data.user);
      toast.success("Profile updated");
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Could not update your profile";
      toast.error(message, err);
      throw err;
    }
  }

  async function verifyEmail(token: string) {
    const data = await apiFetch<{ user: User }>("/auth/verify-email", { method: "POST", body: JSON.stringify({ token }) });
    setUser((current) => (current && current.id === data.user.id ? data.user : current));
    return data.user;
  }

  async function resendVerificationEmail() {
    try {
      await apiFetch<void>("/auth/resend-verification", { method: "POST" });
      toast.success("Verification email sent, check your inbox");
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Could not resend the verification email";
      toast.error(message, err);
      throw err;
    }
  }

  async function logout() {
    try {
      await apiFetch<void>("/auth/logout", { method: "POST" });
    } catch (err) {
      log.warn("logout request failed, clearing local state anyway", err);
    } finally {
      setAccessToken(null);
      setUser(null);
      toast.info("Signed out");
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        registerDonor,
        registerOrganization,
        loginWithGoogle,
        logout,
        updateProfile,
        verifyEmail,
        resendVerificationEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}

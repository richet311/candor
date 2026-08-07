import { useEffect, useRef } from "react";
import { createLogger } from "../lib/logger";

const log = createLogger("google-signin");
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

export function GoogleSignInButton({ onCredential }: { onCredential: (idToken: string) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!CLIENT_ID) {
      log.warn("VITE_GOOGLE_CLIENT_ID is not set, Google sign-in is disabled");
      return;
    }

    if (!window.google || !containerRef.current) {
      log.warn("Google Identity Services script has not loaded yet");
      return;
    }

    window.google.accounts.id.initialize({
      client_id: CLIENT_ID,
      callback: (response) => {
        log.info("received Google credential");
        onCredential(response.credential);
      },
    });

    window.google.accounts.id.renderButton(containerRef.current, {
      theme: "outline",
      size: "large",
      width: containerRef.current.offsetWidth,
      text: "continue_with",
      shape: "pill",
    });
  }, [onCredential]);

  if (!CLIENT_ID) return null;

  return <div ref={containerRef} />;
}

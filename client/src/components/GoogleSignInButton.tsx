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

    const container = containerRef.current;

    window.google.accounts.id.initialize({
      client_id: CLIENT_ID,
      callback: (response) => {
        log.info("received Google credential");
        onCredential(response.credential);
      },
    });

    // Google's widget takes a fixed pixel width rather than sizing itself to its container, so
    // it has to be re-rendered whenever the container's own width changes to stay in sync with
    // the full-width GitHub button next to it, instead of drifting out of alignment on resize.
    function renderButton() {
      if (!container || container.offsetWidth === 0) return;
      container.replaceChildren();
      window.google!.accounts.id.renderButton(container, {
        theme: "outline",
        size: "large",
        width: container.offsetWidth,
        text: "continue_with",
        shape: "pill",
        logo_alignment: "center",
      });
    }

    renderButton();
    const observer = new ResizeObserver(() => renderButton());
    observer.observe(container);
    return () => observer.disconnect();
  }, [onCredential]);

  if (!CLIENT_ID) return null;

  return <div ref={containerRef} />;
}

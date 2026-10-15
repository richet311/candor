import { useEffect, useRef, useState } from "react";
import { createLogger } from "../lib/logger";

const log = createLogger("google-signin");
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

let scriptLoad: Promise<void> | null = null;
let credentialHandler: ((idToken: string) => void) | null = null;

// Fetched on demand rather than from index.html: it's ~100 KB that only the sign-in pages use, and
// waiting on this promise also covers the button mounting before the script has finished loading.
function loadGoogleIdentity(): Promise<void> {
  scriptLoad ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = () => {
      if (!window.google) {
        reject(new Error("Google Identity Services loaded without defining window.google"));
        return;
      }
      // Initialized once per page rather than per button mount (Google warns when it's initialized
      // again); the callback forwards to whichever button is currently mounted.
      window.google.accounts.id.initialize({
        client_id: CLIENT_ID!,
        callback: (response) => {
          log.info("received Google credential");
          credentialHandler?.(response.credential);
        },
      });
      resolve();
    };
    script.onerror = () => {
      script.remove();
      scriptLoad = null;
      reject(new Error("Google Identity Services script failed to load"));
    };
    document.head.appendChild(script);
  });
  return scriptLoad;
}

export function GoogleSignInButton({ onCredential }: { onCredential: (idToken: string) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isUnavailable, setIsUnavailable] = useState(false);

  // Kept apart from the rendering effect below, so a new callback identity (every keystroke on the
  // login form, every step of the signup wizard) doesn't tear down and rebuild Google's iframe.
  useEffect(() => {
    credentialHandler = onCredential;
    return () => {
      if (credentialHandler === onCredential) credentialHandler = null;
    };
  }, [onCredential]);

  useEffect(() => {
    if (!CLIENT_ID) {
      log.warn("VITE_GOOGLE_CLIENT_ID is not set, Google sign-in is disabled");
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;
    let observer: ResizeObserver | undefined;

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

    loadGoogleIdentity()
      .then(() => {
        if (cancelled) return;
        renderButton();
        observer = new ResizeObserver(() => renderButton());
        observer.observe(container);
      })
      .catch((err) => {
        // Commonly a content blocker. Email/password and GitHub still work without it.
        log.warn("Google sign-in is unavailable", err);
        if (!cancelled) setIsUnavailable(true);
      });

    return () => {
      cancelled = true;
      observer?.disconnect();
    };
  }, []);

  if (!CLIENT_ID || isUnavailable) return null;

  // min-h-10 holds the 40px the large button renders at while the script loads, so the rest of
  // the form doesn't jump down when it appears.
  return <div ref={containerRef} className="min-h-10" />;
}

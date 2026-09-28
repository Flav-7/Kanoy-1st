import { useEffect, useRef, useState } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth/AuthContext";
import { AppLogin } from "./AppLogin";
import { LockScreen } from "./LockScreen";
import { PinSetup } from "./PinSetup";

/**
 * Sits over the whole site. In the installed app: the team sign-in when
 * nobody is signed in, the lock screen while the session is locked, and the
 * code setup the first time (or right after "Recuperar código"); once the
 * person is in, the app goes to the calendar (the site is one tap away in the
 * account menu, "Ver site"). In a normal browser only the lock screen can
 * appear (a locked session inherited by Chrome on Android) and nothing
 * navigates. Everything else renders untouched.
 */
export function AppLockGate() {
  const { session, appMode, ready } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [setupRequested, setSetupRequested] = useState(false);
  const [setupDone, setSetupDone] = useState(false);
  const [skippedLogin, setSkippedLogin] = useState(false);

  const needsFirstCode = Boolean(
    appMode && session?.appSession && !session.hasPin && session.unlockMethods.includes("pin"),
  );
  const showSetup = Boolean(
    session && !session.locked && !setupDone && (setupRequested || needsFirstCode),
  );
  const inside = Boolean(session && !session.locked && !showSetup);

  // Signing in / unlocking the app lands on the calendar — but only on that
  // transition, and only from the home page, so "Ver site" isn't undone.
  const wasInside = useRef(false);
  useEffect(() => {
    if (appMode && ready && inside && !wasInside.current && pathname === "/") {
      void navigate({ to: "/calendario" });
    }
    wasInside.current = inside;
  }, [appMode, ready, inside, pathname, navigate]);

  if (!session) {
    // The installed app opens on the team sign-in, not the public site.
    return appMode && ready && !skippedLogin ? (
      <AppLogin onSkip={() => setSkippedLogin(true)} />
    ) : null;
  }
  if (session.locked) return <LockScreen onRecovered={() => setSetupRequested(true)} />;
  if (showSetup) {
    return (
      <PinSetup
        onDone={() => {
          setSetupRequested(false);
          setSetupDone(true);
        }}
      />
    );
  }
  return null;
}

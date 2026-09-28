import { useState } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { AppLogin } from "./AppLogin";
import { LockScreen } from "./LockScreen";
import { PinSetup } from "./PinSetup";

/**
 * Sits over the whole site. In the installed app: the team sign-in when
 * nobody is signed in, the lock screen while the session is locked, and the
 * code setup the first time (or right after "Recuperar código"). In a normal
 * browser only the lock screen can appear (a locked session inherited by
 * Chrome on Android). Everything else renders untouched.
 */
export function AppLockGate() {
  const { session, appMode, ready } = useAuth();
  const [setupRequested, setSetupRequested] = useState(false);
  const [setupDone, setSetupDone] = useState(false);
  const [skippedLogin, setSkippedLogin] = useState(false);

  if (!session) {
    // The installed app opens on the team sign-in, not the public site.
    return appMode && ready && !skippedLogin ? (
      <AppLogin onSkip={() => setSkippedLogin(true)} />
    ) : null;
  }
  if (session.locked) return <LockScreen onRecovered={() => setSetupRequested(true)} />;

  const needsFirstCode =
    appMode && session.appSession && !session.hasPin && session.unlockMethod !== "password";
  if (!setupDone && (setupRequested || needsFirstCode)) {
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

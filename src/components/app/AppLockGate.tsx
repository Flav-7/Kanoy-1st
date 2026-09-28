import { useState } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { LockScreen } from "./LockScreen";
import { PinSetup } from "./PinSetup";

/**
 * Sits over the whole site: the lock screen while an app session is locked,
 * and the code setup the first time the installed app is used (or right
 * after "Recuperar código"). Everything else renders untouched.
 */
export function AppLockGate() {
  const { session, appMode } = useAuth();
  const [setupRequested, setSetupRequested] = useState(false);
  const [setupDone, setSetupDone] = useState(false);

  if (!session) return null;
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

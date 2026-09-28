/**
 * The last person who used the installed app on this device (name + email
 * only, nothing secret), so the sign-in screen can greet them and prefill
 * the email even after their session ended — like a banking app.
 * "Usar outra conta" forgets it.
 */
export type RememberedUser = { name: string; email: string };

const KEY = "kanoy-app-user";

export function getRememberedUser(): RememberedUser | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    const value = raw ? (JSON.parse(raw) as Partial<RememberedUser>) : null;
    return value?.name && value.email ? { name: value.name, email: value.email } : null;
  } catch {
    return null;
  }
}

export function rememberUser(user: RememberedUser): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ name: user.name, email: user.email }));
  } catch {
    /* storage unavailable: just no greeting next time */
  }
}

export function forgetRememberedUser(): void {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* nothing to forget */
  }
}

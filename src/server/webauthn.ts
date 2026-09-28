import { installReflectMetadata } from "./reflect-metadata";

/**
 * @simplewebauthn/server pulls in @peculiar/x509 → tsyringe, which throws at
 * load time unless a Reflect metadata polyfill is already installed. Neither
 * a static nor a dynamic `import "reflect-metadata"` guarantees that in the
 * production bundle: the bundler folds the package into the library's own
 * chunk, which loads tsyringe before running it. So the polyfill is our own
 * code, installed by a function call right before the library is imported —
 * ordering a bundler can't change — and all of it stays off the path of
 * sessions and login.
 */
export async function loadWebAuthn() {
  installReflectMetadata();
  return import("@simplewebauthn/server");
}

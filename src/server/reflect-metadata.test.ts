import { describe, expect, it } from "vitest";
import { installReflectMetadata } from "./reflect-metadata";
import { loadWebAuthn } from "./webauthn";

type MetadataApi = {
  metadata(key: unknown, value: unknown): (target: object, prop?: string) => void;
  getMetadata(key: unknown, target: object, prop?: string): unknown;
  getOwnMetadata(key: unknown, target: object, prop?: string): unknown;
  hasMetadata(key: unknown, target: object, prop?: string): boolean;
};

describe("Reflect metadata polyfill", () => {
  it("stores metadata per target/property and inherits through prototypes", () => {
    installReflectMetadata();
    const R = Reflect as unknown as MetadataApi;
    class Base {}
    class Child extends Base {}
    R.metadata("design:paramtypes", [String])(Base);
    R.metadata("role", "x")(Base.prototype, "method");

    expect(R.getMetadata("design:paramtypes", Base)).toEqual([String]);
    expect(R.getMetadata("design:paramtypes", Child)).toEqual([String]); // inherited
    expect(R.getOwnMetadata("design:paramtypes", Child)).toBeUndefined();
    expect(R.getMetadata("role", Child.prototype, "method")).toBe("x");
    expect(R.hasMetadata("missing", Child)).toBe(false);
  });

  it("lets the WebAuthn library load", async () => {
    const lib = await loadWebAuthn();
    expect(typeof lib.generateRegistrationOptions).toBe("function");
  });
});

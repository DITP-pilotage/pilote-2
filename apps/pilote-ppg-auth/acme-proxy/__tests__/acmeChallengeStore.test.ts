import { beforeEach, describe, expect, it } from "vitest";
import { acmeChallengeStore } from "../acmeChallengeStore.ts";

describe("acmeChallengeStore", () => {
  beforeEach(() => {
    acmeChallengeStore.clear();
  });

  it("stocke et restitue une keyAuthorization pour un token donné", () => {
    acmeChallengeStore.set("abc123", "abc123.thumbprint");

    expect(acmeChallengeStore.get("abc123")).toEqual("abc123.thumbprint");
  });

  it("retourne undefined pour un token absent", () => {
    expect(acmeChallengeStore.get("inconnu")).toBeUndefined();
  });

  it("écrase la keyAuthorization existante quand le même token est setté à nouveau", () => {
    acmeChallengeStore.set("abc123", "ancienne-valeur");

    acmeChallengeStore.set("abc123", "nouvelle-valeur");

    expect(acmeChallengeStore.get("abc123")).toEqual("nouvelle-valeur");
  });

  it("supprime une entrée et retourne true quand le token existait", () => {
    acmeChallengeStore.set("abc123", "abc123.thumbprint");

    const deleted = acmeChallengeStore.delete("abc123");

    expect(deleted).toEqual(true);
    expect(acmeChallengeStore.get("abc123")).toBeUndefined();
  });

  it("retourne false en supprimant un token absent", () => {
    expect(acmeChallengeStore.delete("inconnu")).toEqual(false);
  });

  it("permet plusieurs tokens en parallèle", () => {
    acmeChallengeStore.set("token-a", "auth-a");
    acmeChallengeStore.set("token-b", "auth-b");

    expect(acmeChallengeStore.get("token-a")).toEqual("auth-a");
    expect(acmeChallengeStore.get("token-b")).toEqual("auth-b");
    expect(acmeChallengeStore.size()).toEqual(2);
  });

  it("vide intégralement le store via clear", () => {
    acmeChallengeStore.set("token-a", "auth-a");
    acmeChallengeStore.set("token-b", "auth-b");

    acmeChallengeStore.clear();

    expect(acmeChallengeStore.size()).toEqual(0);
  });
});

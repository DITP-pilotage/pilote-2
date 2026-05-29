import { acmeChallengeStore } from "@/server/infrastructure/acme/acmeChallengeStore";

describe("acmeChallengeStore", () => {
  beforeEach(() => {
    acmeChallengeStore.clear();
  });

  it("stocke et restitue une keyAuthorization pour un token donné", () => {
    // Given
    const token = "abc123";
    const keyAuthorization = "abc123.thumbprint";

    // When
    acmeChallengeStore.set(token, keyAuthorization);

    // Then
    expect(acmeChallengeStore.get(token)).toEqual(keyAuthorization);
  });

  it("retourne undefined pour un token absent", () => {
    // When
    const result = acmeChallengeStore.get("inconnu");

    // Then
    expect(result).toBeUndefined();
  });

  it("écrase la keyAuthorization existante quand le même token est setté à nouveau", () => {
    // Given
    const token = "abc123";
    acmeChallengeStore.set(token, "ancienne-valeur");

    // When
    // eslint-disable-next-line sonarjs/no-element-overwrite -- écrasement volontaire vérifié par le test
    acmeChallengeStore.set(token, "nouvelle-valeur");

    // Then
    expect(acmeChallengeStore.get(token)).toEqual("nouvelle-valeur");
  });

  it("supprime une entrée et retourne true quand le token existait", () => {
    // Given
    acmeChallengeStore.set("abc123", "abc123.thumbprint");

    // When
    const deleted = acmeChallengeStore.delete("abc123");

    // Then
    expect(deleted).toEqual(true);
    expect(acmeChallengeStore.get("abc123")).toBeUndefined();
  });

  it("retourne false en supprimant un token absent", () => {
    // When
    const deleted = acmeChallengeStore.delete("inconnu");

    // Then
    expect(deleted).toEqual(false);
  });

  it("permet plusieurs tokens en parallèle", () => {
    // Given
    acmeChallengeStore.set("token-a", "auth-a");
    acmeChallengeStore.set("token-b", "auth-b");

    // Then
    expect(acmeChallengeStore.get("token-a")).toEqual("auth-a");
    expect(acmeChallengeStore.get("token-b")).toEqual("auth-b");
    expect(acmeChallengeStore.size()).toEqual(2);
  });

  it("vide intégralement le store via clear", () => {
    // Given
    acmeChallengeStore.set("token-a", "auth-a");
    acmeChallengeStore.set("token-b", "auth-b");

    // When
    acmeChallengeStore.clear();

    // Then
    expect(acmeChallengeStore.size()).toEqual(0);
  });
});

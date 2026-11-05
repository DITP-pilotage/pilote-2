import { describe, expect, test } from "vitest";
import {
  formatPerson,
  isOnlyPersonReference,
  personReference,
  replacePersonReferences,
} from "@/shared/personne/personReference";

const ID = "0b3c1f2e-8a4d-4c6b-9e1f-2a3b4c5d6e7f";

const jeanne = {
  id: ID,
  prenom: "Jeanne",
  nom: "Martin",
  email: "jeanne.martin@modernisation.gouv.fr",
  service: null,
  fonction: null,
  estDesactive: false,
};

describe("personReference", () => {
  test("construit la référence citée par Albert", () => {
    expect(personReference(ID)).toBe(`@[personne:${ID}]`);
  });
});

describe("replacePersonReferences", () => {
  test("remplace chaque référence par son libellé", () => {
    expect(
      replacePersonReferences(
        `Par @[personne:${ID}] et @[personne:${ID}].`,
        () => "Jeanne Martin",
      ),
    ).toBe("Par Jeanne Martin et Jeanne Martin.");
  });

  test("reconnaît un id écrit en majuscules avec des tirets Unicode et le normalise", () => {
    const ids: string[] = [];
    replacePersonReferences(
      `@[personne:${ID.toUpperCase().replaceAll("-", "‑")}]`,
      (id) => {
        ids.push(id);
        return "";
      },
    );
    expect(ids).toEqual([ID]);
  });

  test("laisse intact un texte qui ressemble à une référence sans en être une", () => {
    const texte = `@[personne:123] [personne:${ID}] {{ personne("${ID}") }} @[chantier:${ID}]`;
    expect(replacePersonReferences(texte, () => "X")).toBe(texte);
  });
});

describe("isOnlyPersonReference", () => {
  test("renvoie l'id d'un texte qui n'est qu'une référence", () => {
    expect(isOnlyPersonReference(` @[personne:${ID}] `)).toBe(ID);
  });

  test("renvoie null pour un texte qui contient autre chose", () => {
    expect(isOnlyPersonReference(`voir @[personne:${ID}]`)).toBeNull();
  });
});

describe("formatPerson", () => {
  test("écrit le prénom et le nom", () => {
    expect(formatPerson(jeanne)).toBe("Jeanne Martin");
  });

  test("signale un compte désactivé", () => {
    expect(formatPerson({ ...jeanne, estDesactive: true })).toBe(
      "Jeanne Martin (désactivé)",
    );
  });

  test("écrit « une personne » pour une personne inconnue", () => {
    expect(formatPerson(null)).toBe("une personne");
    expect(formatPerson(undefined)).toBe("une personne");
  });
});

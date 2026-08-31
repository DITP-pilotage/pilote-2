import { chargerSchema } from "@/server/import-indicateur/infrastructure/adapters/validation-fichier/SchemaRepository";

describe("chargerSchema", () => {
  it("doit charger le schéma sans-contraintes.json et exposer ses champs et sa clé primaire", () => {
    const schema = chargerSchema("sans-contraintes.json");

    expect(schema.fields.map((champ) => champ.name)).toEqual([
      "identifiant_indic",
      "zone_id",
      "date_valeur",
      "type_valeur",
      "valeur",
    ]);
    expect(schema.primaryKey).toEqual([
      "identifiant_indic",
      "zone_id",
      "date_valeur",
      "type_valeur",
    ]);
  });

  it("doit lever une erreur quand le fichier de schéma n'existe pas", () => {
    expect(() => chargerSchema("inexistant.json")).toThrow();
  });
});

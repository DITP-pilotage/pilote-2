import {
  chargerSchemaBrut,
  SCHEMAS_AUTORISES,
} from "@/server/import-indicateur/infrastructure/adapters/validation-fichier/SchemaRepository";

describe("chargerSchemaBrut", () => {
  it.each(SCHEMAS_AUTORISES)(
    "charge %s avec ses champs et sa clé primaire",
    (nom) => {
      const schema = chargerSchemaBrut(nom);

      expect(schema.fields.map((champ) => champ.name)).toContain(
        "identifiant_indic",
      );
      expect(schema.primaryKey).toEqual([
        "identifiant_indic",
        "zone_id",
        "date_valeur",
        "type_valeur",
      ]);
    },
  );

  it("renvoie la même instance au second appel", () => {
    expect(chargerSchemaBrut("sans-contraintes.json")).toBe(
      chargerSchemaBrut("sans-contraintes.json"),
    );
  });

  it("refuse un nom hors liste blanche", () => {
    expect(() => chargerSchemaBrut("../../../etc/passwd")).toThrow(/inconnu/i);
  });
});

import { parseDimensionSlots } from "@/client/analytics/analytics";

describe("parseDimensionSlots", () => {
  it("lit la correspondance dimension → identifiant Matomo", () => {
    expect(
      parseDimensionSlots('{"profil_pilote":11,"conversation_id":12}'),
    ).toEqual({ profil_pilote: 11, conversation_id: 12 });
  });

  it.each([undefined, "", "pas du json", "[1,2]", "null", "3"])(
    "donne une correspondance vide pour %s",
    (raw) => {
      expect(parseDimensionSlots(raw)).toEqual({});
    },
  );

  it("ignore les clés hors schéma et les identifiants non entiers positifs", () => {
    expect(
      parseDimensionSlots(
        '{"profil_pilote":11,"inconnue":12,"llm_call_id":"3","nombre_choix":0,"position_choix":1.5}',
      ),
    ).toEqual({ profil_pilote: 11 });
  });
});

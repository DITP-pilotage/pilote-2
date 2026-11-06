import { filtreTerritoires } from "@/client/utils/territoire/filtreTerritoires";

describe("filtreTerritoires", () => {
  it("dédoublonne, trie par libellé et regroupe de la maille la plus large à la plus fine, sans groupe vide", () => {
    // Given
    const territoires = [
      { code: "DEPT-35", libelle: "Ille-et-Vilaine", maille: "DEPT" as const },
      { code: "NAT-FR", libelle: "France", maille: "NAT" as const },
      { code: "DEPT-29", libelle: "Finistère", maille: "DEPT" as const },
      { code: "DEPT-35", libelle: "Ille-et-Vilaine", maille: "DEPT" as const },
    ];

    // When
    const result = filtreTerritoires(territoires);

    // Then
    expect(result).toEqual({
      options: [
        { value: "DEPT-29", label: "Finistère" },
        { value: "NAT-FR", label: "France" },
        { value: "DEPT-35", label: "Ille-et-Vilaine" },
      ],
      groups: [
        { label: "National", values: ["NAT-FR"] },
        { label: "Départements", values: ["DEPT-29", "DEPT-35"] },
      ],
    });
  });
});

import type { $Enums } from "@prisma/client";
import { buildChantierUrl } from "@/components/_commons/ChatUI/buildChantierUrl";

describe("buildChantierUrl", () => {
  test("utilise le territoire et le jalon de la conversation", () => {
    // Given
    const maillesApplicables: $Enums.Maille[] = ["NAT", "REG"];
    const chantier = {
      id: "CH-050",
      nom: "Sécurité routière",
      maillesApplicables,
    };

    // When
    const url = buildChantierUrl({
      chantier,
      context: { territoireCode: "REG-11", jalon: 2025 },
    });

    // Then
    expect(url).toStrictEqual("/chantier/CH-050/REG-11?jalon=2025");
  });

  test("retombe sur le territoire national quand la maille n'est pas applicable", () => {
    // Given
    const maillesApplicables: $Enums.Maille[] = ["NAT"];
    const chantier = {
      id: "CH-050",
      nom: "Sécurité routière",
      maillesApplicables,
    };

    // When
    const url = buildChantierUrl({
      chantier,
      context: { territoireCode: "DEPT-75", jalon: 2025 },
    });

    // Then
    expect(url).toStrictEqual("/chantier/CH-050/NAT-FR?jalon=2025");
  });

  test("conserve le territoire de la conversation quand les mailles sont inconnues", () => {
    // Given
    const chantier = { id: "CH-050", nom: "Sécurité routière" };

    // When
    const url = buildChantierUrl({
      chantier,
      context: { territoireCode: "DEPT-75", jalon: 2025 },
    });

    // Then
    expect(url).toStrictEqual("/chantier/CH-050/DEPT-75?jalon=2025");
  });

  test("retombe sur le territoire national quand le context est vide", () => {
    // Given
    const chantier = { id: "CH-050", nom: "Sécurité routière" };

    // When
    const url = buildChantierUrl({ chantier, context: {} });

    // Then
    expect(url).toStrictEqual("/chantier/CH-050/NAT-FR");
  });
});

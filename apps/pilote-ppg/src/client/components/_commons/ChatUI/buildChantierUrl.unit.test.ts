import { buildChantierUrl } from "@/components/_commons/ChatUI/buildChantierUrl";

describe("buildChantierUrl", () => {
  test("utilise le territoire et le jalon de la conversation", () => {
    // When
    const url = buildChantierUrl({
      chantierId: "CH-050",
      context: { territoireCode: "REG-11", jalon: 2025 },
    });

    // Then
    expect(url).toStrictEqual("/chantier/CH-050/REG-11?jalon=2025");
  });

  test("retombe sur le territoire national sans territoire de contexte", () => {
    // When
    const url = buildChantierUrl({
      chantierId: "CH-050",
      context: { jalon: 2025 },
    });

    // Then
    expect(url).toStrictEqual("/chantier/CH-050/NAT-FR?jalon=2025");
  });

  test("omet le jalon quand le contexte n'en porte pas", () => {
    // When
    const url = buildChantierUrl({ chantierId: "CH-050", context: {} });

    // Then
    expect(url).toStrictEqual("/chantier/CH-050/NAT-FR");
  });
});

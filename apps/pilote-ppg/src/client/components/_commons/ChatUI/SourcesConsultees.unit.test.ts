import { estSourcePart } from "@/components/_commons/ChatUI/SourcesConsultees";
import type { PiloteUIMessage } from "@/server/albert/PiloteUIMessage";

type Part = NonNullable<PiloteUIMessage["parts"]>[number];

describe("estSourcePart", () => {
  test("affiche l'appel à get_indicateurs_non_a_jour comme une source consultée", () => {
    // Given
    const part = {
      type: "tool-get_indicateurs_non_a_jour",
      toolCallId: "appel-1",
      state: "input-available",
      input: { indicateur_ids: ["IND-894"] },
    } as Part;

    // When
    const estSource = estSourcePart(part);

    // Then
    expect(estSource).toBe(true);
  });
});

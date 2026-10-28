import { formaterDateRedaction } from "@/components/_commons/ChatUI/dateRedaction";

describe("formaterDateRedaction", () => {
  test("écrit la date dans le fuseau du lecteur, pas en UTC", () => {
    // Given — 23 h 30 UTC le 27, déjà le 28 à Paris
    const dateRedaction = "2026-10-27T23:30:00.000Z";

    // When
    const date = formaterDateRedaction({
      dateRedaction,
      timeZone: "Europe/Paris",
    });

    // Then
    expect(date).toEqual("28 octobre 2026");
  });
});

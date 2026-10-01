import { couleur } from "@/server/pdf/tokens";
import { mm, px, rem } from "@/server/pdf/unites";

describe("couleur", () => {
  it("lit les couleurs de la configuration Tailwind", () => {
    expect(couleur("primary")).toBe("#000091");
    expect(couleur("dsfr-blue-france-925")).toBe("#E3E3FD");
  });

  it("connaît le blanc et le noir", () => {
    expect(couleur("white")).toBe("#FFFFFF");
    expect(couleur("black")).toBe("#000000");
  });

  it("refuse une couleur inconnue", () => {
    expect(() => couleur("inconnue")).toThrow("inconnue");
  });
});

describe("unités", () => {
  it("convertit les pixels CSS, rem et millimètres en points", () => {
    expect(px(16)).toBe(12);
    expect(rem(1)).toBe(12);
    expect(mm(25.4)).toBe(72);
  });
});

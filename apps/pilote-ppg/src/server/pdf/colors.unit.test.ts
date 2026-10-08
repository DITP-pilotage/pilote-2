import { color } from "@/server/pdf/colors";
import { mm, px, rem } from "@/server/pdf/units";

describe("couleur", () => {
  it("lit les couleurs de la configuration Tailwind", () => {
    expect(color("primary")).toBe("#000091");
    expect(color("dsfr-blue-france-925")).toBe("#E3E3FD");
  });

  it("connaît le blanc et le noir", () => {
    expect(color("white")).toBe("#FFFFFF");
    expect(color("black")).toBe("#000000");
  });

  it("refuse une couleur inconnue", () => {
    expect(() => color("inconnue")).toThrow("inconnue");
  });
});

describe("unités", () => {
  it("convertit les pixels CSS, rem et millimètres en points", () => {
    expect(px(16)).toBe(12);
    expect(rem(1)).toBe(12);
    expect(mm(25.4)).toBe(72);
  });
});

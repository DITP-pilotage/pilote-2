import { getContainer } from "@/server/dependances";

describe("PrismaHabilitationService", () => {
  it("should return the habilitations", async () => {
    const prismaHabilitationService = getContainer(
      "gestionUtilisateur",
    ).resolve("habilitationService");

    const habilitations =
      await prismaHabilitationService.recupererHabilitations({
        user: { id: "1" },
      });
    expect(habilitations).toBeDefined();
  });
});

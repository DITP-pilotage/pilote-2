import { PrismaClient } from "@prisma/client";
import { PrismaNouveauteRepository } from "@/server/parametrage-nouveautes/infrastructure/adapters/PrismaNouveauteRepository";
import { Nouveaute } from "@/server/parametrage-nouveautes/domain/Nouveaute";
import { PrismaPilote } from "@/server/db/PrismaPilote";

describe("PrismaNouveauteRepository", () => {
  let prismaNouveauteRepository: PrismaNouveauteRepository;
  let prisma: PrismaClient;

  beforeEach(() => {
    const prismaPilote = new PrismaPilote();
    prisma = prismaPilote.getInstance();

    prismaNouveauteRepository = new PrismaNouveauteRepository({
      prisma: prismaPilote,
    });
  });

  it("Doit enregistrer une nouveauté", async () => {
    // Given
    const date = new Date().toISOString();
    const nouveaute = Nouveaute.creerNouveaute({
      contenu: "Nouvelle nouveauté",
      version: "1.0.0",
      date,
    });

    // When
    await prismaNouveauteRepository.creerNouveaute(nouveaute);

    // Then
    const nouveautes = await prisma.nouveaute.findMany();
    expect(nouveautes).toHaveLength(1);
    expect(nouveautes[0].contenu).toBe("Nouvelle nouveauté");
    expect(nouveautes[0].version).toBe("1.0.0");
    expect(nouveautes[0].date).toBe(date);
  });

  it("Doit lister les nouveautés", async () => {
    // Given
    const date = new Date().toISOString();
    const nouveaute = Nouveaute.creerNouveaute({
      contenu: "Nouvelle nouveauté",
      version: "1.0.0",
      date,
    });
    await prismaNouveauteRepository.creerNouveaute(nouveaute);

    const date2 = new Date().toISOString();
    const nouveaute2 = Nouveaute.creerNouveaute({
      contenu: "Nouvelle nouveauté 2",
      version: "1.0.1",
      date: date2,
    });
    await prismaNouveauteRepository.creerNouveaute(nouveaute2);

    // When
    const nouveautes = await prismaNouveauteRepository.listerNouveautes();

    // Then
    expect(nouveautes).toHaveLength(2);
    expect(nouveautes[0].contenu).toBe("Nouvelle nouveauté 2");
    expect(nouveautes[0].version).toBe("1.0.1");
    expect(nouveautes[0].date).toBe(date2);
    expect(nouveautes[1].contenu).toBe("Nouvelle nouveauté");
    expect(nouveautes[1].version).toBe("1.0.0");
    expect(nouveautes[1].date).toBe(date);
  });

  it("Doit modifier une nouveauté", async () => {
    // Given
    const date = new Date().toISOString();
    const nouveaute = Nouveaute.creerNouveaute({
      contenu: "Nouvelle nouveauté",
      version: "1.0.0",
      date,
    });
    await prismaNouveauteRepository.creerNouveaute(nouveaute);

    // When
    const nouveauteModifiée = Nouveaute.creerNouveaute({
      id: nouveaute.id,
      contenu: "Nouvelle nouveauté modifiée",
      version: "1.0.1",
      date: date,
    });
    await prismaNouveauteRepository.modifier(nouveauteModifiée);

    // Then
    const nouveautes = await prisma.nouveaute.findMany();
    expect(nouveautes).toHaveLength(1);
    expect(nouveautes[0].contenu).toBe("Nouvelle nouveauté modifiée");
    expect(nouveautes[0].version).toBe("1.0.1");
    expect(nouveautes[0].date).toBe(date);
  });
});

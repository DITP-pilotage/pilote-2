import { mock, MockProxy } from "vitest-mock-extended";
import { DonneeIndicateurBuilder } from "@/server/chantiers/app/builder/DonneeIndicateurBuilder";
import { IndicateurRepository } from "@/server/chantiers/domain/ports/IndicateurRepository";
import { ListerDonneesIndicateurParIndicIdUseCase } from "@/server/chantiers/usecases/ListerDonneesIndicateurParIndicIdUseCase";

describe("ListerDonneesIndicateurParIndicIdUseCase", () => {
  let listerDonneesIndicateurParIndicIdUseCase: ListerDonneesIndicateurParIndicIdUseCase;
  let indicateurRepository: MockProxy<IndicateurRepository>;

  beforeEach(() => {
    indicateurRepository = mock<IndicateurRepository>();
    listerDonneesIndicateurParIndicIdUseCase =
      new ListerDonneesIndicateurParIndicIdUseCase({ indicateurRepository });
  });

  it("doit lister les donnees associés à l'indicateur demandé", async () => {
    // Given
    const indicId = "IND-001";
    const donneeIndicateur1 = new DonneeIndicateurBuilder()
      .withIndicId("IND-002")
      .withMaille("DEPT")
      .withCodeInsee("02")
      .withZoneId("D75")
      .withValeurInitiale(20.2)
      .withDateValeurInitiale(new Date("2025-06-12"))
      .withValeurAvancement(27.8)
      .withDateValeurAvancement(new Date("2025-06-12"))
      .withValeurCible(30.1)
      .withDateValeurCible(new Date("2025-06-12"))
      .withTauxAvancement(31.1)
      .withEstBarometre(false)
      .build();
    const donneeIndicateur2 = new DonneeIndicateurBuilder()
      .withIndicId("IND-002")
      .withMaille("REG")
      .withCodeInsee("01")
      .withZoneId("D75")
      .withValeurInitiale(21.2)
      .withDateValeurInitiale(new Date("2026-06-12"))
      .withValeurAvancement(28.8)
      .withDateValeurAvancement(new Date("2026-06-12"))
      .withValeurCible(40.1)
      .withDateValeurCible(new Date("2026-06-12"))
      .withTauxAvancement(41.1)
      .withEstBarometre(false)
      .build();

    indicateurRepository.listerParIndicId.mockResolvedValue([
      donneeIndicateur1,
      donneeIndicateur2,
    ]);

    const jalon = 2024;

    // When
    const listeDonneesIndicateurs =
      await listerDonneesIndicateurParIndicIdUseCase.run({ indicId, jalon });

    // Then
    expect(listeDonneesIndicateurs).toHaveLength(2);
    expect(listeDonneesIndicateurs.at(0)?.indicId).toEqual("IND-002");
    expect(listeDonneesIndicateurs.at(0)?.maille).toEqual("DEPT");
    expect(listeDonneesIndicateurs.at(0)?.codeInsee).toEqual("02");
    expect(listeDonneesIndicateurs.at(0)?.zoneId).toEqual("D75");
    expect(listeDonneesIndicateurs.at(0)?.valeurInitiale).toEqual(20.2);
    expect(
      listeDonneesIndicateurs.at(0)?.dateValeurInitiale?.toISOString(),
    ).toContain("2025-06-12");
    expect(listeDonneesIndicateurs.at(0)?.valeurAvancement).toEqual(27.8);
    expect(
      listeDonneesIndicateurs.at(0)?.dateValeurAvancement?.toISOString(),
    ).toContain("2025-06-12");
    expect(listeDonneesIndicateurs.at(0)?.valeurCible).toEqual(30.1);
    expect(
      listeDonneesIndicateurs.at(0)?.dateValeurCible?.toISOString(),
    ).toContain("2025-06-12");
    expect(listeDonneesIndicateurs.at(0)?.tauxAvancement).toEqual(31.1);
    expect(listeDonneesIndicateurs.at(0)?.estBarometre).toEqual(false);

    expect(listeDonneesIndicateurs.at(1)?.indicId).toEqual("IND-002");
    expect(listeDonneesIndicateurs.at(1)?.maille).toEqual("REG");
    expect(listeDonneesIndicateurs.at(1)?.codeInsee).toEqual("01");
    expect(listeDonneesIndicateurs.at(1)?.zoneId).toEqual("D75");
    expect(listeDonneesIndicateurs.at(1)?.valeurInitiale).toEqual(21.2);
    expect(
      listeDonneesIndicateurs.at(1)?.dateValeurInitiale?.toISOString(),
    ).toContain("2026-06-12");
    expect(listeDonneesIndicateurs.at(1)?.valeurAvancement).toEqual(28.8);
    expect(
      listeDonneesIndicateurs.at(1)?.dateValeurAvancement?.toISOString(),
    ).toContain("2026-06-12");
    expect(listeDonneesIndicateurs.at(1)?.valeurCible).toEqual(40.1);
    expect(
      listeDonneesIndicateurs.at(1)?.dateValeurCible?.toISOString(),
    ).toContain("2026-06-12");
    expect(listeDonneesIndicateurs.at(1)?.tauxAvancement).toEqual(41.1);
    expect(listeDonneesIndicateurs.at(1)?.estBarometre).toEqual(false);
  });
});

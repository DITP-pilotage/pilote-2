import { mock, MockProxy } from "vitest-mock-extended";
import { TerritoireRepository } from "@/server/fiche-territoriale/domain/ports/TerritoireRepository";
import { TerritoireBuilder } from "@/server/fiche-territoriale/app/builders/TerritoireBuilder";
import { ChantierBuilder } from "@/server/fiche-territoriale/app/builders/ChantierBuilder";
import { ChantierRepository } from "@/server/fiche-territoriale/domain/ports/ChantierRepository";
import { RécupérerTauxAvancementTerritoireUseCase } from "@/server/fiche-territoriale/usecases/RécupérerTauxAvancementTerritoireUseCase";

describe("RécupérerTauxAvancementAnnuelTerritoireUseCase", () => {
  let chantierRepository: MockProxy<ChantierRepository>;
  let territoireRepository: MockProxy<TerritoireRepository>;
  let récupérerTauxAvancementAnnuelTerritoireUseCase: RécupérerTauxAvancementTerritoireUseCase;

  beforeEach(() => {
    chantierRepository = mock<ChantierRepository>();
    territoireRepository = mock<TerritoireRepository>();
    récupérerTauxAvancementAnnuelTerritoireUseCase =
      new RécupérerTauxAvancementTerritoireUseCase({
        chantierRepository,
        territoireRepository,
      });
  });
  test("quand le territoire est un departement, doit récupérer la liste des taux d'avancements annuel de ses chantiers", async () => {
    // Given
    const territoireCode = "UN-CODE";
    const territoire = new TerritoireBuilder().withMaille("DEPT").build();

    const chantier1 = new ChantierBuilder().withTauxAvancement(null).build();
    const chantier2 = new ChantierBuilder().withTauxAvancement(3).build();
    const chantier3 = new ChantierBuilder().withTauxAvancement(4).build();

    territoireRepository.recupererTerritoireParCode.mockResolvedValue(
      territoire,
    );
    chantierRepository.listerParTerritoireCodePourEtMaille.mockResolvedValue([
      chantier1,
      chantier2,
      chantier3,
    ]);

    const jalon = 2024;

    // When
    const result = await récupérerTauxAvancementAnnuelTerritoireUseCase.run({
      territoireCode,
      jalon,
    });

    // Then
    expect(
      territoireRepository.recupererTerritoireParCode,
    ).toHaveBeenNthCalledWith(1, { territoireCode });
    expect(
      chantierRepository.listerParTerritoireCodePourEtMaille,
    ).toHaveBeenNthCalledWith(1, { territoireCode, maille: "DEPT", jalon });
    expect(result).toHaveLength(3);
    expect(result).toStrictEqual([null, 3, 4]);
  });

  test("quand le territoire est une région, doit récupérer la liste des taux d'avancements annuel de ses chantiers", async () => {
    // Given
    const territoireCode = "UN-CODE";
    const territoire = new TerritoireBuilder().withMaille("REG").build();

    const chantier1 = new ChantierBuilder().withTauxAvancement(null).build();
    const chantier2 = new ChantierBuilder().withTauxAvancement(5).build();
    const chantier3 = new ChantierBuilder().withTauxAvancement(6).build();

    territoireRepository.recupererTerritoireParCode.mockResolvedValue(
      territoire,
    );
    chantierRepository.listerParTerritoireCodePourEtMaille.mockResolvedValue([
      chantier1,
      chantier2,
      chantier3,
    ]);

    const jalon = 2024;

    // When
    const result = await récupérerTauxAvancementAnnuelTerritoireUseCase.run({
      territoireCode,
      jalon,
    });

    // Then
    expect(
      territoireRepository.recupererTerritoireParCode,
    ).toHaveBeenNthCalledWith(1, { territoireCode });
    expect(
      chantierRepository.listerParTerritoireCodePourEtMaille,
    ).toHaveBeenNthCalledWith(1, { territoireCode, maille: "REG", jalon });
    expect(result).toHaveLength(3);
    expect(result).toStrictEqual([null, 5, 6]);
  });

  test("quand le territoire est de maille nationale, doit récupérer aucun chantier", async () => {
    // Given
    const territoireCode = "UN-CODE";
    const territoire = new TerritoireBuilder().withMaille("NAT").build();

    const chantier1 = new ChantierBuilder().withTauxAvancement(null).build();
    const chantier2 = new ChantierBuilder().withTauxAvancement(7).build();
    const chantier3 = new ChantierBuilder().withTauxAvancement(8).build();

    territoireRepository.recupererTerritoireParCode.mockResolvedValue(
      territoire,
    );
    chantierRepository.listerParTerritoireCodePourUneRegion.mockResolvedValue([
      chantier1,
      chantier2,
      chantier3,
    ]);

    const jalon = 2024;

    // When
    const result = await récupérerTauxAvancementAnnuelTerritoireUseCase.run({
      territoireCode,
      jalon,
    });

    // Then
    expect(
      territoireRepository.recupererTerritoireParCode,
    ).toHaveBeenNthCalledWith(1, { territoireCode });
    expect(result).toHaveLength(0);
    expect(result).toStrictEqual([]);
  });
});

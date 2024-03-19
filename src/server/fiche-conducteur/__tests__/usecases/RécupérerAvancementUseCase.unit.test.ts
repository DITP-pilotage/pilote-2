import { mock, MockProxy } from 'jest-mock-extended';
import { ChantierBuilder } from '@/server/fiche-conducteur/app/builders/ChantierBuilder';
import { ChantierRepository } from '@/server/fiche-conducteur/domain/ports/ChantierRepository';
import { RécupérerAvancementUseCase } from '@/server/fiche-conducteur/usecases/RécupérerAvancementUseCase';

describe('RécupérerAvancementUseCase', () => {
  let récupérerAvancementUseCase: RécupérerAvancementUseCase;
  let chantierRepository: MockProxy<ChantierRepository>;

  beforeEach(() => {
    chantierRepository = mock<ChantierRepository>();
    récupérerAvancementUseCase = new RécupérerAvancementUseCase({ chantierRepository });
  });

  it("lorsqu'on a un nombre impair de chantier, doit récupérer le taux d'avancement global et intermédiaire", async () => {
    // Given
    let chantierId = 'CH-168';
    const chantier1 = new ChantierBuilder().withId('CH-168').withTauxAvancement(42).withMaille('DEPT').build();
    const chantier2 = new ChantierBuilder().withId('CH-168').withTauxAvancement(40).withMaille('DEPT').build();
    const chantier3 = new ChantierBuilder().withId('CH-168').withTauxAvancement(60).withMaille('DEPT').build();
    const chantier4 = new ChantierBuilder().withId('CH-168').withTauxAvancement(55).withMaille('DEPT').build();
    const chantier5 = new ChantierBuilder().withId('CH-168').withTauxAvancement(59).withMaille('DEPT').build();
    const chantierNat = new ChantierBuilder().withId('CH-168').withTauxAvancement(20).withTauxAvancementAnnuel(10).withMaille('NAT').build();
    chantierRepository.récupérerMailleNatEtDeptParId.mockResolvedValue([chantier1, chantier2, chantier3, chantier4, chantier5, chantierNat]);

    // When
    const avancement = await récupérerAvancementUseCase.run({ chantierId });
    
    // Then
    expect(avancement.global).toEqual(20);
    expect(avancement.annuel).toEqual(10);
  });

  it("lorsqu'on a un nombre impair de chantier, doit récupérer l'avancement nationale", async () => {
    // Given
    let chantierId = 'CH-168';
    const chantier1 = new ChantierBuilder().withId('CH-168').withTauxAvancement(42).withMaille('DEPT').build();
    const chantier2 = new ChantierBuilder().withId('CH-168').withTauxAvancement(40).withMaille('DEPT').build();
    const chantier3 = new ChantierBuilder().withId('CH-168').withTauxAvancement(60).withMaille('DEPT').build();
    const chantier4 = new ChantierBuilder().withId('CH-168').withTauxAvancement(55).withMaille('DEPT').build();
    const chantier5 = new ChantierBuilder().withId('CH-168').withTauxAvancement(59).withMaille('DEPT').build();
    const chantierNat = new ChantierBuilder().withId('CH-168').withTauxAvancement(20).withMaille('NAT').build();
    chantierRepository.récupérerMailleNatEtDeptParId.mockResolvedValue([chantier1, chantier2, chantier3, chantier4, chantier5, chantierNat]);

    // When
    const avancement = await récupérerAvancementUseCase.run({ chantierId });

    // Then
    expect(avancement.minimum).toEqual(40);
    expect(avancement.mediane).toEqual(55);
    expect(avancement.maximum).toEqual(60);
  });

  it("lorsqu'on a un nombre pair de chantier, doit récupérer l'avancement nationale", async () => {
    // Given
    let chantierId = 'CH-168';
    const chantier1 = new ChantierBuilder().withId('CH-168').withTauxAvancement(42).withMaille('DEPT').build();
    const chantier2 = new ChantierBuilder().withId('CH-168').withTauxAvancement(40).withMaille('DEPT').build();
    const chantier3 = new ChantierBuilder().withId('CH-168').withTauxAvancement(60).withMaille('DEPT').build();
    const chantier4 = new ChantierBuilder().withId('CH-168').withTauxAvancement(55).withMaille('DEPT').build();
    const chantierNat = new ChantierBuilder().withId('CH-168').withTauxAvancement(20).withMaille('NAT').build();
    chantierRepository.récupérerMailleNatEtDeptParId.mockResolvedValue([chantier1, chantier2, chantier3, chantier4, chantierNat]);

    // When
    const avancement = await récupérerAvancementUseCase.run({ chantierId });

    // Then
    expect(avancement.minimum).toEqual(40);
    expect(avancement.mediane).toEqual(48.5);
    expect(avancement.maximum).toEqual(60);
  });

  it("lorsqu'on a des taux d'avancement null, doit récupérer l'avancement nationale", async () => {
    // Given
    let chantierId = 'CH-168';
    const chantier1 = new ChantierBuilder().withId('CH-168').withTauxAvancement(42).withMaille('DEPT').build();
    const chantier2 = new ChantierBuilder().withId('CH-168').withTauxAvancement(40).withMaille('DEPT').build();
    const chantier3 = new ChantierBuilder().withId('CH-168').withTauxAvancement(60).withMaille('DEPT').build();
    const chantier4 = new ChantierBuilder().withId('CH-168').withTauxAvancement(55).withMaille('DEPT').build();
    const chantier5 = new ChantierBuilder().withId('CH-168').withTauxAvancement(null).withMaille('DEPT').build();
    const chantierNat = new ChantierBuilder().withId('CH-168').withTauxAvancement(20).withMaille('NAT').build();
    chantierRepository.récupérerMailleNatEtDeptParId.mockResolvedValue([chantier1, chantier2, chantier3, chantier4, chantier5, chantierNat]);

    // When
    const avancement = await récupérerAvancementUseCase.run({ chantierId });

    // Then
    expect(avancement.minimum).toEqual(40);
    expect(avancement.mediane).toEqual(48.5);
    expect(avancement.maximum).toEqual(60);
  });

  it("lorsque tous les taux d'avancement sont null, doit récupérer l'avancement nationale", async () => {
    // Given
    let chantierId = 'CH-168';
    const chantier1 = new ChantierBuilder().withId('CH-168').withTauxAvancement(null).withMaille('DEPT').build();
    const chantier2 = new ChantierBuilder().withId('CH-168').withTauxAvancement(null).withMaille('DEPT').build();
    const chantier3 = new ChantierBuilder().withId('CH-168').withTauxAvancement(null).withMaille('DEPT').build();
    const chantier4 = new ChantierBuilder().withId('CH-168').withTauxAvancement(null).withMaille('DEPT').build();
    const chantier5 = new ChantierBuilder().withId('CH-168').withTauxAvancement(null).withMaille('DEPT').build();
    const chantierNat = new ChantierBuilder().withId('CH-168').withTauxAvancement(null).withMaille('NAT').build();
    chantierRepository.récupérerMailleNatEtDeptParId.mockResolvedValue([chantier1, chantier2, chantier3, chantier4, chantier5, chantierNat]);

    // When
    const avancement = await récupérerAvancementUseCase.run({ chantierId });

    // Then
    expect(avancement.global).toEqual(null);
    expect(avancement.minimum).toEqual(null);
    expect(avancement.mediane).toEqual(null);
    expect(avancement.maximum).toEqual(null);
  });
});

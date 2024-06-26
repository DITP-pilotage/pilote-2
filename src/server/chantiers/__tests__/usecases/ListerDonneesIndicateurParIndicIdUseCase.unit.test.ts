import { mock, MockProxy } from 'jest-mock-extended';
import { DonneeIndicateurBuilder } from '@/server/chantiers/app/builder/DonneeIndicateurBuilder';
import { IndicateurRepository } from '@/server/chantiers/domain/ports/IndicateurRepository';
import {
  ListerDonneesIndicateurParIndicIdUseCase,
} from '@/server/chantiers/usecases/ListerDonneesIndicateurParIndicIdUseCase';

describe('ListerDonneesIndicateurParIndicIdUseCase', () => {
  let listerDonneesIndicateurParIndicIdUseCase: ListerDonneesIndicateurParIndicIdUseCase;
  let indicateurRepository: MockProxy<IndicateurRepository>;

  beforeEach(() => {
    indicateurRepository = mock<IndicateurRepository>();
    listerDonneesIndicateurParIndicIdUseCase = new ListerDonneesIndicateurParIndicIdUseCase({ indicateurRepository });
  });

  it("doit lister les donnees associés à l'indicateur demandé", async () => {
    // Given
    const indicId = 'IND-001';
    const donneeIndicateur1 = new DonneeIndicateurBuilder()
      .withIndicId('IND-002')
      .withMaille('DEPT')
      .withCodeInsee('02')
      .withZoneId('D75')
      .withValeurInitiale(20.2)
      .withDateValeurInitiale(new Date('2025-06-12'))
      .withValeurActuelle(27.8)
      .withDateValeurActuelle(new Date('2025-06-12'))
      .withValeurCibleAnnuelle(30.1)
      .withDateValeurCibleAnnuelle(new Date('2025-06-12'))
      .withTauxAvancementAnnuel(31.1)
      .withValeurCibleGlobale(32.1)
      .withDateValeurCibleGlobale(new Date('2025-06-12'))
      .withTauxAvancementGlobale(33.1)
      .withEstBarometre(false)
      .build();
    const donneeIndicateur2 = new DonneeIndicateurBuilder()
      .withIndicId('IND-002')
      .withMaille('REG')
      .withCodeInsee('01')
      .withZoneId('D75')
      .withValeurInitiale(21.2)
      .withDateValeurInitiale(new Date('2026-06-12'))
      .withValeurActuelle(28.8)
      .withDateValeurActuelle(new Date('2026-06-12'))
      .withValeurCibleAnnuelle(40.1)
      .withDateValeurCibleAnnuelle(new Date('2026-06-12'))
      .withTauxAvancementAnnuel(41.1)
      .withValeurCibleGlobale(42.1)
      .withDateValeurCibleGlobale(new Date('2026-06-12'))
      .withTauxAvancementGlobale(43.1)
      .withEstBarometre(false)
      .build();

    indicateurRepository.listerParIndicId.mockResolvedValue([donneeIndicateur1, donneeIndicateur2]);

    // When
    const listeDonneesIndicateurs = await listerDonneesIndicateurParIndicIdUseCase.run({ indicId });

    // Then
    expect(listeDonneesIndicateurs).toHaveLength(2);
    expect(listeDonneesIndicateurs.at(0)?.indicId).toEqual('IND-002');
    expect(listeDonneesIndicateurs.at(0)?.maille).toEqual('DEPT');
    expect(listeDonneesIndicateurs.at(0)?.codeInsee).toEqual('02');
    expect(listeDonneesIndicateurs.at(0)?.zoneId).toEqual('D75');
    expect(listeDonneesIndicateurs.at(0)?.valeurInitiale).toEqual(20.2);
    expect(listeDonneesIndicateurs.at(0)?.dateValeurInitiale?.toISOString()).toContain('2025-06-12');
    expect(listeDonneesIndicateurs.at(0)?.valeurActuelle).toEqual(27.8);
    expect(listeDonneesIndicateurs.at(0)?.dateValeurActuelle?.toISOString()).toContain('2025-06-12');
    expect(listeDonneesIndicateurs.at(0)?.valeurCibleAnnuelle).toEqual(30.1);
    expect(listeDonneesIndicateurs.at(0)?.dateValeurCibleAnnuelle?.toISOString()).toContain('2025-06-12');
    expect(listeDonneesIndicateurs.at(0)?.tauxAvancementAnnuel).toEqual(31.1);
    expect(listeDonneesIndicateurs.at(0)?.valeurCibleGlobale).toEqual(32.1);
    expect(listeDonneesIndicateurs.at(0)?.dateValeurCibleGlobale?.toISOString()).toContain('2025-06-12');
    expect(listeDonneesIndicateurs.at(0)?.tauxAvancementGlobale).toEqual(33.1);
    expect(listeDonneesIndicateurs.at(0)?.estBarometre).toEqual(false);

    expect(listeDonneesIndicateurs.at(1)?.indicId).toEqual('IND-002');
    expect(listeDonneesIndicateurs.at(1)?.maille).toEqual('REG');
    expect(listeDonneesIndicateurs.at(1)?.codeInsee).toEqual('01');
    expect(listeDonneesIndicateurs.at(1)?.zoneId).toEqual('D75');
    expect(listeDonneesIndicateurs.at(1)?.valeurInitiale).toEqual(21.2);
    expect(listeDonneesIndicateurs.at(1)?.dateValeurInitiale?.toISOString()).toContain('2026-06-12');
    expect(listeDonneesIndicateurs.at(1)?.valeurActuelle).toEqual(28.8);
    expect(listeDonneesIndicateurs.at(1)?.dateValeurActuelle?.toISOString()).toContain('2026-06-12');
    expect(listeDonneesIndicateurs.at(1)?.valeurCibleAnnuelle).toEqual(40.1);
    expect(listeDonneesIndicateurs.at(1)?.dateValeurCibleAnnuelle?.toISOString()).toContain('2026-06-12');
    expect(listeDonneesIndicateurs.at(1)?.tauxAvancementAnnuel).toEqual(41.1);
    expect(listeDonneesIndicateurs.at(1)?.valeurCibleGlobale).toEqual(42.1);
    expect(listeDonneesIndicateurs.at(1)?.dateValeurCibleGlobale?.toISOString()).toContain('2026-06-12');
    expect(listeDonneesIndicateurs.at(1)?.tauxAvancementGlobale).toEqual(43.1);
    expect(listeDonneesIndicateurs.at(1)?.estBarometre).toEqual(false);
  });
});

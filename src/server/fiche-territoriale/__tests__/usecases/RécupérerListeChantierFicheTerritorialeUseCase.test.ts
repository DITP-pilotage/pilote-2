import { mock, MockProxy } from 'jest-mock-extended';
import { ChantierRepository } from '@/server/fiche-territoriale/domain/ports/ChantierRepository';
import { TerritoireRepository } from '@/server/fiche-territoriale/domain/ports/TerritoireRepository';
import { TerritoireBuilder } from '@/server/fiche-territoriale/app/builders/TerritoireBuilder';
import { ChantierBuilder } from '@/server/fiche-territoriale/app/builders/ChantierBuilder';
import {
  RécupérerListeChantierFicheTerritorialeUseCase,
} from '@/server/fiche-territoriale/usecases/RécupérerListeChantierFicheTerritorialeUseCase';
import { Ministere } from '@/server/fiche-territoriale/domain/Ministere';
import { MinistereBuilder } from '@/server/fiche-territoriale/app/builders/MinistereBuilder';
import { SyntheseDesResultatsRepository } from '@/server/fiche-territoriale/domain/ports/SyntheseDesResultatsRepository';
import { IndicateurRepository } from '@/server/fiche-territoriale/domain/ports/IndicateurRepository';
import { MinistereRepository } from '@/server/fiche-territoriale/domain/ports/MinistereRepository';
import { SyntheseDesResultats } from '@/server/fiche-territoriale/domain/SyntheseDesResultats';
import { Indicateur } from '@/server/fiche-territoriale/domain/Indicateur';
import { SyntheseDesResultatsBuilder } from '@/server/fiche-territoriale/app/builders/SyntheseDesResultatsBuilder';
import { IndicateurBuilder } from '@/server/fiche-territoriale/app/builders/IndicateurBuilder';

describe('RécupérerListeChantierFicheTerritorialeUseCase', () => {
  let chantierRepository: MockProxy<ChantierRepository>;
  let territoireRepository: MockProxy<TerritoireRepository>;
  let syntheseDesResultatsRepository: MockProxy<SyntheseDesResultatsRepository>;
  let indicateurRepository: MockProxy<IndicateurRepository>;
  let ministereRepository: MockProxy<MinistereRepository>;

  let récupérerListeChantierFicheTerritorialeUseCase: RécupérerListeChantierFicheTerritorialeUseCase;

  beforeEach(() => {
    chantierRepository = mock<ChantierRepository>();
    territoireRepository = mock<TerritoireRepository>();
    syntheseDesResultatsRepository = mock<SyntheseDesResultatsRepository>();
    indicateurRepository = mock<IndicateurRepository>();
    ministereRepository = mock<MinistereRepository>();
    récupérerListeChantierFicheTerritorialeUseCase = new RécupérerListeChantierFicheTerritorialeUseCase({ chantierRepository, territoireRepository, syntheseDesResultatsRepository, indicateurRepository, ministereRepository });
  });
  it('quand le territoire est un département, doit récupérer la liste des chantiers associés', async () => {
    // Given
    const territoireCode = 'UN-CODE';

    const territoire = new TerritoireBuilder().withCodeInsee('34').withMaille('DEPT').build();

    const chantier1 = new ChantierBuilder()
      .withId('CH-001')
      .withMeteo('SOLEIL')
      .withTauxAvancement(40)
      .withNom('Poursuivre le déploiement du Pass Culture')
      .withCodeMinisterePorteur('1009')
      .build();
    const chantier2 = new ChantierBuilder()
      .withId('CH-002')
      .withMeteo('ORAGE')
      .withTauxAvancement(25)
      .withNom('Déployer le programme France 2030')
      .withCodeMinisterePorteur('10')
      .build();

    const mapSyntheseDesResultats = new Map<string, SyntheseDesResultats[]>();
    const syntheseDesResultats1CH1 = new SyntheseDesResultatsBuilder()
      .withDateCommentaire('2019-01-02T00:00:00.000Z')
      .withDateMeteo('2019-07-02T00:00:00.000Z')
      .build();
    const syntheseDesResultats2CH1 = new SyntheseDesResultatsBuilder()
      .withDateCommentaire('2022-08-02T00:00:00.000Z')
      .withDateMeteo('2024-01-02T00:00:00.000Z')
      .build();
    const syntheseDesResultats1CH2 = new SyntheseDesResultatsBuilder()
      .withDateCommentaire('2023-08-02T00:00:00.000Z')
      .withDateMeteo('2021-01-02T00:00:00.000Z')
      .build();
    const syntheseDesResultats2CH2 = new SyntheseDesResultatsBuilder()
      .withDateCommentaire('2023-01-02T00:00:00.000Z')
      .withDateMeteo('2022-01-02T00:00:00.000Z')
      .build();
    mapSyntheseDesResultats.set('CH-001', [syntheseDesResultats1CH1, syntheseDesResultats2CH1]);
    mapSyntheseDesResultats.set('CH-002', [syntheseDesResultats1CH2, syntheseDesResultats2CH2]);

    const mapIndicateurs = new Map<string, Indicateur[]>();
    const indicateur1CH1 = new IndicateurBuilder().withDateValeurActuelle('2023-02-02T00:00:00.000Z').build();
    const indicateur2CH1 = new IndicateurBuilder().withDateValeurActuelle('2023-01-01T00:00:00.000Z').build();
    const indicateur1CH2 = new IndicateurBuilder().withDateValeurActuelle('2019-02-02T00:00:00.000Z').build();
    const indicateur2CH2 = new IndicateurBuilder().withDateValeurActuelle('2020-08-01T00:00:00.000Z').build();
    mapIndicateurs.set('CH-001', [indicateur1CH1, indicateur2CH1]);
    mapIndicateurs.set('CH-002', [indicateur1CH2, indicateur2CH2]);

    const mapMinistere = new Map<string, Ministere>();
    const ministere1 = new MinistereBuilder().withCode('1009').withIcone('remix::football::fill').build();
    const ministere2 = new MinistereBuilder().withCode('10').withIcone('remix::basket::fill').build();
    mapMinistere.set('1009', ministere1);
    mapMinistere.set('10', ministere2);

    territoireRepository.recupererTerritoireParCode.mockResolvedValue(territoire);
    chantierRepository.listerParTerritoireCodePourUnDepartement.mockResolvedValue([chantier1, chantier2]);
    syntheseDesResultatsRepository.recupererMapSyntheseDesResultatsParListeChantierIdEtTerritoire.mockResolvedValue(mapSyntheseDesResultats);
    indicateurRepository.recupererMapIndicateursParListeChantierIdEtTerritoire.mockResolvedValue(mapIndicateurs);
    ministereRepository.recupererMapMinistereParListeCodeMinistere.mockResolvedValue(mapMinistere);

    // When
    const result = await récupérerListeChantierFicheTerritorialeUseCase.run({ territoireCode });

    // Then
    expect(territoireRepository.recupererTerritoireParCode).toHaveBeenNthCalledWith(1, { territoireCode });
    expect(chantierRepository.listerParTerritoireCodePourUnDepartement).toHaveBeenNthCalledWith(1, { territoireCode });
    expect(syntheseDesResultatsRepository.recupererMapSyntheseDesResultatsParListeChantierIdEtTerritoire).toHaveBeenNthCalledWith(1, { listeChantierId: ['CH-001', 'CH-002'], maille: 'DEPT', codeInsee: '34' });
    expect(indicateurRepository.recupererMapIndicateursParListeChantierIdEtTerritoire).toHaveBeenNthCalledWith(1, { listeChantierId: ['CH-001', 'CH-002'], maille: 'DEPT', codeInsee: '34' });
    expect(ministereRepository.recupererMapMinistereParListeCodeMinistere).toHaveBeenNthCalledWith(1, { listeCodeMinistere: ['1009', '10'] });
    expect(result).toHaveLength(2);

    expect(result.at(0)?.nom).toEqual('Poursuivre le déploiement du Pass Culture');
    expect(result.at(0)?.ministerePorteur.icone).toEqual('remix::football::fill');
    expect(result.at(0)?.meteo).toEqual('SOLEIL');
    expect(result.at(0)?.dateQualitative).toEqual('2024-01-02T00:00:00.000Z');
    expect(result.at(0)?.tauxAvancement).toEqual(40);
    expect(result.at(0)?.dateQuantitative).toEqual('2023-02-02T00:00:00.000Z');


    expect(result.at(1)?.nom).toEqual('Déployer le programme France 2030');
    expect(result.at(1)?.ministerePorteur.icone).toEqual('remix::basket::fill');
    expect(result.at(1)?.meteo).toEqual('ORAGE');
    expect(result.at(1)?.dateQualitative).toEqual('2023-08-02T00:00:00.000Z');
    expect(result.at(1)?.tauxAvancement).toEqual(25);
    expect(result.at(1)?.dateQuantitative).toEqual('2020-08-01T00:00:00.000Z');
  });

  it('quand le territoire est une région, doit récupérer la liste des chantiers associés', async () => {
    // Given
    const territoireCode = 'UN-CODE';

    const territoire = new TerritoireBuilder().withCodeInsee('35').withMaille('REG').build();
    
    const chantier1 = new ChantierBuilder()
      .withId('CH-001')
      .withMeteo('SOLEIL')
      .withTauxAvancement(40)
      .withNom('Poursuivre le déploiement du Pass Culture')
      .withCodeMinisterePorteur('1009')
      .build();
    const chantier2 = new ChantierBuilder()
      .withId('CH-002')
      .withMeteo('ORAGE')
      .withTauxAvancement(25)
      .withNom('Déployer le programme France 2030')
      .withCodeMinisterePorteur('10')
      .build();

    const mapSyntheseDesResultats = new Map<string, SyntheseDesResultats[]>();
    const syntheseDesResultats1CH1 = new SyntheseDesResultatsBuilder()
      .withDateCommentaire('2019-01-02T00:00:00.000Z')
      .withDateMeteo('2019-07-02T00:00:00.000Z')
      .build();
    const syntheseDesResultats2CH1 = new SyntheseDesResultatsBuilder()
      .withDateCommentaire('2022-08-02T00:00:00.000Z')
      .withDateMeteo('2024-01-02T00:00:00.000Z')
      .build();
    const syntheseDesResultats1CH2 = new SyntheseDesResultatsBuilder()
      .withDateCommentaire('2023-08-02T00:00:00.000Z')
      .withDateMeteo('2021-01-02T00:00:00.000Z')
      .build();
    const syntheseDesResultats2CH2 = new SyntheseDesResultatsBuilder()
      .withDateCommentaire('2023-01-02T00:00:00.000Z')
      .withDateMeteo('2022-01-02T00:00:00.000Z')
      .build();
    mapSyntheseDesResultats.set('CH-001', [syntheseDesResultats1CH1, syntheseDesResultats2CH1]);
    mapSyntheseDesResultats.set('CH-002', [syntheseDesResultats1CH2, syntheseDesResultats2CH2]);

    const mapIndicateurs = new Map<string, Indicateur[]>();
    const indicateur1CH1 = new IndicateurBuilder().withDateValeurActuelle('2023-02-02T00:00:00.000Z').build();
    const indicateur2CH1 = new IndicateurBuilder().withDateValeurActuelle('2023-01-01T00:00:00.000Z').build();
    const indicateur1CH2 = new IndicateurBuilder().withDateValeurActuelle('2019-02-02T00:00:00.000Z').build();
    const indicateur2CH2 = new IndicateurBuilder().withDateValeurActuelle('2020-08-01T00:00:00.000Z').build();
    mapIndicateurs.set('CH-001', [indicateur1CH1, indicateur2CH1]);
    mapIndicateurs.set('CH-002', [indicateur1CH2, indicateur2CH2]);

    const mapMinistere = new Map<string, Ministere>();
    const ministere1 = new MinistereBuilder().withCode('1009').withIcone('remix::football::fill').build();
    const ministere2 = new MinistereBuilder().withCode('10').withIcone('remix::basket::fill').build();
    mapMinistere.set('1009', ministere1);
    mapMinistere.set('10', ministere2);

    territoireRepository.recupererTerritoireParCode.mockResolvedValue(territoire);
    chantierRepository.listerParTerritoireCodePourUneRegion.mockResolvedValue([chantier1, chantier2]);
    syntheseDesResultatsRepository.recupererMapSyntheseDesResultatsParListeChantierIdEtTerritoire.mockResolvedValue(mapSyntheseDesResultats);
    indicateurRepository.recupererMapIndicateursParListeChantierIdEtTerritoire.mockResolvedValue(mapIndicateurs);
    ministereRepository.recupererMapMinistereParListeCodeMinistere.mockResolvedValue(mapMinistere);

    // When
    const result = await récupérerListeChantierFicheTerritorialeUseCase.run({ territoireCode });

    // Then
    expect(territoireRepository.recupererTerritoireParCode).toHaveBeenNthCalledWith(1, { territoireCode });
    expect(chantierRepository.listerParTerritoireCodePourUneRegion).toHaveBeenNthCalledWith(1, { territoireCode });
    expect(syntheseDesResultatsRepository.recupererMapSyntheseDesResultatsParListeChantierIdEtTerritoire).toHaveBeenNthCalledWith(1, { listeChantierId: ['CH-001', 'CH-002'], maille: 'REG', codeInsee: '35' });
    expect(indicateurRepository.recupererMapIndicateursParListeChantierIdEtTerritoire).toHaveBeenNthCalledWith(1, { listeChantierId: ['CH-001', 'CH-002'], maille: 'REG', codeInsee: '35' });
    expect(ministereRepository.recupererMapMinistereParListeCodeMinistere).toHaveBeenNthCalledWith(1, { listeCodeMinistere: ['1009', '10'] });
    expect(result).toHaveLength(2);

    expect(result.at(0)?.nom).toEqual('Poursuivre le déploiement du Pass Culture');
    expect(result.at(0)?.ministerePorteur.icone).toEqual('remix::football::fill');
    expect(result.at(0)?.meteo).toEqual('SOLEIL');
    expect(result.at(0)?.dateQualitative).toEqual('2024-01-02T00:00:00.000Z');
    expect(result.at(0)?.tauxAvancement).toEqual(40);
    expect(result.at(0)?.dateQuantitative).toEqual('2023-02-02T00:00:00.000Z');


    expect(result.at(1)?.nom).toEqual('Déployer le programme France 2030');
    expect(result.at(1)?.ministerePorteur.icone).toEqual('remix::basket::fill');
    expect(result.at(1)?.meteo).toEqual('ORAGE');
    expect(result.at(1)?.dateQualitative).toEqual('2023-08-02T00:00:00.000Z');
    expect(result.at(1)?.tauxAvancement).toEqual(25);
    expect(result.at(1)?.dateQuantitative).toEqual('2020-08-01T00:00:00.000Z');
  });
});

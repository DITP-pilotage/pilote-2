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
  it('quand le territoire est un département, doit récupérer la liste des chantiers associés trié par taux avancement', async () => {
    // Given
    const territoireCode = 'UN-CODE';

    const territoire = new TerritoireBuilder().withCodeInsee('34').withMaille('DEPT').build();

    const chantier1 = new ChantierBuilder()
      .withId('CH-001')
      .withMeteo('SOLEIL')
      .withTauxAvancement(null)
      .withNom('Poursuivre le déploiement du Pass Culture')
      .withCodeMinisterePorteur('1009')
      .build();
    const chantier2 = new ChantierBuilder()
      .withId('CH-002')
      .withMeteo('ORAGE')
      .withTauxAvancement(40)
      .withNom('Déployer le programme France 2030')
      .withCodeMinisterePorteur('10')
      .build();
    const chantier3 = new ChantierBuilder()
      .withId('CH-003')
      .withMeteo('ORAGE')
      .withTauxAvancement(25)
      .withNom('Un chantier 3')
      .withCodeMinisterePorteur('10')
      .build();

    const mapSyntheseDesResultats = new Map<string, SyntheseDesResultats[]>();
    const syntheseDesResultats1CH1 = new SyntheseDesResultatsBuilder()
      .withDateCommentaire('2019-01-02T00:00:00.000Z')
      .withDateMeteo('2019-07-02T00:00:00.000Z')
      .build();
    const syntheseDesResultats2CH1 = new SyntheseDesResultatsBuilder()
      .withDateCommentaire('2022-08-02T00:00:00.000Z')
      .withDateMeteo('2024-01-03T00:00:00.000Z')
      .build();
    const syntheseDesResultats1CH2 = new SyntheseDesResultatsBuilder()
      .withDateCommentaire('2023-08-02T00:00:00.000Z')
      .withDateMeteo('2021-01-02T00:00:00.000Z')
      .build();
    const syntheseDesResultats2CH2 = new SyntheseDesResultatsBuilder()
      .withDateCommentaire('2023-01-02T00:00:00.000Z')
      .withDateMeteo('2022-01-02T00:00:00.000Z')
      .build();
    const syntheseDesResultats1CH3 = new SyntheseDesResultatsBuilder()
      .withDateCommentaire('2023-01-02T00:00:00.000Z')
      .withDateMeteo('2022-01-02T00:00:00.000Z')
      .build();
    mapSyntheseDesResultats.set('CH-001', [syntheseDesResultats1CH1, syntheseDesResultats2CH1]);
    mapSyntheseDesResultats.set('CH-002', [syntheseDesResultats1CH2, syntheseDesResultats2CH2]);
    mapSyntheseDesResultats.set('CH-003', [syntheseDesResultats1CH3]);

    const mapIndicateurs = new Map<string, Indicateur[]>();
    const indicateur1CH1 = new IndicateurBuilder()
      .withId('IND-001')
      .withNom('Un nom indicateur 1 chantier 1')
      .withObjectifTauxAvancement(10.1)
      .withValeurActuelle(11.1)
      .withValeurCible(12.1)
      .withUniteMesure('Pourcentage')
      .withDateValeurActuelle('2024-01-02T00:00:00.000Z')
      .build();
    const indicateur2CH1 = new IndicateurBuilder()
      .withId('IND-002')
      .withNom('Un nom indicateur 2 chantier 1')
      .withObjectifTauxAvancement(20.1)
      .withValeurActuelle(21.1)
      .withValeurCible(22.1)
      .withUniteMesure('Pourcentage')
      .withDateValeurActuelle('2023-01-01T00:00:00.000Z')
      .build();
    const indicateur1CH2 = new IndicateurBuilder()
      .withId('IND-003')
      .withNom('Un nom indicateur 1 chantier 2')
      .withObjectifTauxAvancement(30.1)
      .withValeurActuelle(31.1)
      .withValeurCible(32.1)
      .withDateValeurActuelle('2020-08-01T00:00:00.000Z')
      .withUniteMesure('million habitant')
      .build();
    const indicateur2CH2 = new IndicateurBuilder()
      .withId('IND-004')
      .withNom('Un nom indicateur 2 chantier 2')
      .withObjectifTauxAvancement(40.1)
      .withValeurActuelle(41.1)
      .withValeurCible(42.1)
      .withUniteMesure('million habitant')
      .withDateValeurActuelle('2021-01-02T00:00:00.000Z')
      .build();
    const indicateur1CH3 = new IndicateurBuilder()
      .withId('IND-005')
      .withNom('Un nom indicateur 1 chantier 3')
      .withObjectifTauxAvancement(40.1)
      .withValeurActuelle(41.1)
      .withValeurCible(42.1)
      .withUniteMesure('million habitant')
      .withDateValeurActuelle('2021-01-02T00:00:00.000Z')
      .build();
    mapIndicateurs.set('CH-001', [indicateur1CH1, indicateur2CH1]);
    mapIndicateurs.set('CH-002', [indicateur1CH2, indicateur2CH2]);
    mapIndicateurs.set('CH-003', [indicateur1CH3]);

    const mapIndicateursNational = new Map<string, Indicateur>();
    const indicateurNational1CH1 = new IndicateurBuilder()
      .withId('IND-001')
      .withObjectifTauxAvancement(10.1)
      .build();
    const indicateurNational2CH1 = new IndicateurBuilder()
      .withId('IND-002')
      .withObjectifTauxAvancement(20.1)
      .build();
    const indicateurNational1CH2 = new IndicateurBuilder()
      .withId('IND-003')
      .withObjectifTauxAvancement(30.1)
      .build();
    const indicateurNational2CH2 = new IndicateurBuilder()
      .withId('IND-004')
      .withObjectifTauxAvancement(40.1)
      .build();
    const indicateurNational1CH3 = new IndicateurBuilder()
      .withId('IND-005')
      .withObjectifTauxAvancement(40.1)
      .build();
    mapIndicateursNational.set('IND-001', indicateurNational1CH1);
    mapIndicateursNational.set('IND-002', indicateurNational2CH1);
    mapIndicateursNational.set('IND-003', indicateurNational1CH2);
    mapIndicateursNational.set('IND-004', indicateurNational2CH2);
    mapIndicateursNational.set('IND-005', indicateurNational1CH3);

    const mapMinistere = new Map<string, Ministere>();
    const ministere1 = new MinistereBuilder().withCode('1009').withIcone('remix::football::fill').build();
    const ministere2 = new MinistereBuilder().withCode('10').withIcone('remix::basket::fill').build();
    mapMinistere.set('1009', ministere1);
    mapMinistere.set('10', ministere2);

    territoireRepository.recupererTerritoireParCode.mockResolvedValue(territoire);
    chantierRepository.listerParTerritoireCodePourEtMaille.mockResolvedValue([chantier1, chantier2, chantier3]);
    syntheseDesResultatsRepository.recupererMapSyntheseDesResultatsParListeChantierIdEtTerritoire.mockResolvedValue(mapSyntheseDesResultats);
    indicateurRepository.recupererMapIndicateursParListeChantierIdEtTerritoire.mockResolvedValue(mapIndicateurs);
    indicateurRepository.recupererMapIndicateursNationalParListeIndicateurId.mockResolvedValue(mapIndicateursNational);
    ministereRepository.recupererMapMinistereParListeCodeMinistere.mockResolvedValue(mapMinistere);

    // When
    const result = await récupérerListeChantierFicheTerritorialeUseCase.run({ territoireCode });

    // Then
    expect(territoireRepository.recupererTerritoireParCode).toHaveBeenNthCalledWith(1, { territoireCode });
    expect(chantierRepository.listerParTerritoireCodePourEtMaille).toHaveBeenNthCalledWith(1, { territoireCode, maille: 'DEPT' });
    expect(syntheseDesResultatsRepository.recupererMapSyntheseDesResultatsParListeChantierIdEtTerritoire).toHaveBeenNthCalledWith(1, { listeChantierId: ['CH-002', 'CH-003', 'CH-001'], maille: 'DEPT', codeInsee: '34' });
    expect(indicateurRepository.recupererMapIndicateursParListeChantierIdEtTerritoire).toHaveBeenNthCalledWith(1, { listeChantierId: ['CH-002', 'CH-003', 'CH-001'], maille: 'DEPT', codeInsee: '34' });
    expect(indicateurRepository.recupererMapIndicateursNationalParListeIndicateurId).toHaveBeenNthCalledWith(1, { listeIndicateurId: ['IND-001', 'IND-002', 'IND-003', 'IND-004', 'IND-005'] });
    expect(ministereRepository.recupererMapMinistereParListeCodeMinistere).toHaveBeenNthCalledWith(1, { listeCodeMinistere: ['10', '10', '1009'] });

    expect(result).toHaveLength(3);

    expect(result.at(0)?.nom).toEqual('Déployer le programme France 2030');
    expect(result.at(0)?.ministerePorteur.icone).toEqual('remix::basket::fill');
    expect(result.at(0)?.meteo).toEqual('ORAGE');
    expect(result.at(0)?.dateQualitative).toEqual('2023-08-02T00:00:00.000Z');
    expect(result.at(0)?.tauxAvancement).toEqual(40);
    expect(result.at(0)?.dateQuantitative).toEqual('2021-01-02T00:00:00.000Z');
    expect(result.at(0)?.indicateurs).toHaveLength(2);
    expect(result.at(0)?.indicateurs.at(0)?.nom).toEqual('Un nom indicateur 1 chantier 2');
    expect(result.at(0)?.indicateurs.at(0)?.tauxAvancement).toEqual(30.1);
    expect(result.at(0)?.indicateurs.at(0)?.valeurActuelle).toEqual(31.1);
    expect(result.at(0)?.indicateurs.at(0)?.valeurCible).toEqual(32.1);
    expect(result.at(0)?.indicateurs.at(0)?.tauxAvancementNational).toEqual(30.1);
    expect(result.at(0)?.indicateurs.at(0)?.uniteMesure).toEqual('million habitant');
    expect(result.at(0)?.indicateurs.at(1)?.nom).toEqual('Un nom indicateur 2 chantier 2');
    expect(result.at(0)?.indicateurs.at(1)?.tauxAvancement).toEqual(40.1);
    expect(result.at(0)?.indicateurs.at(1)?.valeurActuelle).toEqual(41.1);
    expect(result.at(0)?.indicateurs.at(1)?.valeurCible).toEqual(42.1);
    expect(result.at(0)?.indicateurs.at(1)?.tauxAvancementNational).toEqual(40.1);
    expect(result.at(0)?.indicateurs.at(1)?.uniteMesure).toEqual('million habitant');

    expect(result.at(1)?.tauxAvancement).toEqual(25);

    expect(result.at(2)?.nom).toEqual('Poursuivre le déploiement du Pass Culture');
    expect(result.at(2)?.ministerePorteur.icone).toEqual('remix::football::fill');
    expect(result.at(2)?.meteo).toEqual('SOLEIL');
    expect(result.at(2)?.dateQualitative).toEqual('2024-01-03T00:00:00.000Z');
    expect(result.at(2)?.tauxAvancement).toEqual(null);
    expect(result.at(2)?.dateQuantitative).toEqual('2024-01-02T00:00:00.000Z');
    expect(result.at(2)?.indicateurs).toHaveLength(2);
    expect(result.at(2)?.indicateurs.at(0)?.nom).toEqual('Un nom indicateur 1 chantier 1');
    expect(result.at(2)?.indicateurs.at(0)?.tauxAvancement).toEqual(10.1);
    expect(result.at(2)?.indicateurs.at(0)?.valeurActuelle).toEqual(11.1);
    expect(result.at(2)?.indicateurs.at(0)?.valeurCible).toEqual(12.1);
    expect(result.at(2)?.indicateurs.at(0)?.tauxAvancementNational).toEqual(10.1);
    expect(result.at(2)?.indicateurs.at(0)?.uniteMesure).toEqual('Pourcentage');
    expect(result.at(2)?.indicateurs.at(1)?.nom).toEqual('Un nom indicateur 2 chantier 1');
    expect(result.at(2)?.indicateurs.at(1)?.tauxAvancement).toEqual(20.1);
    expect(result.at(2)?.indicateurs.at(1)?.valeurActuelle).toEqual(21.1);
    expect(result.at(2)?.indicateurs.at(1)?.valeurCible).toEqual(22.1);
    expect(result.at(2)?.indicateurs.at(1)?.tauxAvancementNational).toEqual(20.1);
    expect(result.at(2)?.indicateurs.at(1)?.uniteMesure).toEqual('Pourcentage');
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
    const indicateur1CH1 = new IndicateurBuilder()
      .withDateValeurActuelle('2023-02-02T00:00:00.000Z')
      .build();
    const indicateur2CH1 = new IndicateurBuilder()
      .withDateValeurActuelle('2023-01-01T00:00:00.000Z')
      .build();
    const indicateur1CH2 = new IndicateurBuilder()
      .withDateValeurActuelle('2019-02-02T00:00:00.000Z')
      .build();
    const indicateur2CH2 = new IndicateurBuilder()
      .withDateValeurActuelle('2020-08-01T00:00:00.000Z')
      .build();
    mapIndicateurs.set('CH-001', [indicateur1CH1, indicateur2CH1]);
    mapIndicateurs.set('CH-002', [indicateur1CH2, indicateur2CH2]);

    const mapIndicateursNational = new Map<string, Indicateur>();
    const indicateurNational1CH1 = new IndicateurBuilder()
      .withId('IND-001')
      .withObjectifTauxAvancement(10.1)
      .build();
    const indicateurNational2CH1 = new IndicateurBuilder()
      .withId('IND-002')
      .withObjectifTauxAvancement(20.1)
      .build();
    const indicateurNational1CH2 = new IndicateurBuilder()
      .withId('IND-003')
      .withObjectifTauxAvancement(30.1)
      .build();
    const indicateurNational2CH2 = new IndicateurBuilder()
      .withId('IND-004')
      .withObjectifTauxAvancement(40.1)
      .build();
    mapIndicateursNational.set('IND-001', indicateurNational1CH1);
    mapIndicateursNational.set('IND-002', indicateurNational2CH1);
    mapIndicateursNational.set('IND-003', indicateurNational1CH2);
    mapIndicateursNational.set('IND-004', indicateurNational2CH2);

    const mapMinistere = new Map<string, Ministere>();
    const ministere1 = new MinistereBuilder().withCode('1009').withIcone('remix::football::fill').build();
    const ministere2 = new MinistereBuilder().withCode('10').withIcone('remix::basket::fill').build();
    mapMinistere.set('1009', ministere1);
    mapMinistere.set('10', ministere2);

    territoireRepository.recupererTerritoireParCode.mockResolvedValue(territoire);
    chantierRepository.listerParTerritoireCodePourEtMaille.mockResolvedValue([chantier1, chantier2]);
    syntheseDesResultatsRepository.recupererMapSyntheseDesResultatsParListeChantierIdEtTerritoire.mockResolvedValue(mapSyntheseDesResultats);
    indicateurRepository.recupererMapIndicateursParListeChantierIdEtTerritoire.mockResolvedValue(mapIndicateurs);
    indicateurRepository.recupererMapIndicateursNationalParListeIndicateurId.mockResolvedValue(mapIndicateursNational);
    ministereRepository.recupererMapMinistereParListeCodeMinistere.mockResolvedValue(mapMinistere);

    // When
    const result = await récupérerListeChantierFicheTerritorialeUseCase.run({ territoireCode });

    // Then
    expect(territoireRepository.recupererTerritoireParCode).toHaveBeenNthCalledWith(1, { territoireCode });
    expect(chantierRepository.listerParTerritoireCodePourEtMaille).toHaveBeenNthCalledWith(1, { territoireCode, maille: 'REG' });
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

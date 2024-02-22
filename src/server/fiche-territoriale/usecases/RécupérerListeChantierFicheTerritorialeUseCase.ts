import { ChantierRepository } from '@/server/fiche-territoriale/domain/ports/ChantierRepository';
import { TerritoireRepository } from '@/server/fiche-territoriale/domain/ports/TerritoireRepository';
import { ChantierFicheTerritoriale } from '@/server/fiche-territoriale/domain/ChantierFicheTerritoriale';
import { Chantier } from '@/server/fiche-territoriale/domain/Chantier';
import { SyntheseDesResultatsRepository } from '@/server/fiche-territoriale/domain/ports/SyntheseDesResultatsRepository';
import { IndicateurRepository } from '@/server/fiche-territoriale/domain/ports/IndicateurRepository';
import { MinistereRepository } from '@/server/fiche-territoriale/domain/ports/MinistereRepository';
import { Ministere } from '@/server/fiche-territoriale/domain/Ministere';
import { IndicateurFicheTerritoriale } from '@/server/fiche-territoriale/domain/IndicateurFicheTerritoriale';

interface Dependencies {
  chantierRepository: ChantierRepository,
  territoireRepository: TerritoireRepository
  syntheseDesResultatsRepository: SyntheseDesResultatsRepository
  indicateurRepository: IndicateurRepository
  ministereRepository: MinistereRepository
}

const CHANTIER_EXCLUS = new Set(['CH-162', 'CH-173', 'CH-054', 'CH-006', 'CH-057', 'CH-086', 'CH-107', 'CH-141', 'CH-130', 'CH-131']);

export class RécupérerListeChantierFicheTerritorialeUseCase {
  private chantierRepository: ChantierRepository;

  private territoireRepository: TerritoireRepository;

  private syntheseDesResultatsRepository: SyntheseDesResultatsRepository;

  private indicateurRepository: IndicateurRepository;

  private ministereRepository: MinistereRepository;

  constructor({ chantierRepository, territoireRepository, syntheseDesResultatsRepository, indicateurRepository, ministereRepository }: Dependencies) {
    this.chantierRepository = chantierRepository;
    this.territoireRepository = territoireRepository;
    this.syntheseDesResultatsRepository = syntheseDesResultatsRepository;
    this.indicateurRepository = indicateurRepository;
    this.ministereRepository = ministereRepository;
  }

  async run({ territoireCode }: { territoireCode: string }): Promise<ChantierFicheTerritoriale[]> {
    let chantiers: Chantier[];
    
    const territoire = await this.territoireRepository.recupererTerritoireParCode({ territoireCode });

    if (territoire.maille === 'DEPT') {
      chantiers = await this.chantierRepository.listerParTerritoireCodePourUnDepartement({ territoireCode }).then(chantiersResult => chantiersResult.filter(chantier => !CHANTIER_EXCLUS.has(chantier.id)));
    } else if (territoire.maille === 'REG') {
      chantiers = await this.chantierRepository.listerParTerritoireCodePourUneRegion({ territoireCode }).then(chantiersResult => chantiersResult.filter(chantier => !CHANTIER_EXCLUS.has(chantier.id)));
    } else {
      chantiers = [];
    }


    const listeChantierId = chantiers.map(chantier => chantier.id);
    const listeCodeMinisterePorteur = chantiers.map(chantier => chantier.codeMinisterePorteur);

    const [
      mapSyntheseDesResultats,
      mapIndicateurs,
      mapMinistere,
    ] = await Promise.all(
      [
        this.syntheseDesResultatsRepository.recupererMapSyntheseDesResultatsParListeChantierIdEtTerritoire({ listeChantierId, maille: territoire.maille, codeInsee: territoire.codeInsee }),
        this.indicateurRepository.recupererMapIndicateursParListeChantierIdEtTerritoire({ listeChantierId, maille: territoire.maille, codeInsee: territoire.codeInsee }),
        this.ministereRepository.recupererMapMinistereParListeCodeMinistere({ listeCodeMinistere: listeCodeMinisterePorteur }),
      ],
    );

    const listeIndicateurId = [...mapIndicateurs.values()].flat().map(indicateur => indicateur.id);
    const mapIndicateursNationale = await this.indicateurRepository.recupererMapIndicateursNationalParListeIndicateurId({ listeIndicateurId });

    return chantiers.map(chantier => ChantierFicheTerritoriale.creerChantierFicheTerritoriale({
      nom: chantier.nom,
      meteo: chantier.meteo,
      tauxAvancement: chantier.tauxAvancement,
      ministerePorteur: Ministere.creerMinistere({ icone: mapMinistere.get(chantier.codeMinisterePorteur)?.icone || '', code: chantier.codeMinisterePorteur }),
      dateQualitative: ChantierFicheTerritoriale.calculerDateQualitative(mapSyntheseDesResultats.get(chantier.id) || []),
      dateQuantitative: ChantierFicheTerritoriale.calculerDateQuantitative(mapIndicateurs.get(chantier.id) || []),
      indicateurs: mapIndicateurs.get(chantier.id)?.map(indicateur => {
        return IndicateurFicheTerritoriale.creerIndicateurFicheTerritoriale({
          valeurActuelle: indicateur.valeurActuelle,
          nom: indicateur.nom,
          uniteMesure: indicateur.uniteMesure,
          tauxAvancement: indicateur.objectifTauxAvancement,
          valeurCible: indicateur.valeurCible,
          tauxAvancementNational: !Number.isNaN(mapIndicateursNationale.get(indicateur.id)?.objectifTauxAvancement) ? mapIndicateursNationale.get(indicateur.id)!.objectifTauxAvancement : null,
        });
      }) || [],
    }));
  }
}

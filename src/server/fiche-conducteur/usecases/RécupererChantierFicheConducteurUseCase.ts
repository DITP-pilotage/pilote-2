import { ChantierRepository } from '@/server/fiche-conducteur/domain/ports/ChantierRepository';
import { ChantierFicheConducteur } from '@/server/fiche-conducteur/domain/ChantierFicheConducteur';
import { IndicateurFicheConducteur } from '@/server/fiche-conducteur/domain/IndicateurFicheConducteur';
import { IndicateurRepository } from '@/server/fiche-conducteur/domain/ports/IndicateurRepository';

interface Dependencies {
  chantierRepository: ChantierRepository
  indicateurRepository: IndicateurRepository
}

export class RécupererChantierFicheConducteurUseCase {
  private chantierRepository: ChantierRepository;

  private indicateurRepository: IndicateurRepository;

  constructor({ chantierRepository, indicateurRepository }: Dependencies) {
    this.chantierRepository = chantierRepository;
    this.indicateurRepository = indicateurRepository;
  }

  async run({ chantierId, territoireCode }: { chantierId: string, territoireCode: string }): Promise<ChantierFicheConducteur> {
    const chantier = await this.chantierRepository.récupérerParIdEtParTerritoireCode({ chantierId, territoireCode });
    const indicateurs = await this.indicateurRepository.récupérerIndicImpactParChantierId(chantierId);
    return ChantierFicheConducteur.creerChantierFicheConducteur({
      id: chantier.id,
      nom: chantier.nom,
      listeDirecteursAdministrationCentrale: chantier.listeDirecteursAdministrationCentrale,
      listeDirecteursProjet: chantier.listeDirecteursProjet,
      indicateurs: indicateurs.map(indicateur => IndicateurFicheConducteur.creerIndicateurFicheConducteur({
        nom: indicateur.nom,
        type: indicateur.type,
        valeurInitiale: indicateur.valeurInitiale,
        dateValeurInitiale: indicateur.dateValeurInitiale,
        valeurActuelle: indicateur.valeurActuelle,
        dateValeurActuelle: indicateur.dateValeurActuelle,
        objectifValeurCibleIntermediaire: indicateur.objectifValeurCibleIntermediaire,
        objectifTauxAvancementIntermediaire: indicateur.objectifTauxAvancementIntermediaire,
        objectifValeurCible: indicateur.objectifValeurCible,
        objectifTauxAvancement: indicateur.objectifTauxAvancement,
      })),
    });
  }
}

import { PérimètreGéographiqueIdentifiant } from '@/components/PageChantiers/BarreLatérale/SélecteursGéographiques/SélecteurDePérimètreGéographique/SélecteurDePérimètreGéographique.interface';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import { récupérerAvancement, récupérerMétéo } from '../donnéesTerritoires/donnéesTerritoires';

export default function territorialiserChantiers(chantiers: Chantier[], périmètreGéographique: PérimètreGéographiqueIdentifiant) {
  return (
    chantiers.map(chantier => ({
      id: chantier.id,
      nom: chantier.nom,
      avancementGlobalTerritoire: récupérerAvancement(chantier.mailles, périmètreGéographique.maille, périmètreGéographique.codeInsee).global,
      météoTerritoire: récupérerMétéo(chantier.mailles, périmètreGéographique.maille, périmètreGéographique.codeInsee),
    }))
  );
}

import Chantier from '@/server/domain/chantier/Chantier.interface';
import { PérimètreGéographiqueIdentifiant } from '@/components/_commons/SélecteurDePérimètreGéographique/SélecteurDePérimètreGéographique.interface';
import { récupérerAvancement, récupérerMétéo } from '../donnéesTerritoires/donnéesTerritoires';

export default function territorialiserChantiers(chantiers: Chantier[], périmètreGéographique: PérimètreGéographiqueIdentifiant) {
  return (
    chantiers.map(chantier => ({
      id: chantier.id,
      nom: chantier.nom,
      avancementGlobalTerritoire: récupérerAvancement(chantier.mailles, périmètreGéographique.maille, périmètreGéographique.codeInsee).global,
      météoTerritoire: récupérerMétéo(chantier.mailles, périmètreGéographique.maille, périmètreGéographique.codeInsee),
      estBaromètre: chantier.estBaromètre,
    }))
  );
}

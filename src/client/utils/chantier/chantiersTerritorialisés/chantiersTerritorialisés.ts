import Chantier, { TerritoireIdentifiant } from '@/server/domain/chantier/Chantier.interface';
import { récupérerAvancement, récupérerMétéo } from '../donnéesTerritoires/donnéesTerritoires';

export default function territorialiserChantiers(chantiers: Chantier[], périmètreGéographique: TerritoireIdentifiant) {
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

import Chantier, { TerritoireIdentifiant } from '@/server/domain/chantier/Chantier.interface';
import { récupérerAvancement, récupérerMétéo, récupérerNomTerritoire } from '../donnéesTerritoires/donnéesTerritoires';

export function territorialiserChantier(chantier: Chantier, périmètreGéographique: TerritoireIdentifiant) {
  return ({
    id: chantier.id,
    nom: chantier.nom,
    avancementGlobalTerritoire: récupérerAvancement(chantier.mailles, périmètreGéographique.maille, périmètreGéographique.codeInsee).global,
    météoTerritoire: récupérerMétéo(chantier.mailles, périmètreGéographique.maille, périmètreGéographique.codeInsee),
    estBaromètre: chantier.estBaromètre,
    territoire: { ...périmètreGéographique, nom: récupérerNomTerritoire(périmètreGéographique) },
  });
}

export function territorialiserChantiers(chantiers: Chantier[], périmètreGéographique: TerritoireIdentifiant) {
  return chantiers.map(chantier => (territorialiserChantier(chantier, périmètreGéographique)));
}

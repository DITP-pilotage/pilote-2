import { VARIABLE_CONTENU_DISPONIBLE } from '@/server/gestion-contenu/domain/VARIABLE_CONTENU_DISPONIBLE';

export interface GestionContenuRepository {
  mettreAJourContenu: <K extends keyof VARIABLE_CONTENU_DISPONIBLE>(nomVariableContenu: K, valeurVariableContenu: VARIABLE_CONTENU_DISPONIBLE[K]) => Promise<void>
  recupererMapVariableContenuParListeDeNom: (listeNomVariableContenu: (keyof VARIABLE_CONTENU_DISPONIBLE)[]) => Promise<Partial<VARIABLE_CONTENU_DISPONIBLE>>
}


import { VARIABLE_DISPONIBLE } from '@/server/gestion-contenu/domain/VARIABLE_DISPONIBLE';

export interface GestionContenuRepository {
  mettreAJourContenu: <K extends keyof VARIABLE_DISPONIBLE>(nomVariableContenu: K, valeurVariableContenu: VARIABLE_DISPONIBLE[K]) => Promise<void>
}

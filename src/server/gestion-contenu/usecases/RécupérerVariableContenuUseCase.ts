import { VariableContenuDisponibleEnv } from '@/server/gestion-contenu/domain/VariableContenuDisponible';
import { configuration } from '@/config';


export class RécupérerVariableContenuUseCase {
  run<T extends keyof VariableContenuDisponibleEnv>({ nomVariableContenu }: { nomVariableContenu: T }): VariableContenuDisponibleEnv[T] | undefined {
    switch (nomVariableContenu) {
      case 'NEXT_PUBLIC_FF_RAPPORT_DETAILLE': {
        return configuration.featureFlip.rapportDetaille as VariableContenuDisponibleEnv[T];
      }
      case 'NEXT_PUBLIC_FF_PROJETS_STRUCTURANTS': {
        return configuration.featureFlip.projetsStructurants as VariableContenuDisponibleEnv[T];
      }
      case 'NEXT_PUBLIC_FF_INFOBULLE_PONDERATION': {
        return configuration.featureFlip.infobullePonderation as VariableContenuDisponibleEnv[T];
      }
      case 'NEXT_PUBLIC_FF_DATE_METEO': {
        return configuration.featureFlip.dateMeteo as VariableContenuDisponibleEnv[T];
      }
      case 'NEXT_PUBLIC_LIMITE_CARACTERES_PUBLICATION': {
        return configuration.featureFlip.limiteCaracteresPublication as VariableContenuDisponibleEnv[T];
      }
      case 'NEXT_PUBLIC_FF_ALERTES': {
        return configuration.featureFlip.alertes as VariableContenuDisponibleEnv[T];
      }
      case 'NEXT_PUBLIC_FF_ALERTES_BAISSE': {
        return configuration.featureFlip.alertesBaisse as VariableContenuDisponibleEnv[T];
      }
      case 'NEXT_PUBLIC_FF_APPLICATION_INDISPONIBLE': {
        return configuration.featureFlip.applicationIndisponible as VariableContenuDisponibleEnv[T];
      }
      case 'NEXT_PUBLIC_FF_FICHE_TERRITORIALE': {
        return configuration.featureFlip.ficheTerritoriale as VariableContenuDisponibleEnv[T];
      }
      case 'NEXT_PUBLIC_FF_FICHE_CONDUCTEUR': {
        return configuration.featureFlip.ficheConducteur as VariableContenuDisponibleEnv[T];
      }
      case 'NEXT_PUBLIC_FF_TA_ANNUEL': {
        return configuration.featureFlip.taAnnuel as VariableContenuDisponibleEnv[T];
      }
    }
  }
}

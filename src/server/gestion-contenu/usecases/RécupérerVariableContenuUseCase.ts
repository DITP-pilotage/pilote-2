import { VariableContenuDisponibleEnv } from '@/server/gestion-contenu/domain/VariableContenuDisponible';
import config from '@/config';


export class RécupérerVariableContenuUseCase {
  run<T extends keyof VariableContenuDisponibleEnv>({ nomVariableContenu }: { nomVariableContenu: T }): VariableContenuDisponibleEnv[T] | undefined {
    switch (nomVariableContenu) {
      case 'NEXT_PUBLIC_FF_RAPPORT_DETAILLE': {
        return config.nextPublicFfRapportDetaille as VariableContenuDisponibleEnv[T];
      }
      case 'NEXT_PUBLIC_FF_PROJETS_STRUCTURANTS': {
        return config.nextPublicFfProjetsStructurants as VariableContenuDisponibleEnv[T];
      }
      case 'NEXT_PUBLIC_FF_INFOBULLE_PONDERATION': {
        return config.nextPublicFfInfobullePonderation as VariableContenuDisponibleEnv[T];
      }
      case 'NEXT_PUBLIC_FF_DATE_METEO': {
        return config.nextPublicFfDateMeteo as VariableContenuDisponibleEnv[T];
      }
      case 'NEXT_PUBLIC_LIMITE_CARACTERES_PUBLICATION': {
        return config.nextPublicLimiteCaracteresPublication as VariableContenuDisponibleEnv[T];
      }
      case 'NEXT_PUBLIC_FF_ALERTES': {
        return config.nextPublicFfAlertes as VariableContenuDisponibleEnv[T];
      }
      case 'NEXT_PUBLIC_FF_ALERTES_BAISSE': {
        return config.nextPublicFfAlertesBaisse as VariableContenuDisponibleEnv[T];
      }
      case 'NEXT_PUBLIC_FF_APPLICATION_INDISPONIBLE': {
        return config.nextPublicFfApplicationIndisponible as VariableContenuDisponibleEnv[T];
      }
      case 'NEXT_PUBLIC_FF_FICHE_TERRITORIALE': {
        return config.nextPublicFfFicheTerritoriale as VariableContenuDisponibleEnv[T];
      }
      case 'NEXT_PUBLIC_FF_TA_ANNUEL': {
        return config.nextPublicFfTaAnnuel as VariableContenuDisponibleEnv[T];
      }
    }
  }
}

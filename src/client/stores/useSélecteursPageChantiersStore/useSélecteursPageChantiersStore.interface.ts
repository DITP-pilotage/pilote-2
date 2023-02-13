import { MailleInterne, TerritoireIdentifiant } from '@/server/domain/chantier/Chantier.interface';

export default interface SélecteursPageChantiersStore {
  mailleInterne: MailleInterne
  setMailleInterne: (mailleInterne: MailleInterne) => void
  périmètreGéographique: TerritoireIdentifiant
  setPérimètreGéographique: (périmètreGéographiqueIdentifiant: TerritoireIdentifiant) => void
  réinitialisePérimètreGéographique: () => void
}

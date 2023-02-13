import { MailleInterne, TerritoireIdentifiant } from '@/server/domain/chantier/Chantier.interface';

export default interface SélecteurDePérimètreGéographiqueProps {
  mailleInterne: MailleInterne,
  périmètreGéographique: TerritoireIdentifiant,
  setPérimètreGéographique: (périmètreGéographique: TerritoireIdentifiant) => void,
}

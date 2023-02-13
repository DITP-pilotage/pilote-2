import { MailleInterne } from '@/server/domain/chantier/Chantier.interface';

export default interface SélecteurDeMailleInterneProps {
  setMailleInterne: (state: MailleInterne) => void
  mailleInterne: MailleInterne
}

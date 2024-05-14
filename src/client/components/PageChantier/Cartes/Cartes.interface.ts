import { MailleRapportDetailleContrat } from '@/server/chantiers/app/contrats/ChantierRapportDetailleContrat';

export default interface CartesProps {
  chantierMailles: MailleRapportDetailleContrat,
  afficheCarteAvancement: boolean,
  afficheCarteMétéo: boolean,
  estInteractif?: boolean
}

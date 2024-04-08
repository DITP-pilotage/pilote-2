import Chantier from '@/server/domain/chantier/Chantier.interface';

export default interface CartesProps {
  chantierMailles: Chantier['mailles'],
  afficheCarteAvancement: boolean,
  afficheCarteMétéo: boolean,
  estInteractif?: boolean
}

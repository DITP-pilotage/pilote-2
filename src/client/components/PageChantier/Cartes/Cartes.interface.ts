import Chantier from '@/server/domain/chantier/Chantier.interface';

export default interface CartesProps {
  chantier: Chantier
  estInteractif?: boolean
}

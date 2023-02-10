import { MailleInterne } from '@/stores/useSélecteursPageChantiersStore/useSélecteursPageChantiersStore.interface';
import { CartographieDonnées, CartographieOptions } from '../CartographieAffichage/CartographieAffichage.interface';

export default interface CartographieTauxAvancementProps {
  données: CartographieDonnées,
  mailleInterne: MailleInterne,
  options?: Partial<CartographieOptions>,
}

import { CartographieOptions } from '@/components/_commons/Cartographie/useCartographie.interface';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';
import {
  CartographieÉlémentsDeLégende,
} from '@/client/components/_commons/Cartographie/Légende/CartographieLégende.interface';
import { MailleInterne } from '@/server/domain/maille/Maille.interface';

export type CartographieDonnéesAvancement = { valeur: number | null, codeInsee: CodeInsee, estApplicable: boolean | null }[];

export default interface CartographieAvancementProps {
  données: CartographieDonnéesAvancement,
  options?: Partial<CartographieOptions>,
  élémentsDeLégende: CartographieÉlémentsDeLégende
  auClicTerritoireCallback: (territoireCodeInsee: CodeInsee, territoireSélectionnable: boolean) => void
  territoireCode: string,
  pathname: '/accueil/chantier/[territoireCode]' | '/chantier/[id]/[territoireCode]' | null,
  mailleSelectionnee: MailleInterne,
}

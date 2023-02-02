import FiltresStore from '@/stores/useFiltresStore/useFiltresStore.interface';
import PérimètreMinistériel from '@/server/domain/périmètreMinistériel/PérimètreMinistériel.interface';

export type PérimètreMinistérielÉtat = {
  id: PérimètreMinistériel['id'],
  estSélectionné: boolean,
};

export type MinistèreÉtat = {
  id: Ministère['id'],
  estDéroulé: boolean,
  estSélectionné: boolean,
  périmètres: PérimètresMinistérielsÉtat,
};

export type PérimètresMinistérielsÉtat = Record<PérimètreMinistériel['id'], PérimètreMinistérielÉtat>;
export type MinistèresÉtat = Record<Ministère['id'], MinistèreÉtat>;

export type MinistèreÉtatAction = {
  type: 'BASCULER_EST_DÉROULÉ_MINISTÈRE',
  ministère: Ministère,
} | {
  type: 'SÉLECTIONNER_PÉRIMÈTRE' | 'DÉSÉLECTIONNER_PÉRIMÈTRE',
  périmètre: PérimètreMinistériel,
  ministère: Ministère,
};

export type Ministère = { id: string, nom: string, périmètresMinistériels: PérimètreMinistériel[] };

export default interface FiltresMinistèresProps {
  libellé: string
  catégorieDeFiltre: keyof FiltresStore['filtresActifs']
  ministères: Ministère[]
}

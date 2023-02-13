import {
  PérimètreGéographiqueIdentifiant,
} from '@/components/_commons/SélecteurDePérimètreGéographique/SélecteurDePérimètreGéographique.interface';
import { Maille } from '@/server/domain/chantier/Chantier.interface';

export default interface SélecteurDeTerritoireProps {
  territoire: PérimètreGéographiqueIdentifiant | null,
  setTerritoire: (territoire: PérimètreGéographiqueIdentifiant | null) => void,
  maille: Maille,
}

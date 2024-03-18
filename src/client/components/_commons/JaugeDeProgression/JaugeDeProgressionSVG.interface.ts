import { JaugeDeProgressionCouleur } from '@/components/_commons/JaugeDeProgression/JaugeDeProgression.interface';

export default interface JaugeDeProgressionSVGProps {
  couleur: JaugeDeProgressionCouleur;
  pourcentage: number | null;
  taille?: 'sm' | 'md' | 'lg';
}

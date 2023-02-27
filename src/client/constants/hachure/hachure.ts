import { Remplissage } from '@/components/_commons/Cartographie/Légende/CartographieLégende.interface';

export function estHachure(remplissage: Remplissage): boolean {
  return /url\(#.*\)/.test(remplissage);
}

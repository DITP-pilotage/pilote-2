import { typesObjectif as typesObjectifChantier } from '@/server/domain/chantier/objectif/Objectif.interface';
import { typeObjectifProjetStructurant } from '@/server/domain/projetStructurant/objectif/Objectif.interface';

export const typesObjectif = [...typesObjectifChantier, typeObjectifProjetStructurant] as const;
export type TypeObjectif = typeof typesObjectif[number];

export const libellésTypesObjectif: Record<TypeObjectif, string> = {
  notreAmbition: 'Notre ambition',
  déjàFait: 'Ce qui a déjà été fait',
  àFaire: 'Ce qui reste à faire',
  SuiviDesObjectifs: 'Suivi des objectifs',
};

export const consignesDÉcritureObjectif: Record<TypeObjectif, string> = {
  notreAmbition: 'Rappelez l’ambition politique de votre chantier à horizon 2026 : quels sont les objectifs ? Pourquoi les indicateurs choisis pour mesurer son avancement sont-ils importants ? Quels sont les leviers pour agir au niveau central et déconcentré ?',
  déjàFait: 'Quelles ont été les principales avancées au niveau national et au niveau déconcentré ?',
  àFaire: 'Quels sont les objectifs sur lesquels insister ? Quelles sont les principales actions envisagées ?',
  SuiviDesObjectifs: '',
};

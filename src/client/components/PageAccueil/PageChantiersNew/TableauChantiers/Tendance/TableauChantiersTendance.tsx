import { ChantierTendance } from '@/server/domain/chantier/Chantier.interface';
import { BadgeType } from '@/components/_commons/Badge/Badge.interface';
import Badge from '@/components/_commons/Badge/Badge';
import TableauChantiersTendanceProps
  from '@/components/PageAccueil/PageChantiers/TableauChantiers/Tendance/TableauChantiersTendance.interface';

export default function TableauChantiersTendance({ tendance }: TableauChantiersTendanceProps) {
  const badgeTypeÀPartirDeLaTendance: Record<NonNullable<ChantierTendance>, BadgeType> = {
    'HAUSSE': 'vert',
    'BAISSE': 'rouge',
    'STAGNATION': 'bleu',
  };
  const libelléÀPartirDeLaTendance: Record<NonNullable<ChantierTendance>, string> = {
    'HAUSSE': 'En hausse',
    'BAISSE': 'En baisse',
    'STAGNATION': 'Stable',
  };

  if (tendance === null) {
    return null;
  }

  return (
    <Badge type={badgeTypeÀPartirDeLaTendance[tendance]}>
      {libelléÀPartirDeLaTendance[tendance]}
    </Badge>
  );
}

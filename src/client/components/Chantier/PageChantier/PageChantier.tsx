import PageChantierProps from './PageChantier.interface';

export default function PageChantier({ chantier }: PageChantierProps) {
  return (
    <div>
      {chantier.nom}
    </div>
  );
}

import BarreDeProgression from '@/components/_commons/BarreDeProgression/BarreDeProgression';
import TableauChantiersAvancementProps from '@/components/PageChantiers/TableauChantiers/Avancement/TableauChantiersAvancement.interface';

export default function TableauChantiersAvancement({ avancement }: TableauChantiersAvancementProps) {
  return (
    avancement === null
      ? (
        <span className="texte-gris fr-text--xs">
          Non renseigné
        </span>
      ) : (
        <BarreDeProgression
          fond="gris"
          taille="petite"
          valeur={avancement}
          variante='primaire'
        />
      )
  );
}

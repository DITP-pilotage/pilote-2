import BarreDeProgression from '@/components/_commons/BarreDeProgression/BarreDeProgression';
import ListeChantiersAvancementProps
  from '@/components/PageChantiers/ListeChantiers/Avancement/ListeChantiersAvancement.interface';

export default function ListeChantiersAvancement({ avancement }: ListeChantiersAvancementProps) {
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

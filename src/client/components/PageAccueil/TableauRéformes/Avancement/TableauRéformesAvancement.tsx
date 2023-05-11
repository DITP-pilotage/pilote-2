import BarreDeProgression from '@/components/_commons/BarreDeProgression/BarreDeProgression';
import TableauRéformesAvancementProps from '@/components/PageAccueil/TableauRéformes/Avancement/TableauRéformesAvancement.interface';

export default function TableauRéformesAvancement({ avancement }: TableauRéformesAvancementProps) {
  return (
    avancement === null
      ? (
        <span className="texte-gris fr-text--xs">
          Non renseigné
        </span>
      ) : (
        <BarreDeProgression
          fond="blanc"
          taille="sm"
          valeur={avancement}
          variante='primaire'
        />
      )
  );
}

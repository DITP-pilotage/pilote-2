import BarreDeProgression from '@/components/_commons/BarreDeProgression/BarreDeProgression';
import TableauRéformesAvancementProps from '@/components/PageAccueil/TableauRéformes/Avancement/TableauRéformesAvancement.interface';
import { typeDeRéformeSélectionnéeStore } from '@/client/stores/useTypeDeRéformeStore/useTypeDeRéformeStore';

export default function TableauRéformesAvancement({ avancement }: TableauRéformesAvancementProps) {
  const typeDeRéforme = typeDeRéformeSélectionnéeStore();
  
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
          variante={typeDeRéforme === 'chantier' ? 'primaire' : 'rose'}
        />
      )
  );
}

import Titre from '@/components/_commons/Titre/Titre';
import ExplicationEtapeIndicateur from './ExplicationEtapeIndicateur/ExplicationEtapeIndicateur';
import PageImportIndicateurExplicationEtapeImportStyled from './PageImportIndicateurExplicationEtapeImport.styled';

interface ExplicationEtape {
  titre: string,
  texte: string
}

const explicationsEtapeImport: ExplicationEtape[] = [
  {
    titre: 'Sélectionner l’indicateur',
    texte: 'Sélectionnez l’indicateur que vous souhaitez mettre à jour et cliquez sur le bouton “importer des données”. Vous pourrez ensuite télécharger le modèle à remplir ou adapter votre fichier au formalisme demandé.',
  },
  {
    titre: 'Charger le fichier',
    texte: 'Dès que votre fichier vous semble correct, vous pouvez le charger pour vérifier que la structure de vos données est conforme au modèle. Un rapport d’erreurs vous renseignera sur les potentiels éléments à adapter.',
  },
  {
    titre: 'Publier le fichier validé',
    texte: 'Prévisualisez vos données et validez la publication. Vous devrez ensuite attendre au maximum 24h pour que ces données soient prises en compte dans le calcul des taux d’avancement. Vous pouvez mettre à jour d’autres indicateurs.',
  },
];

export default function PageImportIndicateurExplicationEtapeImport() {
  return (
    <PageImportIndicateurExplicationEtapeImportStyled>
      <div className='fr-container fr-pt-2w fr-pb-3w'>
        <Titre
          baliseHtml='h2'
          className='fr-h4'
        >
          3 étapes pour mettre à jour vos données
        </Titre>
        <ol className='fr-grid-row fr-grid-row--gutters fr-m-0 fr-p-0'>
          {explicationsEtapeImport.map(({ titre, texte }, index) => (
            <li
              className='fr-col-lg-4'
              key={titre}
            >
              <ExplicationEtapeIndicateur
                numéro={index + 1}
                texte={texte}
                titre={titre}
              />
            </li>
          ))}
        </ol>
      </div>
    </PageImportIndicateurExplicationEtapeImportStyled>
  );
}

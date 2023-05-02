import { useState } from 'react';
import Titre from '@/components/_commons/Titre/Titre';
import IndicateurDEtapes from '@/components/_commons/IndicateurDEtapes/IndicateurDEtapes';
import Bloc from '@/components/_commons/Bloc/Bloc';
import Sélecteur from '@/components/_commons/Sélecteur/Sélecteur';
import Bouton from '@/components/_commons/Bouton/Bouton';
import PageImportIndicateurSectionImportStyled from './PageImportIndicateurSectionImport.styled';
import { PageImportIndicateurSectionImportProps } from './PageImportIndicateurSectionImport.interface';

const étapes = ['Sélectionnez l’indicateur', 'Chargez votre fichier et vérifiez sa conformité ', 'Prévisualiser les données et les publier ']; 

export default function PageImportIndicateurSectionImport({
  indicateurs,
}: PageImportIndicateurSectionImportProps) {
  const [etapeCourante, setEtapeCourante] = useState(1);
  const optionsSélecteur = indicateurs.map(elem => ({
    libellé: elem.nom,
    valeur: elem.id,
  }));

  enum Etapes {
    SELECTION_INDICATEUR = 1,
  }
  
  return (
    <PageImportIndicateurSectionImportStyled>
      <div className='fr-container fr-py-3w'>
        <Titre baliseHtml='h2'>
          Importez vos données
        </Titre>
        <Bloc>
          <IndicateurDEtapes
            étapeCourante={etapeCourante}
            étapes={étapes}
          />
          <form action="">
            <div className={`${etapeCourante !== Etapes.SELECTION_INDICATEUR && 'fr-hidden'}`}>
              <Titre baliseHtml='h4'>
                Pour quel indicateur souhaitez vous mettre à jour les données ?
              </Titre>
              <Sélecteur
                htmlName="indicateurId"
                libellé='Choix de l’indicateur'
                options={optionsSélecteur}
              />
              <Bouton
                label="Suivant"
                onClick={() => setEtapeCourante(etapeCourante + 1)}
              />
            </div>
          </form>
        </Bloc>
      </div>
    </PageImportIndicateurSectionImportStyled>
  );
}

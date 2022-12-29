import { Fragment } from 'react';
import Bloc from '@/components/_commons/Bloc/Bloc';
import Titre from '@/components/_commons/Titre/Titre';
import EnTête from '@/components/_commons/Bloc/EnTête/EnTête';
import ResponsablesStyled from './Responsables.styled';

const nonRenseigné = 'Non renseigné';

const responsables = [
  { libellé: 'Ministère porteur', nom: nonRenseigné },
  { libellé: 'Autres ministères co-porteurs', nom: nonRenseigné },
  { libellé: 'Directeur d’Administration Centrale', nom: nonRenseigné },
  { libellé: 'Nom du Directeur de Projet', nom: nonRenseigné },
];

export default function Responsables() {
  return (
    <ResponsablesStyled id="responsables">
      <Titre baliseHtml='h2'>
        Responsables
      </Titre>
      <Bloc>
        <EnTête libellé='National' />
        <div className="fr-mt-3w">
          {responsables.map(responsable => (
            <Fragment key={responsable.libellé}>
              <div className='fr-pl-2w fr-grid-row'>
                <p className='fr-text--sm fr-text--bold fr-col fr-mr-4w'>
                  {responsable.libellé}
                </p>
                <p className='fr-text--sm fr-col'>
                  {responsable.nom}
                </p>
              </div>
              <hr className='fr-hr' />
            </Fragment>
          ))}
        </div>
      </Bloc>
    </ResponsablesStyled>
  );
}

import { FunctionComponent } from 'react';
import HeaderFicheTerritoriale from '@/components/PageFicheTerritoriale/HeaderFicheTerritoriale';
import { TerritoireContrat } from '@/server/fiche-territoriale/app/contrats/TerritoireContrat';
import Encart from '@/components/_commons/Encart/Encart';
import Titre from '@/components/_commons/Titre/Titre';

export const PageFicheTerritoriale: FunctionComponent<{ territoire: TerritoireContrat }> = ({ territoire }) => {
  const now = new Date();

  return (
    <>
      <div className='flex justify-end'>
        <button
          className='fr-btn fr-btn--tertiary-no-outline fr-icon-printer-line fr-btn--icon-left fr-text--sm'
          onClick={() => window.print()}
          type='button'
        >
          Imprimer
        </button>
      </div>
      <HeaderFicheTerritoriale />
      <main>
        <Encart>
          <Titre
            baliseHtml='h2'
            className='fr-h2 fr-mb-0 fr-text-title--blue-france'
          >
            { `Fiche territoriale de synthèse ${territoire.nomAffiché}`}
          </Titre>
        </Encart>
        <p className='fr-px-2w fr-m-0'>
          <i className='fr-text--sm fr-ital'>
            { `Fiche de synthèse généré le ${now.toLocaleString()}`}
          </i>
        </p>
        <Titre
          baliseHtml='h1'
          className='fr-h2 fr-mt-2w'
        >
          Vue générale
        </Titre>

      </main>
    </>
  );
};

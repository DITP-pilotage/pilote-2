import '@gouvfr/dsfr/dist/utility/icons/icons-device/icons-device.min.css';
import '@gouvfr/dsfr/dist/utility/icons/icons-document/icons-document.min.css';
import '@gouvfr/dsfr/dist/dsfr.min.css';
import Link from 'next/link';
import { FunctionComponent } from 'react';
import BoutonImpression from '@/components/_commons/BoutonImpression/BoutonImpression';
import Titre from '@/components/_commons/Titre/Titre';
import { ResponsableRapportDetailleContrat } from '@/server/chantiers/app/contrats/ChantierRapportDetailleContrat';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import PageChantierEnTêteStyled from './EnTête.styled';
import ResponsableChantierEnTete from './EnTêteResponsables';

interface PageChantierEnTêteProps {
  chantier: Chantier
  hrefBoutonRetour: string
  responsables?: ResponsableRapportDetailleContrat
  afficheLeBoutonImpression?: boolean
  afficheLeBoutonMiseAJourDonnee?: boolean
  afficheLeBoutonFicheConducteur?: boolean
}

const PageChantierEnTête: FunctionComponent<PageChantierEnTêteProps> = ({
  chantier,
  responsables,
  afficheLeBoutonImpression = false,
  afficheLeBoutonMiseAJourDonnee = false,
  afficheLeBoutonFicheConducteur = false,
  hrefBoutonRetour = '',
}) => {

  const listeNomsResponsablesMinistèrePorteur: string[] = [responsables?.porteur?.nom].filter(Boolean);
  const listeNomsResponsablesAutresMinistèresCoPorteurs = (responsables?.coporteurs || []).map(coporteur => coporteur.nom).filter(Boolean);
  const listeNomsDirecteursAdministrationCentrale = (responsables?.directeursAdminCentrale || []).map(directeurAdminCentrale => (`${directeurAdminCentrale.nom}  (${directeurAdminCentrale.direction})`)).filter(Boolean);

  return (
    <PageChantierEnTêteStyled className='fr-px-2w fr-px-md-2w fr-py-2w'>
      <Link
        aria-label="Retour à l'accueil"
        className='fr-link fr-fi-arrow-left-line fr-link--icon-left fr-mb-3w fr-mt-2w btn-retour'
        href={hrefBoutonRetour}
      >
        Retour
      </Link>
      <Titre
        baliseHtml='h1'
        className='fr-h2 fr-mb-2w'
      >
        {chantier.nom}
      </Titre>
      <ResponsableChantierEnTete
        libellé='Ministère porteur'
        listeNomsResponsables={listeNomsResponsablesMinistèrePorteur}
      />
      <ResponsableChantierEnTete
        libellé='Autres ministères co-porteurs'
        listeNomsResponsables={listeNomsResponsablesAutresMinistèresCoPorteurs}
      />
      <ResponsableChantierEnTete
        libellé='Directeur(s) / directrice(s) d’Administration Centrale'
        listeNomsResponsables={listeNomsDirecteursAdministrationCentrale}
      />
      <div className='flex flex-direction-row justify-start align-center fr-mt-md-2w format-mobile'>
        {
          !!afficheLeBoutonMiseAJourDonnee &&
            <Link
              className='fr-btn fr-btn--primary fr-mr-md-2w format-mobile__bouton'
              href={`${chantier.id}/indicateurs`}
              title='Mettre à jour les données'
            >
              Mettre à jour les données
            </Link>   
        }
        {
          !!afficheLeBoutonImpression && (
            <div className='format-mobile__bouton-impression'> 
              <BoutonImpression />       
            </div>
          )
        }
        {
          afficheLeBoutonFicheConducteur ? (
            <Link
              className='fr-btn fr-btn--secondary fr-icon-article-line fr-btn--icon-left fr-px-1w fr-px-md-2w fr-ml-md-2w format-mobile__bouton'
              href={`${chantier.id}/fiche-conducteur`}
              title='Fiche conducteur'
            >
              Fiche conducteur
            </Link>
          ) : null
        }
      </div>
    </PageChantierEnTêteStyled>
  );
};

export default PageChantierEnTête;

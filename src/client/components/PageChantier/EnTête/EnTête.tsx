import '@gouvfr/dsfr/dist/utility/icons/icons-device/icons-device.min.css';
import '@gouvfr/dsfr/dist/utility/icons/icons-document/icons-document.min.css';
import '@gouvfr/dsfr/dist/dsfr.min.css';
import Link from 'next/link';
import { FunctionComponent } from 'react';
import BoutonImpression from '@/components/_commons/BoutonImpression/BoutonImpression';
import Titre from '@/components/_commons/Titre/Titre';
import { ResponsableRapportDetailleContrat } from '@/server/chantiers/app/contrats/ChantierRapportDetailleContrat';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import { getQueryParamString } from '@/client/utils/getQueryParamString';
import { estLargeurDÉcranActuelleMoinsLargeQue } from '@/client/stores/useLargeurDÉcranStore/useLargeurDÉcranStore';
import { getFiltresActifs } from '@/client/stores/useFiltresStoreNew/useFiltresStoreNew';
import PageChantierEnTêteStyled from './EnTête.styled';
import { ResponsableChantierEnTete } from './EnTêteResponsables';
import { ResponsabiliteChantierEnTete } from './ResponsabiliteChantierEnTete';

interface PageChantierEnTêteProps {
  chantier: Chantier
  responsables?: ResponsableRapportDetailleContrat
  afficheLeBoutonImpression?: boolean
  afficheLeBoutonMiseAJourDonnee?: boolean
  afficheLeBoutonFicheConducteur?: boolean
  territoireCode: string
}

const PageChantierEnTête: FunctionComponent<PageChantierEnTêteProps> = ({
  chantier,
  responsables,
  afficheLeBoutonImpression = false,
  afficheLeBoutonMiseAJourDonnee = false,
  afficheLeBoutonFicheConducteur = false,
  territoireCode,
}) => {
  const estVueMobile = estLargeurDÉcranActuelleMoinsLargeQue('sm');
  const listeNomsResponsablesMinistèrePorteur: string[] = [responsables?.porteur?.nom].filter(Boolean);
  const listeNomsResponsablesAutresMinistèresCoPorteurs = (responsables?.coporteurs || []).map(coporteur => coporteur.nom).filter(Boolean);
  const listeNomsDirecteursAdministrationCentrale = (responsables?.directeursAdminCentrale || []).map(directeurAdminCentrale => (`${directeurAdminCentrale.nom}  (${directeurAdminCentrale.direction})`)).filter(Boolean);

  const queryParamString = getQueryParamString(getFiltresActifs());
  const hrefBoutonRetour = `/accueil/chantier/${territoireCode}${queryParamString.length > 0 ? `?${queryParamString}` : ''}`;

  const nomChantier = chantier.nom.length > 50 ? `${chantier.nom.slice(0, 50)}...` : chantier.nom;

  return (
    <PageChantierEnTêteStyled>
      <Link
        aria-label="Retour à l'accueil"
        className='fr-link fr-fi-arrow-left-line fr-link--icon-left fr-mb-3w fr-mt-2w btn-retour'
        href={hrefBoutonRetour}
      >
        Retour
      </Link>
      <div className='container-titre-chantier'>
        <Titre
          baliseHtml='h1'
          className='fr-h2 fr-mb-2w fr-mt-1w titre-chantier'
        >
          {nomChantier}
        </Titre>
      </div>
      <div className='fr-pb-3w fr-mb-3w border-b border-blue-france'>
        <ResponsableChantierEnTete
          icone={responsables?.porteur?.icône || 'remix::government::fill'}
          iconeStyle='icone'
          isUppercase
          listeNomsResponsables={listeNomsResponsablesMinistèrePorteur}
        />
      </div>
      <div className='fr-mb-1w'>
        <ResponsableChantierEnTete
          icone='fr-icon-government-fill'
          libellé='Autres ministères co-porteurs'
          listeNomsResponsables={listeNomsResponsablesAutresMinistèresCoPorteurs}
          size='sm'
        />
      </div>
      <div className='fr-mb-1w'>
        <ResponsableChantierEnTete
          icone='fr-icon-account-circle-fill'
          libellé="Directeur(s) / directrice(s) d'Administration Centrale"
          listeNomsResponsables={listeNomsDirecteursAdministrationCentrale}
          size='sm'
        />
      </div>
      <ResponsabiliteChantierEnTete
        chantier={chantier}
      />
      <div className='fr-mt-md-2w format-mobile fr-ml-1w'>
        {
          afficheLeBoutonMiseAJourDonnee && !estVueMobile ? (
            <div className='fr-mb-1v'>
              <Link
                className='lien-menu fr-link fr-link--icon-left fr-icon-download-line fr-btn--icon-left fr-text--sm fr-p-0 no-underline border-b border-blue-france'
                href={`/chantier/${chantier.id}/indicateurs`}
                title='Mettre à jour les données'
              >
                Mettre à jour les données
              </Link>
            </div>
          ) : null
        }
        {
          afficheLeBoutonImpression && !estVueMobile ? (
            <div className='format-mobile-bouton-impression fr-mb-1v'>
              <BoutonImpression />
            </div>
          ) : null
        }
        {
          afficheLeBoutonFicheConducteur && !estVueMobile ? (
            <Link
              className='lien-menu fr-link fr-link--icon-left fr-icon-article-line fr-btn--icon-left fr-text--sm fr-p-0 no-underline border-b border-blue-france'
              href={`/chantier/${chantier.id}/fiche-conducteur`}
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

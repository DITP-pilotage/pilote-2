import '@gouvfr/dsfr/dist/utility/icons/icons-device/icons-device.min.css';
import '@gouvfr/dsfr/dist/utility/icons/icons-document/icons-document.min.css';
import '@gouvfr/dsfr/dist/dsfr.min.css';
import Link from 'next/link';
import BoutonImpression from '@/components/_commons/BoutonImpression/BoutonImpression';
import Titre from '@/components/_commons/Titre/Titre';
import { ajoutVirguleAprèsIndex } from '@/client/utils/strings';
import { DirecteurAdministrationCentraleRapportDetailleContrat, MinistereCoporteurRapportDetailleContrat, ResponsableRapportDetailleContrat } from '@/server/chantiers/app/contrats/ChantierRapportDetailleContrat';
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

export default function PageChantierEnTête({
  chantier,
  responsables,
  afficheLeBoutonImpression = false,
  afficheLeBoutonMiseAJourDonnee = false,
  afficheLeBoutonFicheConducteur = false,
  hrefBoutonRetour = '',
}: PageChantierEnTêteProps) {

  const ajouterVirguleAprèsIndexCoporteur = (coporteur: MinistereCoporteurRapportDetailleContrat, index: number) =>
    (`${ajoutVirguleAprèsIndex(index)}${coporteur.nom}`);

  const ajouterVirguleAprèsIndexDirecteurAdminCentral = (directeurAdminCentrale: DirecteurAdministrationCentraleRapportDetailleContrat, index: number ) => 
    (`${ajoutVirguleAprèsIndex(index)}${directeurAdminCentrale.nom} (${directeurAdminCentrale.direction})`);
  
  const listeNomsResponsablesMinistèrePorteur = responsables?.porteur?.nom ? [responsables.porteur.nom] : [];
  const listeNomsResponsablesAutresMinistèresCoPorteurs = responsables?.coporteurs.map(ajouterVirguleAprèsIndexCoporteur).filter(Boolean) || [];
  const listesNomsDirecteursAdministrationCentrale = responsables?.directeursAdminCentrale.map(ajouterVirguleAprèsIndexDirecteurAdminCentral).filter(Boolean) || [];

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
        listeNomsResponsables={
          (listeNomsResponsablesAutresMinistèresCoPorteurs)
        }
      />
      <ResponsableChantierEnTete 
        libellé='Directeur(s) / directrice(s) d’Administration Centrale'
        listeNomsResponsables={listesNomsDirecteursAdministrationCentrale}
      />
      <div className='flex align-center fr-mt-2w'>
        {
          !!afficheLeBoutonMiseAJourDonnee &&
            <Link
              className='fr-btn fr-btn--primary fr-mr-2w'
              href={`${chantier.id}/indicateurs`}
              title='Mettre à jour les données'
            >
              Mettre à jour les données
            </Link>
        }
        {
          !!afficheLeBoutonImpression && <BoutonImpression />
        }
        {
          afficheLeBoutonFicheConducteur ? (
            <Link
              className='fr-btn fr-btn--secondary fr-icon-article-line fr-btn--icon-left fr-px-1w fr-px-md-2w fr-ml-2w'
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
}

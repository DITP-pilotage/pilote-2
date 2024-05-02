import Link from 'next/link';
import DonneesPersonnellesCookiesStyled from './DonneesPersonnellesCookies.styled';

const DonneesPersonnellesCookies = () => {
  return (
    <DonneesPersonnellesCookiesStyled>
      <main>
        <div className='fr-container container'>
          <div className='fr-grid-row fr-grid-row--center fr-py-4w'>
          
            <h1 className='fr-h1 fr-col-12'>
              Données personnelles et cookies
            </h1>
            <p className='fr-text fr-col-12'>
              La Direction interministérielle de la transformation publique (mission Pilotage), 
              située 20 avenue de Ségur à Paris (75007), est responsable du traitement des données personnelles pour le site PILOTE.
            </p>
            <p className='fr-text fr-col-12'>
              Pour toute question au sujet de la gestion des cookies, vous pouvez utiliser l’adresse suivante : 
              {' '}
              <Link
                href='mailto:support.ditp@modernisation.gouv.fr'
                title='Envoyer un courriel à support.ditp@modernisation.gouv.fr'
              >
                support.ditp@modernisation.gouv.fr
              </Link>
            </p>  
            <h2 className='fr-h2 fr-col-12'>
              Cookies
            </h2>
            <h4 className='fr-h4 fr-col-12'>
              Informations cookies
            </h4>
            <p className='fr-text fr-col-12'>
              Lors de la consultation de notre site 
              {' '}
              <Link
                href='https://pilote.modernisation.gouv.fr'
                title='Lien vers pilote.modernisation.gouv.fr'
              >
                https://pilote.modernisation.gouv.fr
              </Link>
              , des cookies sont déposés sur votre ordinateur, 
              votre mobile ou votre tablette.
            </p>
            <h4 className='fr-h4 fr-col-12'>
              Définition d'un cookie
            </h4>
            <p className='fr-text fr-col-12'>
              Un cookie est un fichier texte déposé sur votre ordinateur et stocké par votre navigateur internet lors de la visite d’un
              site ou de la consultation d’une publicité. Il a pour but de collecter des informations relatives à votre navigation et de 
              vous adresser des services adaptés à votre terminal (ordinateur, mobile ou tablette).
            </p>
            <h4 className='fr-h4 fr-col-12'>
              Détails des cookies utilisés sur Pilote
            </h4>
            <p className='fr-text fr-col-12 fr-mb-0 fr-pb-1v'>
              Deux types de cookies sont déposés sur 
              {' '}
              <Link
                href='https://pilote.modernisation.gouv.fr'
                title='Lien vers pilote.modernisation.gouv.fr'
              >
                https://pilote.modernisation.gouv.fr
              </Link>
              {' '}
              :
            </p>
            <ul className='fr-text fr-col-12'>
              <li>
                Les cookies techniques qui nous permettent de personnaliser votre utilisation du site 
                {' '}
                <Link
                  href='https://pilote.modernisation.gouv.fr'
                  title='Lien vers pilote.modernisation.gouv.fr'
                >
                  https://pilote.modernisation.gouv.fr 
                </Link> 
                {' '}
                (par exemple afficher des cartes ou des réformes spécifiques suivant votre profil).
              </li>
              <li>
                Les cookies destinés à la mesure d’audience qui permettent :
                <ul>
                  <li>
                    La mesure de l’audience, page par page ;
                  </li>
                  <li>
                    La liste des pages à partir desquelles un lien a été suivi ;
                  </li>
                  <li>
                    Les types de terminal et navigateur des visiteurs, par page et agrégé de manière journalière ;
                  </li>
                  <li>
                    Des statistiques de temps de chargement des pages, par page et agrégée de manière horaire ;
                  </li>
                  <li>
                    Des statistiques de temps passé sur chaque page, par page et agrégée de manière journalière.
                  </li>
                </ul>
              </li>
            </ul>
            <p className='fr-text fr-col-12'>
              Pour assurer le suivi d’audience sur PILOTE, nous utilisons 
              {' '}
              <Link
                href='https://matomo.org/'
                title='Lien vers matomo.org'
              >
                Matomo
              </Link>
              , un outil libre, 
              paramétré pour être en conformité avec la recommandation « Cookies » de la 
              {' '}
              <Link
                href='https://www.cnil.fr/fr/cookies-et-autres-traceurs/regles/cookies-solutions-pour-les-outils-de-mesure-daudience'
                title='Lien vers /www.cnil.fr/fr/cookies-et-autres-traceurs/regles/cookies-solutions-pour-les-outils-de-mesure-daudience'
              >
                CNIL 
              </Link>
              . Cela signifie que votre adresse IP, par exemple, 
              est anonymisée avant d’être enregistrée. Il est donc impossible d’associer vos visites sur ce site à votre personne.
            </p>
            <p className='fr-text fr-col-12'>
              Si vous souhaitez désactiver ce suivi statistique, il vous suffit d’activer la fonctionnalité 
              « Ne pas me pister » de votre navigateur. Notre outil de suivi le prendra en compte, et cessera d’inclure vos visites dans les statistiques.
            </p>
            <h2 className='fr-h2 fr-col-12'>
              Données personnelles
            </h2>
            <h4 className='fr-h4 fr-col-12'>
              Droit d'accès, de modification, et de suppression
            </h4>
            <p className='fr-text fr-col-12'>
              Conformément au RGPD et à la loi « Informatique et Libertés » du 6 janvier 1978 modifiée, 
              vous disposez d’un droit d’accès (article 15 du RGPD) et de rectification (article 16 du RGPD) 
              des données vous concernant ainsi que d’un droit à demander la limitation du traitement de vos données (article 18 du RGPD).
            </p>
            <p className='fr-text fr-col-12'>
              Vous pouvez exercer ces droits en transmettant votre demande au responsable de traitement par voie postale à :
              <br />
              Direction interministérielle de la transformation publique - TSA 70732 - 75334 Paris Cedex 07
              <br />
              ou par courriel à :
              {' '}
              <Link
                href='mailto:support.ditp@modernisation.gouv.fr'
                title='Envoyer un courriel à support.ditp@modernisation.gouv.fr'
              >
                support.ditp@modernisation.gouv.fr
              </Link>
            </p>
            <p className='fr-text fr-col-12'>
              Pour des demandes plus largement sur l’application du RGPD vous pouvez contacter l’adresse :  
              {' '}
              <Link
                href='mailto:contactrgpd.ditp@modernisation.gouv.fr'
                title='Envoyer un courriel à contactrgpd.ditp@modernisation.gouv.fr'
              >
                contactrgpd.ditp@modernisation.gouv.fr
              </Link>
            </p>
            <p className='fr-text fr-col-12'>
              Pour toute demande d’information complémentaire sur la protection des données, merci de nous contacter à l’adresse suivante :
              {' '}
              <Link
                href='mailto:contactrgpd.ditp@modernisation.gouv.fr'
                title='Envoyer un courriel à contactrgpd.ditp@modernisation.gouv.fr'
              >
                contactrgpd.ditp@modernisation.gouv.fr
              </Link>
              <br />
              En cas de difficulté non résolue, vous pouvez contacter la CNIL.
            </p>

          </div>
        </div>
      </main>
    </DonneesPersonnellesCookiesStyled>
  );
};

export default DonneesPersonnellesCookies;

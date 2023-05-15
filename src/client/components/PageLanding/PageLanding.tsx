import '@gouvfr/dsfr/dist/component/card/card.min.css';
import Image from 'next/image';
import carteFranceSvg from '@gouvfr/dsfr/dist/artwork/pictograms/map/location-france.svg';
import visualisationDonnéesSvg from '@gouvfr/dsfr/dist/artwork/pictograms/digital/data-visualization.svg';
import téléchargementFichierSvg from '@gouvfr/dsfr/dist/artwork/pictograms/document/document-download.svg';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import Head from 'next/head';
import PageLandingStyled from '@/components/PageLanding/PageLanding.styled';
import Titre from '@/components/_commons/Titre/Titre';
import captureÉcranPilote from '/public/img/landing/capture-écran-pilote.png';
import baromètreCarteSvg from '/public/img/landing/baromètre-carte-france.svg';

export default function PageLanding() {
  return (
    <>
      <Head>
        <title>
          PILOTE - Piloter l’action publique par les résultats
        </title>
      </Head>
      <PageLandingStyled>
        <section className='bloc-hero'>
          <div className='fr-container'>
            <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--center">
              <div className="fr-col-12 fr-col-lg-6 fr-pt-8w">
                <Titre
                  baliseHtml='h1'
                >
                  Piloter l’action publique par les résultats
                </Titre>
                <p className='fr-text--xl'>
                  PILOTE est l’outil de pilotage territorialisé des politiques prioritaires du Gouvernement. Il permet de partager les objectifs assignés à chaque chantier et les résultats obtenus afin d’identifier les freins et obstacles rencontrés.
                  <br />
                  <br />
                  PILOTE sert ainsi à ajuster les actions entreprises, organiser l’appui des administrations centrales et rendre les arbitrages nécessaires pour garantir l’atteinte des objectifs de la feuille de route du Gouvernement.
                </p>
                <button
                  className='fr-btn fr-mr-2w'
                  onClick={() => signIn('keycloak')}
                  type='button'
                >
                  Se connecter
                </button>
              </div>
              <div className="fr-col-12 fr-col-lg-6 fr-hidden fr-unhidden-lg conteneur-capture-pilote">
                <Image
                  alt=""
                  src={captureÉcranPilote}
                />
              </div>
            </div>
          </div>
        </section>
        <section className='bloc-pour-qui'>
          <div className='fr-container fr-py-8w'>
            <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--center">
              <div className="fr-col-12">
                <Titre
                  baliseHtml='h2'
                  className='fr-h3'
                >
                  A qui s’adresse PILOTE ?
                </Titre>
                <p className="fr-text--lg" >
                  PILOTE mobilise l’ensemble des responsables de la mise en œuvre des politiques prioritaires du Gouvernement à tous les niveaux de l’organisation administrative.
                </p>
              </div>
            </div>
            <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--center">
              <div className="fr-col-12 fr-col-md-4">
                <div className="conteneur-pictogramme">
                  <Image 
                    alt=""
                    fill
                    src={carteFranceSvg}
                  />
                </div>
                <div className='fr-p-4w'>
                  <Titre
                    baliseHtml='h3'
                    className='fr-h5'
                  >
                    Pour les administrations centrales
                  </Titre>
                  <p className="fr-text--lg fr-mb-0" >
                    PILOTE permet de fixer les objectifs aux services déconcentrés, de suivre l’avancement des chantiers et d’en rendre compte. Il permet d’identifier les freins et blocages pour apporter l’appui aux équipes opérationnelles sur le terrain ou susciter des arbitrages ministériels ou interministériels pour les lever.
                  </p>
                </div>
              </div>
              <div className="fr-col-12 fr-col-md-4">
                <div className="conteneur-pictogramme">
                  <Image 
                    alt=""
                    fill
                    src={visualisationDonnéesSvg}
                  />
                </div>
                <div className='fr-p-4w'>
                  <Titre
                    baliseHtml='h3'
                    className='fr-h5'
                  >
                    Pour les préfets
                  </Titre>
                  <p className="fr-text--lg fr-mb-0">
                    PILOTE offre aux préfets une vision transversale des objectifs et résultats de la feuille de route du Gouvernement dans le territoire pour lequel ils sont chargés d’en superviser la mise en œuvre. Dans une logique de « management par exception », il leur permet d’identifier les chantiers sur lesquels un appui est nécessaire.
                  </p>
                </div>
              </div>
              <div className="fr-col-12 fr-col-md-4">
                <div className="conteneur-pictogramme">
                  <Image 
                    alt=""
                    fill
                    src={téléchargementFichierSvg}
                  />
                </div>
                <div className='fr-p-4w'>
                  <Titre
                    baliseHtml='h3'
                    className='fr-h5'
                  >
                    Pour les services déconcentrés
                  </Titre>
                  <p className="fr-text--lg fr-mb-0">
                    PILOTE permet de s’entendre avec l’administration centrale sur les objectifs de chaque chantier prioritaire et de rendre compte des résultats obtenus. Il permet aussi d’alerter sur les obstacles rencontrés afin de demander des arbitrages, des ressources ou un appui du préfet, des équipes régionales ou des administrations centrales.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className='bloc-pilotage-ppg'>
          <div className='fr-container fr-py-8w'>
            <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--center">
              <div className="fr-col-12 fr-col-lg-8 fr-pr-md-4w">
                <Titre
                  baliseHtml='h2'
                  className='fr-h3'
                >
                  Le pilotage des politiques prioritaires
                </Titre>
                <p className='fr-text--lg'>
                  Les politiques prioritaires du Gouvernement font l&apos;objet d&apos;un suivi régulier à haut niveau dans chaque ministère mais aussi au niveau interministériel. Chaque trimestre, les ministères présentent leurs résultats dans des réunions présidées par le secrétaire général de la Présidence de la République et le directeur du cabinet de la Première ministre.
                </p>
                <p className='fr-text--lg bold'>
                  Objectif : veiller en continu à la cohérence des objectifs et des décisions, au rythme de mise en œuvre des chantiers et rendre les arbitrages pour lever les freins rencontrés.
                </p>
                <p className='fr-text--lg'>
                  La DITP est chargée d’animer, sous l’autorité de la Première ministre, le déploiement des politiques prioritaires du Gouvernement et la supervision interministérielle de leur mise en œuvre.
                </p>
                <Link
                  className='fr-btn fr-btn--secondary fr-mt-3w'
                  href="https://www.modernisation.gouv.fr/transformer-laction-publique/assurer-la-mise-en-oeuvre-des-politiques-prioritaires-du-gouvernement"
                  target="_blank"
                >
                  En savoir plus
                </Link>
              </div>
              <div className="fr-col-12 fr-col-lg-4">
                <div className="fr-card fr-enlarge-link">
                  <div className="fr-card__body">
                    <div className="fr-card__content">
                      <Titre
                        baliseHtml='h2'
                        className='fr-h3'
                      >
                        {/* eslint-disable-next-line react/jsx-max-depth */}
                        <Link
                          href="https://www.gouvernement.fr/les-actions-du-gouvernement"
                          target="_blank"
                        >
                          Le baromètre des résultats de l’action publique
                        </Link>
                      </Titre>
                      <p className="fr-card__desc">
                        Le baromètre des résultats de l’action publique reprend les données de PILOTE pour rendre compte de l’avancement des politiques publiques aux citoyens.
                      </p>
                    </div>
                  </div>
                  <div className="fr-card__header">
                    <div className="fr-card__img">
                      <Image
                        alt=""
                        className="fr-responsive-img"
                        src={baromètreCarteSvg}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className='bloc-questions'>
          <div className='fr-container'>
            <div className="fr-grid-row fr-py-8w">
              <Titre
                baliseHtml='h2'
                className='fr-h3 fr-m-0'
              >
                Vous avez des questions ?
              </Titre>
              <Link
                className='fr-btn fr-ml-6w'
                href="mailto:support.ditp@modernisation.gouv.fr"
                target="_blank"
              >
                Contacter l&apos;équipe
              </Link>
            </div>
          </div>
        </section>
      </PageLandingStyled>
    </>
  );
}

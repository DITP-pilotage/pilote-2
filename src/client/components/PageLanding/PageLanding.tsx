import '@gouvfr/dsfr/dist/component/card/card.min.css';
import Image from 'next/image';
import carteFranceSvg from '@gouvfr/dsfr/dist/artwork/pictograms/map/location-france.svg';
import visualisationDonnéesSvg from '@gouvfr/dsfr/dist/artwork/pictograms/digital/data-visualization.svg';
import téléchargementFichierSvg from '@gouvfr/dsfr/dist/artwork/pictograms/document/document-download.svg';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import PageLandingStyled from '@/components/PageLanding/PageLanding.styled';
import Titre from '@/components/_commons/Titre/Titre';
import captureÉcranPilote from '/public/img/landing/capture-écran-pilote.png';
import baromètreCarteSvg from '/public/img/landing/baromètre-carte-france.svg';

export default function PageLanding() {
  return (
    <PageLandingStyled>
      <section className='bloc-hero'>
        <div className='fr-container'>
          <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--center">
            <div className="fr-col-12 fr-col-lg-6 fr-py-8w">
              <Titre
                baliseHtml='h1'
              >
                Piloter l’action publique par les résultats
              </Titre>
              <p className='fr-text--xl'>
                PILOTE permet de rendre compte des résultats des politiques prioritaires à chaque échelon territorial et de prévenir rapidement les difficultés de mise en œuvre.
              </p>
              <p className='fr-text--xl'>
                PILOTE est réservé aux agents de l’Etat impliqués sur les politiques prioritaires.
              </p>
              <button
                className='fr-btn fr-mr-2w'
                onClick={() => signIn('keycloak')}
                type='button'
              >
                Se connecter
              </button>
            </div>
            <div className="fr-col-12 fr-col-lg-6 fr-hidden fr-unhidden-lg conteneur-capture-pilote fr-pb-0">
              <Image
                alt=""
                src={captureÉcranPilote}
              />
            </div>
          </div>
        </div>
      </section>
      <section>
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
                PILOTE mobilise l’ensemble des responsables politiques et administratifs autour des politiques prioritaires. PILOTE permet d’harmoniser les informations utiles au pilotage en réunissant données quantitatives et appréciations qualitatives.
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
                  PILOTE permet de suivre l’avancement de ses politiques publiques, de détecter les territoires en difficulté et de préparer les réunions interministérielles.
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
                  PILOTE permet d’assurer le suivi des politiques prioritaires sur leurs territoires et d’identifier les politiques en difficulté, nécessitant un soutien.
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
                  PILOTE permet de commenter les données des politiques publiques et d’alerter lorsqu’il y a besoin d’un soutien interministériel.
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
                Les politiques prioritaires du Gouvernement font l&apos;objet d&apos;un suivi régulier à haut niveau, par le secrétaire général de la Présidence de la République et le directeur de cabinet de la Première ministre. 
              </p>
              <p className='fr-text--lg bold'>
                Objectif : veiller à la cohérence des objectifs et des décisions, identifier les obstacles et les lever et, le cas échéant, provoquer les arbitrages nécessaires lors de réunions interministérielles.
              </p>
              <p className='fr-text--lg'>
                La DITP est en charge de la mise en œuvre de ce suivi. L’outil PILOTE permet à chaque échelon opérationnel de rendre compte au Gouvernement de l’avancement dans la mise en œuvre des politiques prioritaires et de mobiliser le soutien des échelons supérieurs pour lever les difficultés rencontrées.
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
                      <Link
                        href="https://www.gouvernement.fr/les-actions-du-gouvernement"
                        target="_blank"
                      >
                        Le baromètre des résultats de l’action publique
                      </Link>
                    </Titre>
                    <p className="fr-card__desc">
                      La carte donne des aperçus cliquables d’une page de contenu à l’utilisateur. Elle fait généralement partie d&apos;une collection ou liste d’aperçus de contenu similaires. La carte n’est jamais présentée de manière isolée.
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
          <div className="fr-grid-row fr-grid-row--center">
            <div className="fr-col-12 fr-py-8w">
              <Titre
                baliseHtml='h2'
                className='fr-h3'
              >
                Vous avez des questions ?
              </Titre>
              <Link
                className='fr-btn fr-btn--secondary fr-mt-2w'
                href="mailto:support.ditp@modernisation.gouv.fr"
                target="_blank"
              >
                Contacter l&apos;équipe
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PageLandingStyled>
  );
}

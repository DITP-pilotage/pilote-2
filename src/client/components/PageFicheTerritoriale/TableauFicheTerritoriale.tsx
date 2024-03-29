import { FunctionComponent } from 'react';
import {
  ChantierFicheTerritorialeContrat,
} from '@/server/fiche-territoriale/app/contrats/ChantierFicheTerritorialeContrat';
import Icône from '@/components/_commons/Icône/Icône';
import MétéoPicto from '@/components/_commons/Météo/Picto/MétéoPicto';
import '@gouvfr/dsfr/dist/component/badge/badge.min.css';

const classBadge = (tauxAvancement: number, tauxAvancementNational: number | null) => {
  return tauxAvancementNational === null ? ''
    : (tauxAvancement >= tauxAvancementNational ? 'fr-badge--success'
      : tauxAvancement >= tauxAvancementNational - 10 ? 'fr-badge--warning'
        : 'fr-badge--error') ;
};

export const TableauFicheTerritoriale: FunctionComponent<{
  chantiersFicheTerritoriale: ChantierFicheTerritorialeContrat[]
}> = ({ chantiersFicheTerritoriale }) => {

  return (
    <div className='fiche-territoriale--tableau fr-container--fluid fr-mt-2v'>
      <div
        className='fr-grid-row fr-p-2w fr-background-action-low--blue-france fiche-territoriale--entete'
      >
        <div
          className='fr-col-8 fr-text--bold fr-px-4w'
        >
          Chantiers publiés au baromètre de l’action publique et leurs indicateurs
        </div>
        <div
          className='fr-col-2 fr-text--bold'
        >
          Météo
        </div>
        <div
          className='fr-col-2 fr-text--bold'
        >
          Avancement global
        </div>
      </div>
      {
        chantiersFicheTerritoriale.map((chantierFicheTerritoriale, index) => {
          return (
            <>
              <div
                className='fr-grid-row fr-px-2w fr-py-1w fr-background-alt--grey chantier-fiche-territoriale--contenu'
                key={`chantier-fiche-territoriale-${index}`}
              >
                <div
                  className='fr-col-8 fr-text--bold flex align-center fr-p-1v'
                >
                  <div className='fr-pr-1w fr-text-title--blue-france'>
                    <Icône
                      id={chantierFicheTerritoriale.ministereIcone}
                      key='une-icone'
                    />
                  </div>
                  <span className='fiche-territoriale--contenu'>
                    {chantierFicheTerritoriale.nom}
                  </span>
                </div>
                <div
                  className='fr-col-2 flex fiche-territoriale--contenu--xs fiche-territoriale__contenu--meteo flex-column justify-center'
                >
                  {
                    chantierFicheTerritoriale.meteo !== 'NON_RENSEIGNEE' ? (
                      <MétéoPicto
                        météo={chantierFicheTerritoriale.meteo}
                      />
                    ) : (
                      <span className='fr-m-0 fr-text-mention--grey'>
                        Non renseignée
                      </span>
                    )
                  }
                  <span className='fr-m-0 fr-text-mention--grey'>
                    {chantierFicheTerritoriale.dateQualitative}
                  </span>
                </div>
                <div
                  className='fr-col-2 flex fiche-territoriale--contenu--xs flex-column justify-center'
                >
                  {
                    chantierFicheTerritoriale.tauxAvancement !== null ? (
                      <p className='fr-text--bold fr-text--xl fr-text-title--blue-france fr-my-0'>
                        {`${chantierFicheTerritoriale.tauxAvancement.toFixed(0)}%`}
                      </p>
                    ) : (
                      <span className='fr-m-0 fr-text-mention--grey'>
                        Paramètre(s) de calcul manquant(s)
                      </span>
                    )
                  }
                </div>
              </div>
              <div
                className='fr-grid-row fr-pt-1w indicateur-fiche-territoriale--entete fr-px-2w'
                key={`indicateur-fiche-territoriale-${index}`}
              >
                <div
                  className='fr-col-4 flex align-center fr-p-0 fr-m-0'
                />
                <div
                  className='fr-col-2 flex flex-column fr-p-0'
                >
                  <span className='fiche-territoriale--contenu--xs fr-text-mention--grey'>
                    Dernière valeur
                  </span>
                  <span className='fiche-territoriale--contenu--xs fr-text-mention--grey'>
                    {chantierFicheTerritoriale.dateQuantitative }
                  </span>
                </div>
                <div
                  className='fr-col-2 fr-text--bold flex flex-column  fr-p-0 fr-m-0'
                >
                  <span className='fiche-territoriale--contenu--xs fr-m-0 fr-text-mention--grey'>
                    Cible 2026
                  </span>
                </div>
                <div
                  className='fr-col-2 fr-text--bold flex flex-column fr-p-0 fr-m-0'
                >
                  <span className='fiche-territoriale--contenu--xs fr-m-0 fr-text-mention--grey'>
                    Avancement d'ici 2026
                  </span>
                </div>
                <div
                  className='fr-col-2 fr-text--bold flex flex-column fr-p-0 fr-m-0'
                >
                  <span className='fiche-territoriale--contenu--xs fr-m-0 fr-text-mention--grey'>
                    Avancement national
                  </span>
                </div>
              </div>
              {
                chantierFicheTerritoriale.indicateurs.map((indicateur, indexFicheTerritoriale) => {
                  return (

                    <div
                      className='fr-grid-row fiche-territoriale--contenu--row fr-px-2w fr-py-1w'
                      key={`indicateur-fiche-territoriale-${index}-${indexFicheTerritoriale}`}
                    >
                      <div
                        className='fr-col-4 flex align-center fr-pr-1v'
                      >
                        <span className='fr-text--xs fr-m-0'>
                          {indicateur.nom}
                        </span>
                      </div>
                      <div
                        className='fr-col-2 flex flex-column justify-center'
                      >
                        {
                          indicateur.valeurActuelle !== null ? (
                            <span className='fr-text--xs fr-m-0'>
                              {`${indicateur.valeurActuelle.toFixed(0)}${indicateur.uniteMesure?.toLocaleLowerCase() === 'pourcentage' ? '%' : ''}`}
                            </span>
                          ) : (
                            <span className='fiche-territoriale--contenu--xs'>
                              Aucune valeur saisie
                            </span>
                          )
                        }
                      </div>
                      <div
                        className='fr-col-2 flex flex-column justify-center'
                      >
                        {
                          indicateur.valeurCible !== null ? (
                            <span className='fr-text--xs fr-m-0'>
                              {`${indicateur.valeurCible.toFixed(0)}${indicateur.uniteMesure?.toLocaleLowerCase() === 'pourcentage' ? '%' : ''}`}
                            </span>
                          ) : (
                            <span className='fiche-territoriale--contenu--xs'>
                              Aucune cible définie
                            </span>
                          )
                        }
                      </div>
                      <div
                        className='fr-col-2 flex flex-column justify-center'
                      >
                        {
                          indicateur.tauxAvancement !== null ? (
                            <span className={`fr-text--xs fr-m-0 fr-badge fr-badge--no-icon ${classBadge(indicateur.tauxAvancement, indicateur.tauxAvancementNational)}`}>
                              {`${indicateur.tauxAvancement.toFixed(0)}%`}
                            </span>
                          ) : (
                            <span className='fiche-territoriale--contenu--xs'>
                              Paramètre(s) de calcul manquant(s)
                            </span>
                          )
                        }
                      </div>
                      <div
                        className='fr-col-2 flex flex-column justify-center'
                      >
                        {
                          indicateur.tauxAvancementNational !== null ? (
                            <span className='fr-text--xs fr-m-0'>
                              {`${indicateur.tauxAvancementNational.toFixed(0)}%`}
                            </span>
                          ) : (
                            <span className='fiche-territoriale--contenu--xs'>
                              Paramètre(s) de calcul manquant(s)
                            </span>
                          )
                        }
                      </div>
                    </div>
                  );
                })
              }
            </>
          );
        })
      }
    </div>
  )
  ;
}
;

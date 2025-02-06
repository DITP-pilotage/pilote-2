import { FunctionComponent, useState } from 'react';
import '@gouvfr/dsfr/dist/component/accordion/accordion.min.css';
import { parseAsString, useQueryState } from 'nuqs';
import IndicateurÉvolution from '@/components/_commons/IndicateursChantier/Bloc/Détails/Évolution/IndicateurÉvolution';
import IndicateurSpécifications
  from '@/components/_commons/IndicateursChantier/Bloc/Détails/Spécifications/IndicateurSpécifications';
import SousIndicateurs from '@/components/_commons/IndicateursChantier/Bloc/Détails/SousIndicateurs/SousIndicateurs';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import {
  IndicateurDétailsParTerritoire,
} from '@/components/_commons/IndicateursChantier/Bloc/IndicateurBloc.interface';
import { DétailsIndicateurs } from '@/server/domain/indicateur/DétailsIndicateur.interface';
import { MailleInterne } from '@/server/domain/maille/Maille.interface';
import CartographieAvecSelecteurIndicateur from '@/components/_commons/Cartographie/CartographieAvecSelecteurIndicateur/CartographieAvecSelecteurIndicateur';
import { useIndicateurDétails } from './useIndicateurDétails';

export type CartographieIndicateurType = 'avancementMandat' | 'avancementJalon' | 'propositionValeur' | 'valeurActuelle';
interface IndicateurDétailsProps {
  indicateur: Indicateur
  indicateurDétailsParTerritoires: IndicateurDétailsParTerritoire[]
  chantierEstTerritorialisé: boolean
  dateDeMiseAJourIndicateur: string | null
  listeSousIndicateurs: Indicateur[]
  détailsIndicateurs: DétailsIndicateurs
  detailsIndicateursTerritoire: DétailsIndicateurs
  estSousIndicateur?: boolean
  dateValeurActuelle: string | null
  dateProchaineDateMaj: string | null
  dateProchaineDateValeurActuelle: string | null
  territoireCode: string
  territoiresCompares: string[]
  mailleSelectionnee: MailleInterne
  mailleQuery: MailleInterne
  indicateurEstAjour: boolean
  jalon: number
  mailsDirecteursProjets: string[]
  cartographieDroiteIndicateur: CartographieIndicateurType
  cartographieGaucheIndicateur: CartographieIndicateurType
}

const IndicateurDétails: FunctionComponent<IndicateurDétailsProps> = ({
  indicateur,
  indicateurDétailsParTerritoires,
  chantierEstTerritorialisé,
  dateDeMiseAJourIndicateur,
  listeSousIndicateurs,
  détailsIndicateurs,
  detailsIndicateursTerritoire,
  dateValeurActuelle,
  dateProchaineDateMaj,
  dateProchaineDateValeurActuelle,
  estSousIndicateur = false,
  territoireCode,
  territoiresCompares,
  mailleSelectionnee,
  mailleQuery,
  indicateurEstAjour,
  jalon,
  mailsDirecteursProjets,
  cartographieDroiteIndicateur,
  cartographieGaucheIndicateur,
}) => {

  const [futOuvert, setFutOuvert] = useState(false);

  const {
    donnéesCartographieAvancementTerritorialisées,
    donnéesCartographieValeurActuelleTerritorialisées,
    estAutoriseAVoirLeSelecteurDeMaille,
  } = useIndicateurDétails(detailsIndicateursTerritoire[indicateur.id]);

  const indicateurSiTypeDeReformeEstChantier = futOuvert;
  const nomDefinitionDeLindicateur = estSousIndicateur ? 'Description du sous-indicateur et calendrier de mise à jour' : 'Description de l\'indicateur et calendrier de mise à jour';
  const nomRepartitionGeographiqueEtEvolution = 'Répartition géographique et évolution';
  const nomSousIndicateurs = 'Sous indicateurs';

  const responsablesDonnees = indicateur.responsablesDonneesMails.length > 0 ?
    indicateur.responsablesDonneesMails :
    mailsDirecteursProjets;

  const [, setCartographieGaucheSelection] = useQueryState('carteIndG', parseAsString.withDefault('avancementMandat').withOptions({
    shallow: false,
    history: 'push',
    clearOnDefault: true,
  }));
  
  const [, setCartographieDroiteSelection] = useQueryState('carteIndD', parseAsString.withDefault('valeurActuelle').withOptions({
    shallow: false,
    history: 'push',
    clearOnDefault: true,
  }));
    
  return (
    <div className='fr-accordions-group'>
      <section className='fr-accordion'>
        <h3 className='fr-accordion__title'>
          <button
            aria-controls={`détails-${indicateur.id}`}
            aria-expanded='false'
            className='fr-accordion__btn'
            onClick={() => setFutOuvert(true)}
            title={nomDefinitionDeLindicateur}
            type='button'
          >
            {nomDefinitionDeLindicateur}
          </button>
        </h3>
        <div
          className='fr-collapse'
          id={`détails-${indicateur.id}`}
        >
          <div className='fr-container'>
            <div className='fr-grid-row fr-grid-row--gutters fr-mb-1w'>
              <div className='fr-col-12'>
                {
                  indicateurSiTypeDeReformeEstChantier ? (
                    <IndicateurSpécifications
                      dateProchaineDateMaj={dateProchaineDateMaj}
                      dateProchaineDateValeurActuelle={dateProchaineDateValeurActuelle}
                      dateValeurActuelle={dateValeurActuelle}
                      delaiDisponibilite={indicateur.delaiDisponibilite}
                      description={indicateur.description}
                      indicateurEstAjour={indicateurEstAjour}
                      indicateurEstApplicable={détailsIndicateurs[indicateur.id][territoireCode]?.est_applicable}
                      indicateurId={indicateur.id}
                      indicateurNom={indicateur.nom}
                      modeDeCalcul={indicateur.modeDeCalcul}
                      periodicite={indicateur.periodicite}
                      responsablesMails={responsablesDonnees}
                      source={indicateur.source}
                    />
                  ) : null
                }
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className='fr-accordion'>
        <h3 className='fr-accordion__title'>
          <button
            aria-controls={`repartition-geographique-et-evolution-${indicateur.id}`}
            aria-expanded='false'
            className='fr-accordion__btn'
            onClick={() => setFutOuvert(true)}
            title={nomRepartitionGeographiqueEtEvolution}
            type='button'
          >
            {nomRepartitionGeographiqueEtEvolution}
          </button>
        </h3>
        <div
          className='fr-collapse'
          id={`repartition-geographique-et-evolution-${indicateur.id}`}
        >
          <div className='fr-container'>
            <div className='fr-grid-row fr-grid-row--gutters fr-my-1w'>
              {
                indicateurSiTypeDeReformeEstChantier && (donnéesCartographieAvancementTerritorialisées || donnéesCartographieValeurActuelleTerritorialisées || chantierEstTerritorialisé) ? (
                  <>
                    <section className='fr-col-12 fr-col-xl-6'>
                      <CartographieAvecSelecteurIndicateur 
                        aLaSelectionCartographie={(valeur: CartographieIndicateurType) => setCartographieGaucheSelection(valeur)} 
                        cartographieSelectionnee={cartographieGaucheIndicateur} 
                        detailsIndicateurTerritoire={detailsIndicateursTerritoire[indicateur.id]} 
                        estAutoriseAVoirLeSelecteurDeMaille={estAutoriseAVoirLeSelecteurDeMaille} 
                        jalon={jalon} 
                        listeCartographiesDesactives={[cartographieDroiteIndicateur]} 
                        mailleQuery={mailleQuery} 
                        territoireCode={territoireCode}      
                        unité={indicateur.unité}                
                      />
                    </section>
                    <section className='fr-col-12 fr-col-xl-6'>
                      <CartographieAvecSelecteurIndicateur 
                        aLaSelectionCartographie={(valeur: CartographieIndicateurType) => setCartographieDroiteSelection(valeur)} 
                        cartographieSelectionnee={cartographieDroiteIndicateur} 
                        detailsIndicateurTerritoire={detailsIndicateursTerritoire[indicateur.id]} 
                        estAutoriseAVoirLeSelecteurDeMaille={estAutoriseAVoirLeSelecteurDeMaille} 
                        jalon={jalon} 
                        listeCartographiesDesactives={[cartographieGaucheIndicateur]} 
                        mailleQuery={mailleQuery}
                        territoireCode={territoireCode}      
                        unité={indicateur.unité}                
                      />
                    </section>
                  </>
                ) : null
              }
              {
                // TODO(JOTA-02/08/2024): Supprimer indicateurDétailsParTerritoires[0]?.données une fois le refacto page chantier terminé
                indicateurSiTypeDeReformeEstChantier && indicateurDétailsParTerritoires[0]?.données ? (
                  <section className='fr-col-12'>
                    <IndicateurÉvolution
                      dateDeMiseAJourIndicateur={dateDeMiseAJourIndicateur ?? 'Non renseignée'}
                      indicateurDétailsParTerritoires={indicateurDétailsParTerritoires}
                      source={indicateur.source}
                    />
                  </section>
                ) : null
              }
            </div>
          </div>
        </div>
      </section>
      {
        listeSousIndicateurs.length > 0 ? (
          <section className='fr-accordion'>
            <h3 className='fr-accordion__title'>
              <button
                aria-controls={`sous-indicateurs-${indicateur.id}`}
                aria-expanded='false'
                className='fr-accordion__btn'
                onClick={() => setFutOuvert(true)}
                title={nomSousIndicateurs}
                type='button'
              >
                {nomSousIndicateurs}
              </button>
            </h3>
            <div
              className='fr-collapse fr-m-0 fr-p-0'
              id={`sous-indicateurs-${indicateur.id}`}
            >
              <SousIndicateurs
                cartographieDroiteIndicateur={cartographieDroiteIndicateur}
                cartographieGaucheIndicateur={cartographieGaucheIndicateur}
                chantierEstTerritorialisé={chantierEstTerritorialisé}
                detailsIndicateursTerritoire={detailsIndicateursTerritoire}
                détailsIndicateurs={détailsIndicateurs}
                estInteractif
                jalon={jalon}
                listeSousIndicateurs={listeSousIndicateurs}
                mailleQuery={mailleQuery}
                mailleSelectionnee={mailleSelectionnee}
                mailsDirecteursProjets={mailsDirecteursProjets}
                territoireCode={territoireCode}
                territoiresCompares={territoiresCompares}
              />
            </div>
          </section>
        ) : null
      }
    </div>
  );
};

export default IndicateurDétails;

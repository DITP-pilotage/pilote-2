import { useState } from 'react';
import { useRouter } from 'next/router';
import Bloc from '@/components/_commons/Bloc/Bloc';
import Titre from '@/components/_commons/Titre/Titre';
import Tableau from '@/components/_commons/Tableau/Tableau';
import PictoBaromètre from '@/components/_commons/PictoBaromètre/PictoBaromètre';
import IndicateurDétails from '@/components/_commons/Indicateurs/Bloc/Détails/IndicateurDétails';
import IndicateurBlocProps, {
  IndicateurDétailsParTerritoire,
} from '@/components/_commons/Indicateurs/Bloc/IndicateurBloc.interface';
import FormulaireIndicateur
  from '@/components/PageImportIndicateur/PageImportIndicateurSectionImport/FormulaireIndicateur/FormulaireIndicateur';
import { DetailValidationFichierContrat } from '@/server/app/contrats/DetailValidationFichierContrat.interface';
import ResultatValidationFichier
  from '@/components/PageImportIndicateur/ResultatValidationFichier/ResultatValidationFichier';
import { territoireSélectionnéTerritoiresStore } from '@/client/stores/useTerritoiresStore/useTerritoiresStore';
import { IndicateurPondération } from '@/components/_commons/Indicateurs/Bloc/Pondération/IndicateurPondération';
import BadgeIcône from '@/components/_commons/BadgeIcône/BadgeIcône';
import IndicateurBlocStyled from './IndicateurBloc.styled';
import useIndicateurBloc from './useIndicateurBloc';

export default function IndicateurBloc({
  indicateur,
  détailsIndicateur,
  estInteractif,
  territoireProjetStructurant,
  typeDeRéforme,
  chantierEstTerritorialisé,
  estDisponibleALImport = false,
}: IndicateurBlocProps) {
  const router = useRouter();
  const réformeId = router.query.id as string;

  const territoireSélectionné = territoireSélectionnéTerritoiresStore();
  const {
    indicateurDétailsParTerritoires,
    tableau,
    dateDeMiseAJourIndicateur,
    dateProchaineDateMaj,
  } = useIndicateurBloc(détailsIndicateur, typeDeRéforme, territoireProjetStructurant);
  const [rapport, setRapport] = useState<DetailValidationFichierContrat | null>(null);

  const estIndicateurEnAlerte = détailsIndicateur[territoireSélectionné!.codeInsee].estAJour === false && détailsIndicateur[territoireSélectionné!.codeInsee]?.prochaineDateMaj !== null;

  return (
    <IndicateurBlocStyled
      className='fr-mb-2w'
      key={indicateur.id}
    >
      <Bloc>
        <section>
          <div className='flex justify-between'>
            <div>
              <Titre
                baliseHtml='h4'
                className='fr-text--xl fr-mb-1w'
              >

                {
                  estIndicateurEnAlerte ? (
                    <span className='fr-mr-1v'>
                      <BadgeIcône type='warning' />
                    </span>
                  ) : null
                }
                {
                  indicateur.estIndicateurDuBaromètre ? (
                    <span className='fr-mr-1v'>
                      <PictoBaromètre />
                    </span>
                  )
                    : null
                }
                {indicateur.nom + (indicateur.unité === null || indicateur.unité === '' ? '' : ` (en ${indicateur.unité?.toLocaleLowerCase()})`)}
              </Titre>
              <div className='fr-ml-2w fr-mb-3w'>
                <p className='fr-mb-0 fr-text--xs texte-gris'>
                  Dernière mise à jour des données (de l'indicateur) :
                  {' '}
                  <span className='fr-text--bold'>
                    {dateDeMiseAJourIndicateur}
                  </span>
                </p>
                {
                  !!territoireSélectionné && !!détailsIndicateur[territoireSélectionné.codeInsee] ? (
                    <p
                      className={`fr-mb-0 fr-text--xs${estIndicateurEnAlerte ? ' fr-text-warning' : ''}`}
                    >
                      Date prévisionnelle de la prochaine date de mise à jour des données (de l'indicateur) :
                      {' '}
                      <span className='fr-text--bold'>
                        {dateProchaineDateMaj}
                      </span>
                    </p>
                  ) : null
                }
                {
                  !!territoireSélectionné && !!détailsIndicateur[territoireSélectionné.codeInsee] ? (
                    <IndicateurPondération
                      indicateurPondération={détailsIndicateur[territoireSélectionné.codeInsee]?.pondération ?? null}
                      mailleSélectionnée={territoireSélectionné.maille}
                    />
                  ) : null
                }
              </div>
            </div>
            {
              estDisponibleALImport ? (
                <FormulaireIndicateur
                  chantierId={réformeId}
                  indicateurId={indicateur.id}
                  setRapport={setRapport}
                />
              )
                : null
            }
          </div>
          {
            rapport !== null &&
            <ResultatValidationFichier rapport={rapport} />
          }
          <Tableau<IndicateurDétailsParTerritoire>
            tableau={tableau}
            titre={`Tableau de l'indicateur : ${indicateur.nom}`}
          />
          {
            estInteractif ? (
              <IndicateurDétails
                chantierEstTerritorialisé={chantierEstTerritorialisé}
                dateDeMiseAJourIndicateur={dateDeMiseAJourIndicateur}
                indicateur={indicateur}
                indicateurDétailsParTerritoires={indicateurDétailsParTerritoires}
                typeDeRéforme={typeDeRéforme}
              />
            ) : null
          }
        </section>
      </Bloc>
    </IndicateurBlocStyled>
  );
}

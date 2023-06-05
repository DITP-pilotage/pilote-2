import { useState } from 'react';
import { useRouter } from 'next/router';
import Bloc from '@/components/_commons/Bloc/Bloc';
import Titre from '@/components/_commons/Titre/Titre';
import Tableau from '@/components/_commons/Tableau/Tableau';
import PictoBaromètre from '@/components/_commons/PictoBaromètre/PictoBaromètre';
import IndicateurDétails from '@/components/_commons/Indicateurs/Bloc/Détails/IndicateurDétails';
import IndicateurBlocProps, { IndicateurDétailsParTerritoire } from '@/components/_commons/Indicateurs/Bloc/IndicateurBloc.interface';
import FormulaireIndicateur from '@/components/PageImportIndicateur/PageImportIndicateurSectionImport/FormulaireIndicateur/FormulaireIndicateur';
import { DetailValidationFichierContrat } from '@/server/app/contrats/DetailValidationFichierContrat.interface';
import ResultatValidationFichier from '@/components/PageImportIndicateur/ResultatValidationFichier/ResultatValidationFichier';
import { territoireSélectionnéTerritoiresStore } from '@/client/stores/useTerritoiresStore/useTerritoiresStore';
import { IndicateurBlocCaractéristiques } from '@/components/PageChantier/Indicateurs/Bloc/IndicateurBlocCaractéristiques/IndicateurBlocCaractéristiques';
import IndicateurBlocStyled from './IndicateurBloc.styled';
import useIndicateurBloc from './useIndicateurBloc';

export default function IndicateurBloc({ indicateur, détailsIndicateur, estInteractif, typeDeRéforme, territoireProjetStructurant, estDisponibleALImport = false } : IndicateurBlocProps) {
  const router = useRouter();
  const réformeId = router.query.id as string;
  
  const mailleSélectionnée = territoireSélectionnéTerritoiresStore()?.maille ?? 'nationale';
  const { indicateurDétailsParTerritoires, tableau } = useIndicateurBloc(détailsIndicateur, typeDeRéforme, territoireProjetStructurant);
  const [rapport, setRapport] = useState<DetailValidationFichierContrat | null>(null);

  return (
    <IndicateurBlocStyled
      className="fr-mb-2w"
      key={indicateur.id}
    >
      <Bloc>
        <section>
          <div className='flex justify-between'>
            <div>
              <Titre
                baliseHtml="h4"
                className="fr-text--xl fr-mb-1w"
              >
                {
                  !!indicateur.estIndicateurDuBaromètre &&
                  <span className='fr-mr-1v'>
                    <PictoBaromètre />
                  </span>
                }
                {indicateur.nom}
              </Titre>
              <div className="fr-ml-2w">
                <IndicateurBlocCaractéristiques
                  indicateurPondération={indicateur.pondération}
                  mailleSélectionnée={mailleSélectionnée}
                />
              </div>
            </div>
            {
            estDisponibleALImport ? 
              <FormulaireIndicateur
                chantierId={réformeId}
                indicateurId={indicateur.id}
                setRapport={setRapport}
              />
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
            !!estInteractif &&
              <IndicateurDétails
                indicateur={indicateur}
                indicateurDétailsParTerritoires={indicateurDétailsParTerritoires}
                typeDeRéforme={typeDeRéforme}
              />
          }
        </section>
      </Bloc>
    </IndicateurBlocStyled>
  );
}

import Bloc from '@/components/_commons/Bloc/Bloc';
import {
  actionsTerritoiresStore,
  territoireSélectionnéTerritoiresStore,
} from '@/stores/useTerritoiresStore/useTerritoiresStore';
import AvancementsTerritoire from '@/components/_commons/AvancementsTerritoire/AvancementsTerritoire';
import Titre from '@/components/_commons/Titre/Titre';
import JaugeDeProgression from '@/components/_commons/JaugeDeProgression/JaugeDeProgression';
import BarreDeProgression from '@/components/_commons/BarreDeProgression/BarreDeProgression';
import AvancementChantierStyled from './AvancementChantier.styled';
import AvancementChantierProps from './AvancementChantier.interface';

const classeÀPartirDeLaMaille = {
  'nationale': '',
  'départementale': 'layout--dept',
  'régionale': 'layout--reg',
};

export default function AvancementChantier({ avancements }: AvancementChantierProps) {
  const territoireSélectionné = territoireSélectionnéTerritoiresStore();
  const { récupérerDétailsSurUnTerritoire } = actionsTerritoiresStore();

  return (
    <AvancementChantierStyled className={classeÀPartirDeLaMaille[territoireSélectionné!.maille]}>
      {
        (avancements.départementale.global.moyenne !== undefined && avancements.départementale.annuel.moyenne !== undefined) &&
          <Bloc titre={territoireSélectionné?.nomAffiché}>
            <div className='fr-py-1w jauge'>
              <AvancementsTerritoire
                avancementAnnuel={avancements.départementale.annuel.moyenne}
                avancementGlobal={avancements.départementale.global.moyenne}
                territoireNom={territoireSélectionné!.nom}
              />
            </div>
          </Bloc>
      }
      {
        (avancements.régionale.global.moyenne !== undefined && avancements.régionale.annuel.moyenne !== undefined) &&
          <Bloc titre={territoireSélectionné!.codeParent ? récupérerDétailsSurUnTerritoire(territoireSélectionné!.codeParent).nomAffiché : territoireSélectionné!.nomAffiché}>
            <div className='fr-py-1w jauge'>
              <AvancementsTerritoire
                avancementAnnuel={avancements.régionale.annuel.moyenne}
                avancementGlobal={avancements.régionale.global.moyenne}
                territoireNom={territoireSélectionné!.codeParent ? récupérerDétailsSurUnTerritoire(territoireSélectionné!.codeParent).nomAffiché : territoireSélectionné!.nomAffiché}
              />
            </div>
          </Bloc>
      }
      <div className='avancement-national'>
        <Bloc
          contenuClassesSupplémentaires='fr-p-1w fr-p-lg-2w'
          titre='National'
        >
          <section className='fr-py-1w'>
            <div className='fr-container fr-p-0'>
              <div className='fr-grid-row fr-mb-2w'>
                <div className='fr-col-12 fr-col-md-6 fr-col-lg-12 fr-col-xl-6 flex flex-column border-md-r border-lg-0 border-xl-r fr-pr-1w'>
                  <Titre
                    baliseHtml='h3'
                    className='fr-text--md fr-mb-0 fr-py-1v texte-centre break-keep'
                    estInline
                  >
                    Taux d’avancement national
                  </Titre>
                  <div className='flex w-full justify-center'>
                    <JaugeDeProgression
                      couleur='bleu'
                      libellé='Taux d’avancement moyen pour le territoire '
                      pourcentage={avancements.nationale ? avancements.nationale.global.moyenne :  null}
                      taille='lg'
                    />
                  </div>
                </div>
                <div className='fr-col-12 fr-col-md-6 fr-col-lg-12 fr-col-xl-6'>
                  <div className='fr-container fr-px-md-1w fr-px-lg-2w'>
                    <div className='fr-grid-row fr-grid-row--center texte-centre fr-py-1w fr-text--sm'>
                      Répartition des taux d’avancement des territoires
                    </div>
                    <div className='fr-grid-row fr-grid-row-md--gutters'>
                      <div className='fr-col-4'>
                        <JaugeDeProgression
                          couleur='orange'
                          libellé='Minimum'
                          noWrap
                          pourcentage={avancements.nationale?.global.minimum || null}
                          taille='sm'
                        />
                      </div>
                      <div className='fr-col-4'>
                        <JaugeDeProgression
                          couleur='violet'
                          libellé='Médiane'
                          noWrap
                          pourcentage={avancements.nationale?.global.médiane || null}
                          taille='sm'
                        />
                      </div>
                      <div className='fr-col-4'>
                        <JaugeDeProgression
                          couleur='vert'
                          libellé='Maximum'
                          noWrap
                          pourcentage={avancements.nationale?.global.maximum || null}
                          taille='sm'
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className='fr-grid-row border-t'>
                <div className='fr-mt-2w w-full'>
                  <p className='fr-text--xl fr-text--bold fr-mb-0 texte-gris'>
                    {`${(process.env.NEXT_PUBLIC_FF_TA_ANNUEL === 'true' ? avancements.nationale?.annuel.moyenne?.toFixed(0) : null) ?? '- '}%`}
                  </p>
                  <BarreDeProgression
                    afficherTexte={false}
                    bordure={null}
                    fond='gris-clair'
                    positionTexte='dessus'
                    taille='xxs'
                    valeur={!!avancements.nationale && process.env.NEXT_PUBLIC_FF_TA_ANNUEL === 'true' ? avancements.nationale.annuel.moyenne : null}
                    variante='secondaire'
                  />
                  <p className='fr-text--xs fr-mb-0 fr-mt-1v'>
                    Moyenne de l'année en cours
                  </p>
                </div>
              </div>
            </div>
          </section>
        </Bloc>
      </div>
    </AvancementChantierStyled>
  );
}

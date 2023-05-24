import Bloc from '@/components/_commons/Bloc/Bloc';
import Titre from '@/components/_commons/Titre/Titre';
import Avancements from '@/components/_commons/Avancements/Avancements';
import JaugeDeProgression from '@/components/_commons/JaugeDeProgression/JaugeDeProgression';
import {
  actionsTerritoiresStore,
  mailleSélectionnéeTerritoiresStore,
  territoireSélectionnéTerritoiresStore,
} from '@/stores/useTerritoiresStore/useTerritoiresStore';
import api from '@/server/infrastructure/api/trpc/api';
import AvancementChantierProps from './AvancementChantier.interface';
import AvancementChantierStyled from './AvancementChantier.styled';

export default function AvancementChantier({ avancements, chantierId }: AvancementChantierProps) {
  const territoireSélectionné = territoireSélectionnéTerritoiresStore();
  const mailleSélectionnée = mailleSélectionnéeTerritoiresStore();
  const { récupérerDétailsSurUnTerritoire } = actionsTerritoiresStore();

  const { data: avancementsAgrégés } = api.chantier.récupérerStatistiquesAvancements.useQuery(
    {
      chantiers: [chantierId],
      maille: mailleSélectionnée,
    },
    { refetchOnWindowFocus: false, keepPreviousData: true },
  );
  if (avancementsAgrégés)
    avancementsAgrégés.global.moyenne = avancements.nationale?.global.moyenne ?? null;

  return (
    <AvancementChantierStyled id="avancement">
      <Titre
        baliseHtml='h2'
        className='fr-h4 fr-mb-2w'
      >
        Avancement du chantier
      </Titre>
      <div className='blocs'>
        {
          avancements.départementale.moyenne !== undefined &&
          <Bloc titre={territoireSélectionné?.nomAffiché}>
            <div className='fr-py-1w jauge'>
              <JaugeDeProgression
                couleur="bleuClair"
                libellé={territoireSélectionné!.nom}
                pourcentage={avancements.départementale.moyenne}
                taille="lg"
              />
            </div>
          </Bloc>
        }
        {
          avancements.régionale.moyenne !== undefined &&
          <Bloc titre={territoireSélectionné!.codeParent ? récupérerDétailsSurUnTerritoire(territoireSélectionné!.codeParent).nomAffiché : territoireSélectionné!.nomAffiché}>
            <div className='fr-py-1w jauge'>
              <JaugeDeProgression
                couleur="bleuClair"
                libellé={territoireSélectionné!.codeParent ? récupérerDétailsSurUnTerritoire(territoireSélectionné!.codeParent).nomAffiché : territoireSélectionné!.nomAffiché}
                pourcentage={avancements.régionale.moyenne}
                taille="lg"
              />
            </div>
          </Bloc>
          }
        <div className='avancement-national'>
          <Bloc titre='National'>
            <div className='fr-py-1w'>
              <Avancements avancements={avancementsAgrégés ?? null} />
            </div>
          </Bloc>
        </div>
      </div>
    </AvancementChantierStyled>
  );
}

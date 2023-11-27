import Bloc from '@/components/_commons/Bloc/Bloc';
import Avancements from '@/components/_commons/Avancements/Avancements';
import JaugeDeProgression from '@/components/_commons/JaugeDeProgression/JaugeDeProgression';
import {
  actionsTerritoiresStore,
  territoireSélectionnéTerritoiresStore,
} from '@/stores/useTerritoiresStore/useTerritoiresStore';
import AvancementChantierProps from './AvancementChantier.interface';
import AvancementChantierStyled from './AvancementChantier.styled';

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
        avancements.départementale.moyenne !== undefined &&
          <Bloc titre={territoireSélectionné?.nomAffiché}>
            <div className='fr-py-1w jauge'>
              <JaugeDeProgression
                couleur='bleuClair'
                libellé={territoireSélectionné!.nom}
                pourcentage={avancements.départementale.moyenne}
                taille='lg'
              />
            </div>
          </Bloc>
      }
      {
        avancements.régionale.moyenne !== undefined &&
          <Bloc titre={territoireSélectionné!.codeParent ? récupérerDétailsSurUnTerritoire(territoireSélectionné!.codeParent).nomAffiché : territoireSélectionné!.nomAffiché}>
            <div className='fr-py-1w jauge'>
              <JaugeDeProgression
                couleur='bleuClair'
                libellé={territoireSélectionné!.codeParent ? récupérerDétailsSurUnTerritoire(territoireSélectionné!.codeParent).nomAffiché : territoireSélectionné!.nomAffiché}
                pourcentage={avancements.régionale.moyenne}
                taille='lg'
              />
            </div>
          </Bloc>
      }
      <div className='avancement-national'>
        <Bloc titre='National'>
          <div className='fr-py-1w'>
            <Avancements avancements={avancements.nationale ?? null} />
          </div>
        </Bloc>
      </div>
    </AvancementChantierStyled>
  );
}

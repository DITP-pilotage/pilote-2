import { createColumnHelper } from '@tanstack/react-table';
import Link from 'next/link';
import Tableau from '@/components/_commons/Tableau/Tableau';
import BarreDeProgression from '@/components/_commons/BarreDeProgression/BarreDeProgression';
import { récupérerLibelléMétéo, PictoMétéo } from '@/components/_commons/PictoMétéo/PictoMétéo';
import Chantier, { Avancement } from '@/server/domain/chantier/Chantier.interface';
import { comparerAvancementChantier } from '@/client/utils/chantier/avancement/avancement';
import { comparerMétéo } from '@/client/utils/chantier/météo/météo';
import {
  PérimètreGéographiqueIdentifiant,
} from '@/components/PageChantiers/BarreLatérale/SélecteursGéographiques/SélecteurDePérimètreGéographique/SélecteurDePérimètreGéographique.interface';
import {
  périmètreGéographique as périmètreGéographiqueStore,
} from '@/stores/useSélecteursPageChantiersStore/useSélecteursPageChantiersStore';
import { récupérerAvancement, récupérerMétéo } from '@/client/utils/chantier/donnéesTerritoires/donnéesTerritoires';
import ListeChantiersStyled from '@/components/PageChantiers/ListeChantiers/ListeChantiers.styled';
import Météo from '@/server/domain/chantier/Météo.interface';
import ListeChantiersProps from './ListeChantiers.interface';


function afficherMétéo(météo: Météo) {
  return météo !== 'NON_NECESSAIRE' && météo !== 'NON_RENSEIGNEE'
    ? <PictoMétéo valeur={météo} />
    : (
      <span className="texte-gris fr-text--xs">
        { récupérerLibelléMétéo(météo) }
      </span>
    );
}

function afficherLesBarresDeProgression(avancement: Avancement) {
  return (
    avancement.global === null
      ? (
        <span className="texte-gris fr-text--xs">
          Non renseigné
        </span>
      ) : (
        <BarreDeProgression
          fond="gris"
          taille="petite"
          valeur={avancement.global}
          variante='primaire'
        />
      )
  );
}

const reactTableColonnesHelper = createColumnHelper<ListeChantiersProps['chantiers'][number]>();

function colonnesChantiers(périmètreGéographique: PérimètreGéographiqueIdentifiant) {
  const { codeInsee, maille } = périmètreGéographique;
  const cheminChantierMétéoDuTerritoire = (chantier: Chantier) => récupérerMétéo(chantier.mailles, maille, codeInsee);
  const cheminChantierAvancementDuTerritoire = (chantier: Chantier) => récupérerAvancement(chantier.mailles, maille, codeInsee);
  return [
    reactTableColonnesHelper.accessor('nom', {
      header: 'Chantiers',
      cell: nom => {
        const id = nom.row.original.id;
        return (
          <Link href={`/chantier/${id}`}>
            {nom.getValue()}
          </Link>
        );
      },
      enableSorting: false,
    }),
    reactTableColonnesHelper.accessor(cheminChantierMétéoDuTerritoire, {
      header: 'Météo',
      cell: météo => afficherMétéo(météo.getValue()),
      enableGlobalFilter: false,
      sortingFn: (a, b, columnId) => {
        return comparerMétéo(a.getValue(columnId), b.getValue(columnId));
      },
    }),
    reactTableColonnesHelper.accessor(cheminChantierAvancementDuTerritoire, {
      header: 'Avancement',
      cell: avancement => afficherLesBarresDeProgression(avancement.getValue()),
      enableGlobalFilter: false,
      sortingFn: (a, b, columnId) => {
        return comparerAvancementChantier(a.getValue<Avancement>(columnId).global, b.getValue<Avancement>(columnId).global);
      },
    }),
  ];
}

export default function ListeChantiers({ chantiers }: ListeChantiersProps) {
  const périmètreGéographique = périmètreGéographiqueStore();
  return (
    <ListeChantiersStyled>
      <Tableau<typeof chantiers[number]>
        colonnes={colonnesChantiers(périmètreGéographique)}
        données={chantiers}
        entité="chantiers"
        titre="Liste des chantiers"
      />
    </ListeChantiersStyled>
  );
}

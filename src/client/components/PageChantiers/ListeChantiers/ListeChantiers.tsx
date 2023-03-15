import ListeChantiersTableau from '@/components/PageChantiers/ListeChantiers/Tableau/ListeChantiersTableau';
import ListeChantiersStyled from '@/components/PageChantiers/ListeChantiers/ListeChantiers.styled';
import {
  mailleAssociéeAuTerritoireSélectionnéTerritoiresStore,
  territoireSélectionnéTerritoiresStore,
} from '@/stores/useTerritoiresStore/useTerritoiresStore';
import useListeChantiers from '@/components/PageChantiers/ListeChantiers/useListeChantiers';
import ListeChantiersProps, { DonnéesTableauChantiers } from './ListeChantiers.interface';

export default function ListeChantiers({ chantiers }: ListeChantiersProps) {
  const { colonnes } = useListeChantiers();
  const maille = mailleAssociéeAuTerritoireSélectionnéTerritoiresStore();
  const territoireSélectionné = territoireSélectionnéTerritoiresStore();

  const donnéesDuTableau = chantiers.map(chantier => ({
    id: chantier.id,
    nom: chantier.nom,
    avancement: chantier.mailles[maille][territoireSélectionné.codeInsee].avancement.global,
    météo: chantier.mailles[maille][territoireSélectionné.codeInsee].météo,
    estBaromètre: chantier.estBaromètre,
    estTerritorialisé: chantier.estTerritorialisé,
    porteur: chantier.responsables.porteur,
  }));

  return (
    <ListeChantiersStyled>
      <ListeChantiersTableau<DonnéesTableauChantiers>
        colonnes={colonnes}
        données={donnéesDuTableau}
        entité="chantier"
        titre="Liste des chantiers"
      />
    </ListeChantiersStyled>
  );
}

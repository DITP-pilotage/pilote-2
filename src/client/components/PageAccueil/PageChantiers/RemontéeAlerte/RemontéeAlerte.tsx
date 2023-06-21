import RemontéeAlerteStyled from '@/components/PageAccueil/PageChantiers/RemontéeAlerte/RemontéeAlerte.styled';
import RemontéeAlerteProps from '@/components/PageAccueil/PageChantiers/RemontéeAlerte/RemontéeAlerte.interface';
import { actions as actionsFiltresStore } from '@/stores/useFiltresStore/useFiltresStore';
import { Filtre } from '@/client/stores/useFiltresStore/useFiltresStore.interface';

export default function RemontéeAlerte({ nombre, libellé, idFiltre }: RemontéeAlerteProps) {
  const { changerÉtatDuFiltre, estActif } = actionsFiltresStore();
  
  const catégorieDeFiltre = 'filtresAlerte';
  const filtre: Filtre = { id: idFiltre, nom: libellé };
  const filtreEstActif = estActif(idFiltre, catégorieDeFiltre);

  return (
    <RemontéeAlerteStyled
      className={`fr-p-3v fr-p-md-3w ${filtreEstActif ?? 'est-activée'}`}
      disabled={nombre === null}
      onClick={() => changerÉtatDuFiltre(filtre, catégorieDeFiltre)}
    >
      <span className="fr-h1 fr-mb-0 nombre">
        {nombre ?? '-'}
      </span>
      <span className="fr-mb-0 texte-gauche libellé">
        {libellé}
      </span>
    </RemontéeAlerteStyled>
  );
}

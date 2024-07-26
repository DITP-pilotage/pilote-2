import { parseAsBoolean, parseAsString, parseAsStringLiteral, useQueryStates } from 'nuqs';
import Titre from '@/components/_commons/Titre/Titre';
import Ministère from '@/server/domain/ministère/Ministère.interface';
import PérimètreMinistériel from '@/server/domain/périmètreMinistériel/PérimètreMinistériel.interface';
import Axe from '@/server/domain/axe/Axe.interface';
import Ppg from '@/server/domain/ppg/Ppg.interface';
import { DétailTerritoire } from '@/server/domain/territoire/Territoire.interface';
import FiltresSélectionnésCatégorie from './Catégorie/FiltresSélectionnésCatégorie';
import FiltresSélectionnésStyled from './FiltresSélectionnés.styled';

interface FiltresSélectionnésProps {
  estAutoriseAVoirLesBrouillons: boolean
  territoireSélectionné: DétailTerritoire | null;
  ministères: Ministère[]
  axes: Axe[],
}

export default function FiltresSélectionnés({
  estAutoriseAVoirLesBrouillons,
  territoireSélectionné,
  ministères,
  axes,
}: FiltresSélectionnésProps) {

  const [filtres] = useQueryStates({
    perimetres: parseAsString.withDefault(''),
    axes: parseAsString.withDefault(''),
    statut: parseAsStringLiteral(['BROUILLON', 'PUBLIE', 'BROUILLON_ET_PUBLIE']),
    estBarometre: parseAsBoolean.withDefault(false),
    estTerritorialise: parseAsBoolean.withDefault(false),
    estEnAlerteTauxAvancementNonCalculé: parseAsBoolean.withDefault(false),
    estEnAlerteÉcart: parseAsBoolean.withDefault(false),
    estEnAlerteBaisse: parseAsBoolean.withDefault(false),
    estEnAlerteMétéoNonRenseignée: parseAsBoolean.withDefault(false),
    estEnAlerteAbscenceTauxAvancementDepartemental: parseAsBoolean.withDefault(false),
  });

  const listePerimetres = ministères.flatMap(ministère => ministère.périmètresMinistériels);

  const ministèresAvecUnSeulPérimètre = new Map(
    ministères
      .filter((ministère) => ministère.périmètresMinistériels.length === 1)
      .map((ministère) => [ministère.périmètresMinistériels[0].id, ministère.id]),
  );

  const retrouverNomFiltre = (idItemRecherche: string, listItems: Ministère[] | PérimètreMinistériel[] | Axe[] | Ppg[]) => {
    return listItems.find(item => item.id === idItemRecherche)!.nom;
  };

  const filtresCatégories = [
    { nom: 'Territoire', filtresActifs: [territoireSélectionné!.nomAffiché] },
    {
      nom: 'Périmètres ministériels',
      filtresActifs: filtres.perimetres.split(',').filter(Boolean).map((perimetreId) => ministèresAvecUnSeulPérimètre.has(perimetreId) ? retrouverNomFiltre(ministèresAvecUnSeulPérimètre.get(perimetreId)!, ministères) : retrouverNomFiltre(perimetreId, listePerimetres)),
    },
    {
      nom: 'Axes',
      filtresActifs: filtres.axes.split(',').filter(Boolean).map(axeId => retrouverNomFiltre(axeId, axes)),
    },
    {
      nom: 'Autres critères', filtresActifs: [
        filtres.estBarometre ? 'Chantiers du baromètre' : null,
        filtres.estTerritorialise ? 'Chantiers territorialisés' : null,
        estAutoriseAVoirLesBrouillons ? filtres.statut === 'BROUILLON_ET_PUBLIE' ? 'Chantiers validés et en cours de publication' : filtres.statut === 'BROUILLON' ? 'Chantiers en cours de publication' : 'Chantiers validés' : null,
      ].filter(Boolean),
    },
    {
      nom: 'Alertes', filtresActifs: [
        filtres.estEnAlerteTauxAvancementNonCalculé ? 'Taux d’avancement non calculé en raison d’indicateurs non renseignés' : null,
        filtres.estEnAlerteÉcart ? `Chantier(s) avec un retard de 10 points par rapport à leur médiane ${territoireSélectionné?.maille}` : null,
        filtres.estEnAlerteBaisse ? 'Chantier(s) avec tendance en baisse' : null,
        filtres.estEnAlerteMétéoNonRenseignée ? 'Chantier(s) avec météo et synthèse des résultats non renseignés' : null,
        filtres.estEnAlerteAbscenceTauxAvancementDepartemental ? 'Chantier(s) sans taux d’avancement au niveau départemental' : null,
      ].filter(Boolean),
    },
  ];

  return (
    <FiltresSélectionnésStyled className='fr-mb-2w'>
      <Titre
        baliseHtml='h2'
        className='fr-text--lg filtres-sélectionnés__titre'
      >
        Contenu du rapport détaillé
      </Titre>
      <div className='filtres-sélectionnés__conteneur'>
        {filtresCatégories.map(({ nom, filtresActifs }) => (
          <FiltresSélectionnésCatégorie
            filtres={filtresActifs}
            key={nom}
            titre={nom}
          />
        ))}
      </div>
    </FiltresSélectionnésStyled>
  );
}

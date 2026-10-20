import { PictoBaromètre } from "@/components/_commons/PictoBaromètre/PictoBaromètre";
import { PictoChantierBrouillon } from "@/components/_commons/PictoChantierBrouillon/PictoChantierBrouillon";
import { PictoTerritorialise } from "@/components/_commons/PictoTerritorialisé/PictoTerritorialise";
import { IndicateurPondération } from "@/components/PageChantier/PageChantier.interface";
import { Maille } from "@/shared/maille/Maille.interface";

const INFOBULLE_CONTENUS = {
  chantiers: {
    jauges: (
      <>
        <p className="text-sm print:text-base">
          La moyenne affichée dépend des chantiers et du territoire sélectionné.
        </p>
        <p className="text-sm print:text-base">
          Le minimum, la médiane et le maximum dépendent des chantiers et de la
          maille sélectionnée (région ou département).
        </p>
        <p className="text-sm print:text-base mb-0">
          La moyenne d'une maille supérieure (nationale ou régionale) ne
          correspond pas nécessairement à la moyenne des territoires des mailles
          inférieures parce que certains indicateurs qui entrent en compte dans
          le calcul du taux d'avancement sont spécifiques à une maille.
        </p>
      </>
    ),
    jalon: (
      <>
        <h5 className="m-[var(--text-spacing)] text-sm print:text-base mb-2">
          Avancement à échéance
        </h5>
        <p className="text-sm print:text-base">
          Ce sélecteur vous permet d'afficher les valeurs prises successivement
          par le taux d'avancement :
        </p>
        <ul className="m-[var(--text-spacing)] text-sm print:text-base mb-0">
          <li>valeurs observées à la fin des années passées</li>
          <li>valeur à date (année en cours)</li>
        </ul>
      </>
    ),
    repartitions: (
      <p className="text-sm print:text-base mb-0">
        Maximum, médiane et minimum des taux d'avancement observés sur les
        territoires de la maille sélectionnée
      </p>
    ),
    météos: (
      <>
        <p className="text-sm print:text-base">
          La météo désigne le niveau de confiance, estimé par le responsable,
          sur la possibilité d'atteindre les objectifs du chantier.
        </p>
        <p className="text-sm print:text-base mb-0">
          Certains chantiers peuvent ne pas avoir de météo renseignée sur un
          territoire sélectionné. Les chantiers non territorialisés n'attendent
          pas de météo pour le niveau local.
        </p>
      </>
    ),
    alertes: (
      <ul className="m-[var(--text-spacing)] text-sm print:text-base mb-0">
        <li>
          La première alerte signale :
          <ul className="m-[var(--text-spacing)] text-sm print:text-base">
            <li>
              lorsque le niveau national est sélectionné : les chantiers n'ayant
              pas de taux d'avancement au niveau national en raison de l'absence
              de valeurs pour les indicateurs du chantier ou de paramètres
              manquants pour la pondération.
            </li>
            <li>
              lorsqu'un territoire est sélectionné : les chantiers pour lesquels
              le territoire sélectionné a un retard significatif vis-à-vis de la
              médiane des taux d'avancement du chantier concerné pour les
              départements ou les régions. Pour qu'un résultat apparaisse sur
              cette alerte, il faut sélectionner une région ou un département.
            </li>
          </ul>
        </li>
        <li>
          La seconde alerte signale :
          <ul className="m-[var(--text-spacing)] text-sm print:text-base">
            <li>
              lorsque le niveau national est sélectionné : les chantiers n'ayant
              aucun taux d'avancement au niveau départemental.
            </li>
            <li>
              lorsqu'un territoire est sélectionné : les chantiers pour lesquels
              le taux d'avancement a reculé lors de la dernière mise à jour des
              données quantitatives. Pour qu'un résultat apparaisse sur cette
              alerte, il faut sélectionner une région ou un département.
            </li>
          </ul>
        </li>
        <li>
          La dernière alerte signale les chantiers pour lesquels la météo et la
          synthèse des résultats n'ont pas été renseignés.
        </li>
      </ul>
    ),
    listeDesChantiersHeaderTypologie: (
      <>
        <p className="text-sm print:text-base">
          <PictoBaromètre /> : Chantier présent dans le baromètre des résultats
          de l'action publique
        </p>
        <p className="text-sm print:text-base">
          <PictoTerritorialise /> : Chantier dont le pilotage est
          territorialisé.
        </p>
        <p className="text-sm print:text-base">
          <PictoChantierBrouillon /> : Chantier en cours de publication et
          visible uniquement par la direction de projet en administration
          centrale.
        </p>
      </>
    ),
    listeDesChantiersHeaderMeteo: (
      <p className="text-sm print:text-base">
        La date affichée sous la météo correspond à la date de la dernière
        modification de la météo, de la synthèse ou d'un commentaire.
      </p>
    ),
    listeDesChantiersHeaderTauxAvancement: (
      <p className="text-sm print:text-base">
        La date affichée sous le taux d'avancement correspond à la dernière mise
        à jour des données pour au moins un indicateur du chantier.
      </p>
    ),
    listeDesChantiersHeaderTendance: (
      <p className="text-sm print:text-base">
        La tendance correspond à la progression du taux d'avancement.
      </p>
    ),
    listeDesChantiersHeaderEcart: (
      <p className="text-sm print:text-base mb-0">
        L'écart correspond à l'écart entre le taux d'avancement pour le
        territoire sélectionné et le taux d'avancement territorial médian. Il
        s'affiche si un département ou une région est sélectionné.
      </p>
    ),
  },
  chantier: {
    avancement: {
      aucunIndicateur: (maille: Maille) => (
        <p className="text-sm print:text-base mb-0">
          {`À la maille ${maille}, `}
          aucun indicateur de ce chantier n'est pris en compte dans le calcul du
          taux d'avancement global.
        </p>
      ),
      unSeulIndicateur: (
        maille: Maille,
        indicateurPondération: IndicateurPondération,
      ) => (
        <p className="text-sm print:text-base mb-0">
          {`À la maille ${maille}, `}
          le taux d'avancement global correspond au taux d'avancement de
          l'indicateur&nbsp;:
          {` ${indicateurPondération.nom}`}
        </p>
      ),
      plusieursIndicateurs: (
        maille: Maille,
        indicateurPondérations: IndicateurPondération[],
      ) => (
        <>
          <p className="text-sm print:text-base mb-0">
            {`À la maille ${maille}, `}
            le taux d'avancement global correspond à la somme des taux
            d'avancement des indicateurs, pondérés de la façon suivante&nbsp;:
          </p>
          <ul className="m-[var(--text-spacing)] text-sm print:text-base mb-0">
            {indicateurPondérations.map(({ pondération, nom }) => (
              <li key={nom}>
                {pondération}% du taux d'avancement de l'indicateur&nbsp;:
                {` ${nom}`}
              </li>
            ))}
          </ul>
        </>
      ),
      comparaisonDeLAvancementRegDep: (
        <>
          <p className="text-sm print:text-base">
            L'écart correspond à l'écart entre le taux d'avancement pour le
            territoire sélectionné et le taux d'avancement territorial (régional
            ou départemental) médian.
          </p>
          <p className="text-sm print:text-base mb-0">
            L'évolution temporelle (ou tendance) correspond à la progression du
            taux d'avancement. Elle est calculée par rapport au taux
            d'avancement précédent du chantier sur le territoire. Elle est
            considérée en hausse si le taux d'avancement a augmenté de plus de 1
            point par rapport au taux précédent. Elle est considérée en baisse
            si le taux d'avancement a diminué de plus de 1 point par rapport au
            taux précédent.
          </p>
        </>
      ),
      comparaisonDeLAvancementNat: (
        <p className="text-sm print:text-base mb-0">
          L'évolution temporelle (ou tendance) correspond à la progression du
          taux d'avancement. Elle est calculée par rapport au taux d'avancement
          précédent du chantier sur le territoire. Elle est considérée en hausse
          si le taux d'avancement a augmenté de plus de 1 point par rapport au
          taux précédent. Elle est considérée en baisse si le taux d'avancement
          a diminué de plus de 1 point par rapport au taux précédent.
        </p>
      ),
    },
    météoEtSynthèseDesRésultats: (
      <>
        <p className="text-sm print:text-base">
          La météo désigne le niveau de confiance, estimé par le responsable,
          sur la possibilité d'atteindre les objectifs du chantier.
        </p>
        <p className="text-sm print:text-base mb-0">
          La synthèse est une présentation synthétique de l'état d'avancement du
          chantier, actualisé depuis la dernière mise à jour des données.
        </p>
      </>
    ),
    répartitionGéographiqueTauxAvancement: (
      <p className="text-sm print:text-base mb-0">
        Territorialisation du taux d'avancement du chantier
      </p>
    ),
    répartitionGéographiqueNiveauDeConfiance: (
      <p className="text-sm print:text-base mb-0">
        Répartition de la météo déclarée par chaque responsable local pour
        l'avancement de son chantier dans son territoire.
      </p>
    ),
    objectifs: (
      <p className="text-sm print:text-base mb-0">
        Présentation des objectifs et des principales actions passées et à venir
        au niveau national. Si le chantier est territorialisé, ces éléments
        seront visibles par les services déconcentrés et doivent les aider à
        comprendre le chantier et à le faire avancer localement.
      </p>
    ),
    décisionsStratégiques: (
      <p className="text-sm print:text-base">
        Décisions prises lors des réunions Elysée ↔ Matignon et suivi des
        actions prises pour répondre à ces décisions.
      </p>
    ),
    commentaires: {
      territoireNational: (
        <>
          <p className="text-sm print:text-base">
            Diagnostic du directeur de projet repris pour les supports de
            présentation des réunions Elysée ↔ Matignon.
          </p>
          <ul className="m-[var(--text-spacing)] text-sm print:text-base mb-0">
            <li>Explication des résultats chiffrés</li>
            <li>
              Analyse des résultats qui ne transparaissent pas dans les données
            </li>
            <li>Analyse des freins et solutions envisagées</li>
            <li>
              Exemples de réussites pouvant être communiqués plus largement.
            </li>
          </ul>
        </>
      ),
      territoireNonNational: (
        <>
          <p className="text-sm print:text-base">
            Diagnostic du responsable local du chantier repris pour préparer les
            RIM régionales.
          </p>
          <ul className="m-[var(--text-spacing)] text-sm print:text-base mb-0">
            <li>Explication des résultats chiffrés</li>
            <li>
              Présentation des résultats qui ne transparaissent pas dans les
              données.
            </li>
          </ul>
        </>
      ),
    },
  },
};

export default INFOBULLE_CONTENUS;

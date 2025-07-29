import SélecteursMaillesEtTerritoires from "@/components/_commons/SélecteursMaillesEtTerritoiresChantier/SélecteursMaillesEtTerritoires";
import { MailleInterne } from "@/server/domain/maille/Maille.interface";
import SélecteurMaille from "@/client/components/_commons/SélecteursMaillesEtTerritoiresChantier/SélecteurMaille/SélecteurMaille";
import INFOBULLE_CONTENUS from "@/client/constants/infobulles";
import Infobulle from "@/client/components/_commons/Infobulle/Infobulle";
import SelecteurJalon from "@/client/components/_commons/SelecteurJalon/SelecteurJalon";

type PanelMenuNavigationProps = {
  pathname: string;
  territoireCode: string;
  mailleQuery: MailleInterne;
  estAutoriseAVoirLeSelecteurDeMaille: boolean;
  setEstOuverteBarreLatérale: (estOuverte: boolean) => void;
  libelleMenuNavigation?: string;
};

export const PanelMenuNavigation = ({
  pathname,
  territoireCode,
  mailleQuery,
  estAutoriseAVoirLeSelecteurDeMaille,
  setEstOuverteBarreLatérale,
  libelleMenuNavigation = "Filtrer",
}: PanelMenuNavigationProps) => {
  return (
    <>
      <div className="fr-col-12 fr-col-md-3 fr-pb-2w fr-px-2w">
        <SélecteursMaillesEtTerritoires
          direction="horizontal"
          pathname={pathname}
          territoireCode={territoireCode}
        />
      </div>
      <div className="fr-col-12 fr-col-md-3 fr-pb-2w fr-px-2w">
        <div className="flex align-center">
          <label className="fr-label fr-mr-1w no-wrap" htmlFor="jalon">
            Jalon :
          </label>
          <SelecteurJalon />
          <Infobulle idHtml="infobulle-selecteur-jalon">
            {INFOBULLE_CONTENUS.chantiers.jalon}
          </Infobulle>
        </div>
      </div>
      {estAutoriseAVoirLeSelecteurDeMaille ? (
        <div className="fr-col-12 fr-col-md-3 fr-pb-2w fr-px-2w flex align-center">
          <SélecteurMaille mailleQuery={mailleQuery} pathname={pathname} />
        </div>
      ) : null}
      <div className="fr-hidden-lg fr-py-1w fr-background-blue-france-975 w-full">
        <button
          className="fr-btn fr-btn--tertiary-no-outline fr-btn--icon-left fr-icon-equalizer-fill fr-text-title--blue-france"
          onClick={() => {
            setEstOuverteBarreLatérale(true);
          }}
          title="Filtrer"
          type="button"
        >
          {libelleMenuNavigation}
        </button>
      </div>
    </>
  );
};

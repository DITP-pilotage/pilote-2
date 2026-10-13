import { FunctionComponent, useState } from "react";
import { Button } from "@/components/shared/Button";
import AdminIndicateurBarreLatérale from "@/components/PageAdminIndicateurs/AdminIndicateurBarreLatérale";
import TableauAdminIndicateurs from "@/components/PageAdminIndicateurs/TableauAdminIndicateurs/TableauAdminIndicateurs";
import usePageAdminIndicateurs from "@/components/PageAdminIndicateurs/UsePageAdminIndicateurs";

const PageAdminIndicateurs: FunctionComponent = () => {
  const [estOuverteBarreLatérale, setEstOuverteBarreLatérale] = useState(false);
  const { naviguerVersCreationIndicateur } = usePageAdminIndicateurs();

  return (
    <div>
      <div className="flex">
        <AdminIndicateurBarreLatérale
          estOuverteBarreLatérale={estOuverteBarreLatérale}
          setEstOuverteBarreLatérale={setEstOuverteBarreLatérale}
        />
        <main className="fr-container--fluid p-4">
          <div className="fr-grid-row fr-grid-row--middle fr-grid-row--gutters mb-4">
            <div className="fr-col-12 fr-col-md-9">
              <h1 className="text-h1 md:text-h1-md mb-0">
                Gestion des paramètres des indicateurs
              </h1>
            </div>
            <div className="fr-col-12 fr-col-md-3 flex items-end justify-end max-[576px]:justify-center">
              <Button
                variant="primary"
                className="whitespace-nowrap"
                onClick={naviguerVersCreationIndicateur}
                type="button"
              >
                Créer un indicateur
              </Button>
            </div>
          </div>
          <div className="p-4 bg-white">
            <TableauAdminIndicateurs />
          </div>
        </main>
      </div>
    </div>
  );
};

export default PageAdminIndicateurs;

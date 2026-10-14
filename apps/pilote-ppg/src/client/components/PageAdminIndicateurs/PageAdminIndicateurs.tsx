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
        <main className="max-w-none overflow-hidden p-4">
          <div className="flex flex-wrap items-center -mx-2 -mt-2 lg:-mx-3 lg:-mt-3 mb-4">
            <div className="p-2 lg:p-3 w-full shrink-0 md:w-3/4">
              <h1 className="text-h1 md:text-h1-md mb-0">
                Gestion des paramètres des indicateurs
              </h1>
            </div>
            <div className="p-2 lg:p-3 w-full shrink-0 md:w-1/4 flex items-end justify-end max-[576px]:justify-center">
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

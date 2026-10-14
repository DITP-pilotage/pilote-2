import { FunctionComponent } from "react";
import Bloc from "@/components/_commons/Bloc/Bloc";

const MentionsLegales: FunctionComponent = () => {
  return (
    <main>
      <div className="w-full mx-auto px-4 lg:px-6 xl:max-w-[78rem] pb-4">
        <div className="flex flex-wrap py-8">
          <h1 className="my-auto">Mentions légales</h1>
        </div>
        <Bloc>
          <div className="flex flex-wrap">
            <div className="w-full shrink-0">
              <h4 className="text-h4 md:text-h4-md">Éditeur</h4>
              <p>
                Ce site est édité par la Direction Interministérielle de la
                Transformation Publique.
              </p>
              <ul className="list-none p-0">
                <li>20 avenue de Ségur</li>
                <li>75334 Paris Cedex 07</li>
                <li>France</li>
              </ul>
              <p>https://www.modernisation.gouv.fr</p>
            </div>
          </div>
          <div className="flex flex-wrap">
            <div className="w-full shrink-0">
              <h4 className="text-h4 md:text-h4-md">
                Direction de la publication
              </h4>
              <p>
                Ce site est édité par la Direction Interministérielle de la
                Transformation Publique.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap">
            <div className="w-full shrink-0">
              <h4 className="text-h4 md:text-h4-md">Responsable éditoriale</h4>
              <p>Cécile Le Guen</p>
            </div>
          </div>
          <div className="flex flex-wrap">
            <div className="w-full shrink-0">
              <h4 className="text-h4 md:text-h4-md">Hébergement</h4>
              <ul className="list-none p-0">
                <li>Scalingo SAS</li>
                <li>3 place de Haguenau</li>
                <li>67000 Strasbourg</li>
                <li>France</li>
              </ul>
              <p>SIRET 80866548300018</p>
              <p>https://scalingo.com/fr</p>
            </div>
          </div>
        </Bloc>
      </div>
    </main>
  );
};

export default MentionsLegales;

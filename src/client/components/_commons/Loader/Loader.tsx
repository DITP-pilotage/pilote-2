import Image from "next/image";
import { FunctionComponent } from "react";
import marianneSvg from "../../../../../public/img/marianne.svg";

const Loader: FunctionComponent = () => {
  return (
    <div className="absolute top-1/2 left-1/2 text-center -translate-x-1/2 -translate-y-1/2 fr-grid-row fr-grid-row--center fr-grid-row--middle fr-py-2w">
      <div className="fr-col-12">
        <Image alt="" className="inline animate-pulse-opacity" src={marianneSvg} />
        <p className="fr-mb-0">Chargement des données en cours...</p>
      </div>
    </div>
  );
};

export default Loader;

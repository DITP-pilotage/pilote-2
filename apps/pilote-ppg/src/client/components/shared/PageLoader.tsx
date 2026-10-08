import Image from "next/image";
import marianneSvg from "../../../../public/img/marianne.svg";

export const PageLoader = () => (
  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 py-4 text-center">
    <Image alt="" className="inline animate-pulse-opacity" src={marianneSvg} />
    <p className="mb-0">Chargement des données en cours...</p>
  </div>
);

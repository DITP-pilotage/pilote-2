import { ReactNode } from "react";
import { DefaultValues, Resolver, SubmitHandler } from "react-hook-form";

export interface Publication {
  contenu: string;
  dateCreation: string;
  dateModification: string;
  auteurCreationNom: string;
  auteurCreationService: string | null;
  auteurCreationFonction: string | null;
  auteurModificationNom: string;
  auteurModificationService: string | null;
  auteurModificationFonction: string | null;
}

export interface PublicationBrouillon {
  id: string;
  contenu: string;
  dateModification: string;
}

export interface ValeursPublication {
  contenu: string;
}

export interface PublicationActions<
  T extends ValeursPublication = ValeursPublication,
> {
  publier: SubmitHandler<T>;
  enregistrerEnBrouillon: SubmitHandler<T>;
  publierBrouillon: SubmitHandler<T>;
  modifierBrouillon: SubmitHandler<T>;
  modifier: SubmitHandler<T>;
}

export interface FormulairePublicationConfiguration<
  T extends ValeursPublication,
> {
  resolver: Resolver<T>;
  limiteCaracteres: number;
  valeursModification: DefaultValues<T>;
  valeursNouvellePublication: DefaultValues<T>;
  champsAnnexes?: ReactNode;
}

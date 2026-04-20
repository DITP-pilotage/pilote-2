import { useState } from "react";
import { SubmitHandler } from "react-hook-form";
import { CommentaireAction } from "./AlertePublication";
import { PublicationActions } from "./Publication.interface";

export const usePublicationSectionEtat = (actions: PublicationActions) => {
  const [modeÉdition, setModeÉdition] = useState(false);
  const [alerteAction, setAlerteAction] = useState<CommentaireAction | null>(
    null,
  );

  const handleModifier: SubmitHandler<{ contenu: string }> = async (data) => {
    await actions.modifier(data);
    setModeÉdition(false);
    setAlerteAction("modification-reussie");
  };

  const handlePublier: SubmitHandler<{ contenu: string }> = async (data) => {
    await actions.publier(data);
    setAlerteAction("publication-reussie");
  };

  const handleEnregistrerEnBrouillon: SubmitHandler<{
    contenu: string;
  }> = async (data) => {
    await actions.enregistrerEnBrouillon(data);
    setAlerteAction(null);
  };

  const handlePublierBrouillon: SubmitHandler<{
    contenu: string;
  }> = async (data) => {
    await actions.publierBrouillon(data);
    setAlerteAction("publication-reussie");
  };

  const handleModifierBrouillon: SubmitHandler<{
    contenu: string;
  }> = async (data) => {
    await actions.modifierBrouillon(data);
    setAlerteAction(null);
  };

  return {
    modeÉdition,
    entrerEnModeÉdition: () => setModeÉdition(true),
    quitterModeÉdition: () => setModeÉdition(false),
    alerteAction,
    handleModifier,
    handlePublier,
    handleBrouillon: handleEnregistrerEnBrouillon,
    handlePublierBrouillon,
    handleModifierBrouillon,
  };
};

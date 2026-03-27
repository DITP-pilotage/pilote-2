import { useState } from "react";
import { Modale } from "@/client/components/shared/Modale";
import { Callout } from "@/client/components/shared/Callout";
import { Accordion } from "@/client/components/shared/Accordion";
import { InformationPleineIcon } from "@/components/_commons/Icones/InformationPleineIcon";
import { WarningIcon } from "@/components/_commons/Icones/WarningIcon";
import { ErrorWarningIcon } from "@/components/_commons/Icones/ErrorWarningIcon";

const CALLOUT_VARIANTES = [
  { valeur: "info", label: "Info", icone: InformationPleineIcon },
  { valeur: "success", label: "Succès", icone: InformationPleineIcon },
  { valeur: "warning", label: "Attention", icone: WarningIcon },
  { valeur: "error", label: "Erreur", icone: ErrorWarningIcon },
  { valeur: "blue", label: "Bleu", icone: InformationPleineIcon },
  { valeur: "moutarde", label: "Moutarde", icone: WarningIcon },
] as const;

export const ModaleInsertionComposant = ({
  open,
  onOpenChange,
  onInsererCallout,
  onInsererAccordion,
  composantsDisponibles,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsererCallout: (color: string) => void;
  onInsererAccordion: () => void;
  composantsDisponibles: { callout: boolean; accordion: boolean };
}) => {
  const [calloutColor, setCalloutColor] = useState("info");

  const varianteCallout = CALLOUT_VARIANTES.find(
    (variante) => variante.valeur === calloutColor,
  );

  return (
    <Modale
      onOpenChange={(ouvert) => {
        if (!ouvert) setCalloutColor("info");
        onOpenChange(ouvert);
      }}
      open={open}
      size="sm"
      title="Insérer un composant"
    >
      <div className="flex flex-col gap-6">
        {composantsDisponibles.callout && (
          <div className="flex flex-col gap-3">
            <h4 className="text-sm font-bold mb-0">Callout</h4>
            <div className="flex flex-wrap gap-1">
              {CALLOUT_VARIANTES.map(({ valeur, label }) => (
                <button
                  className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                    calloutColor === valeur
                      ? "!bg-blue-600 !text-white !border-blue-600"
                      : "!bg-white !text-gray-600 !border-gray-300 hover:!bg-gray-50"
                  }`}
                  key={valeur}
                  onClick={() => setCalloutColor(valeur)}
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>
            <Callout.Root color={calloutColor as "info"}>
              <Callout.Icon icone={varianteCallout?.icone} />
              <Callout.Text>Aperçu du callout</Callout.Text>
            </Callout.Root>
            <button
              className="self-end px-4 py-2 rounded text-sm !bg-primary !text-white"
              onClick={() => {
                onInsererCallout(calloutColor);
                onOpenChange(false);
              }}
              type="button"
            >
              Insérer ce callout
            </button>
          </div>
        )}

        {composantsDisponibles.callout && composantsDisponibles.accordion && (
          <hr className="border-gray-200" />
        )}

        {composantsDisponibles.accordion && (
          <div className="flex flex-col gap-3">
            <h4 className="text-sm font-bold mb-0">Accordéon</h4>
            <div className="pointer-events-none">
              <Accordion.Root collapsible defaultValue="preview" type="single">
                <Accordion.Item value="preview">
                  <Accordion.Header>
                    <Accordion.Trigger>Titre de l'accordéon</Accordion.Trigger>
                  </Accordion.Header>
                  <Accordion.Content>Contenu de l'accordéon</Accordion.Content>
                </Accordion.Item>
              </Accordion.Root>
            </div>
            <button
              className="self-end px-4 py-2 rounded text-sm !bg-primary !text-white"
              onClick={() => {
                onInsererAccordion();
                onOpenChange(false);
              }}
              type="button"
            >
              Insérer un accordéon
            </button>
          </div>
        )}
      </div>
    </Modale>
  );
};

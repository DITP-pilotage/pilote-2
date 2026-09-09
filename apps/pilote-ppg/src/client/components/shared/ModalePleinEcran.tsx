import { Dialog } from "radix-ui";
import { ReactNode } from "react";
import { Icone } from "@/components/_commons/Icone";
import { CloseLineIcon } from "@/components/_commons/Icones/CloseLineIcon";
import { ArrowDownCircleIcon } from "@/components/_commons/Icones/ArrowDownCircleIcon";

export const ModalePleinEcran = ({
  title,
  open,
  onOpenChange,
  onReduire,
  children,
}: {
  title: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReduire?: () => void;
  children: ReactNode;
}) => {
  // Quand la modale sait se réduire, les gestes d'évitement (Échap, clic hors
  // du calque) réduisent au lieu de fermer : seul « Fermer » est destructif.
  const reduireAuLieuDeFermer = (event: { preventDefault: () => void }) => {
    if (!onReduire) return;
    event.preventDefault();
    onReduire();
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 !bg-black/50 z-10" />
        <Dialog.Content
          className="fixed inset-4 z-10 flex items-center justify-center !pointer-events-none"
          onEscapeKeyDown={reduireAuLieuDeFermer}
          onInteractOutside={reduireAuLieuDeFermer}
        >
          <div className="relative w-full h-full bg-white pt-4 px-0 pb-0 rounded-md shadow-md !pointer-events-auto flex flex-col">
            <div className="absolute top-2 right-4 flex items-center gap-1">
              {onReduire ? (
                <button
                  className="!text-primary flex items-center gap-1 px-4 py-2 !text-sm"
                  onClick={onReduire}
                  title="Réduire la fenêtre"
                  type="button"
                >
                  Réduire
                  <Icone
                    className="w-4 h-4 !text-current"
                    icone={ArrowDownCircleIcon}
                  />
                </button>
              ) : null}
              <Dialog.Close asChild>
                <button
                  className="!text-primary flex items-center gap-1 px-4 py-2 !text-sm"
                  title="Fermer la fenêtre modale"
                  type="button"
                >
                  Fermer
                  <Icone
                    className="w-4 h-4 !text-current"
                    icone={CloseLineIcon}
                  />
                </button>
              </Dialog.Close>
            </div>
            <Dialog.Title className="!text-primary !text-2xl !mb-4 px-8">
              {title}
            </Dialog.Title>
            <div className="flex-1 min-h-0">{children}</div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

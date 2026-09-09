import { Dialog } from "radix-ui";
import { ReactNode } from "react";
import { Icone } from "@/components/_commons/Icone";
import { CloseLineIcon } from "@/components/_commons/Icones/CloseLineIcon";
import { ArrowDownCircleIcon } from "@/components/_commons/Icones/ArrowDownCircleIcon";

export const ModalePleinEcran = ({
  title,
  open,
  onOpenChange,
  onMinimize,
  children,
}: {
  title: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMinimize: () => void;
  children: ReactNode;
}) => {
  // Dismiss gestures (Escape, click outside the layer) minimize rather than
  // close: only « Fermer » discards the conversation.
  const minimizeInsteadOfClosing = (event: { preventDefault: () => void }) => {
    event.preventDefault();
    onMinimize();
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 !bg-black/50 z-10" />
        <Dialog.Content
          className="fixed inset-4 z-10 flex items-center justify-center !pointer-events-none"
          onEscapeKeyDown={minimizeInsteadOfClosing}
          onInteractOutside={minimizeInsteadOfClosing}
        >
          <div className="relative w-full h-full bg-white pt-4 px-0 pb-0 rounded-md shadow-md !pointer-events-auto flex flex-col">
            <div className="absolute top-2 right-4 flex items-center gap-1">
              <button
                className="!text-primary flex items-center gap-1 px-4 py-2 !text-sm"
                onClick={onMinimize}
                title="Réduire la fenêtre"
                type="button"
              >
                Réduire
                <Icone
                  className="w-4 h-4 !text-current"
                  icone={ArrowDownCircleIcon}
                />
              </button>
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

import { Dialog } from "radix-ui";
import { ReactNode } from "react";
import { Icone } from "@/components/_commons/Icone";
import { CloseLineIcon } from "@/components/_commons/Icones/CloseLineIcon";

export const ModalePleinEcran = ({
  title,
  open,
  onOpenChange,
  children,
}: {
  title: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}) => {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 !bg-black/50 z-10" />
        <Dialog.Content className="fixed inset-4 z-10 flex items-center justify-center !pointer-events-none">
          <div className="relative w-full h-full bg-white p-8 rounded-md shadow-md !pointer-events-auto flex flex-col">
            <Dialog.Close asChild>
              <button
                className="!text-primary flex items-center gap-1 px-4 py-2 absolute top-2 right-4 !text-sm"
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
            <Dialog.Title className="!text-primary !text-2xl !mb-4">
              {title}
            </Dialog.Title>
            <div className="flex-1 min-h-0">{children}</div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

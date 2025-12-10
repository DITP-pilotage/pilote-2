import { Dialog } from "radix-ui";
import { ComponentProps, ReactNode } from "react";
import { Icone } from "@/components/_commons/Icone";
import { CloseLineIcon } from "@/components/_commons/Icones/CloseLineIcon";

export const Modal = ({
  trigger,
  title,
  children,
  ...props
}: Pick<
  ComponentProps<typeof Dialog.Root>,
  "open" | "onOpenChange" | "children"
> & {
  title: ReactNode;
  trigger?: ReactNode;
}) => {
  return (
    <Dialog.Root {...props}>
      {trigger ? <Dialog.Trigger asChild>{trigger}</Dialog.Trigger> : null}
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 !bg-black/50 z-10" />
        <Dialog.Content className="fixed inset-8 z-10 flex items-center justify-center !pointer-events-none">
          <div className="relative w-full max-w-[1000px] bg-white p-8 rounded-md shadow-md !pointer-events-auto">
            <Dialog.Close asChild>
              <button
                className="!text-primary flex align-center gap-1 px-4 py-2 absolute top-2 right-4 !text-sm"
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
            {children}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

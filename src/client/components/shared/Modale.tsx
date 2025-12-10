import { Dialog } from "radix-ui";
import { ComponentProps, ReactNode } from "react";
import { Icone } from "@/components/_commons/Icone";
import { CloseLineIcon } from "@/components/_commons/Icones/CloseLineIcon";
import { clsxm } from "@/utils/clsxm";

export const Modale = ({
  trigger,
  title,
  sousTitre,
  titleHidden = false,
  children,
  size = "lg",
  ...props
}: Pick<
  ComponentProps<typeof Dialog.Root>,
  "open" | "onOpenChange" | "children"
> & {
  title: ReactNode;
  sousTitre?: string;
  titleHidden?: boolean;
  trigger?: ReactNode;
  size?: "md" | "lg";
}) => {
  return (
    <Dialog.Root {...props}>
      {trigger ? <Dialog.Trigger asChild>{trigger}</Dialog.Trigger> : null}
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 !bg-black/50 z-10" />
        <Dialog.Content className="fixed inset-0 md:inset-8 z-10 flex items-end md:items-center md:justify-center !pointer-events-none">
          <div
            className={clsxm(
              "relative w-full bg-white p-8 rounded-t-md md:rounded-md shadow-md !pointer-events-auto [word-break:break-word]",
              {
                "max-w-[1000px]": size === "lg",
                "max-w-[900px]": size === "md",
              },
            )}
          >
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
            <Dialog.Title
              className={clsxm("!text-primary !text-2xl !mb-4", {
                "sr-only": titleHidden,
              })}
            >
              {title}
            </Dialog.Title>
            {sousTitre ? <p className="fr-text--lg bold">{sousTitre}</p> : null}
            {children}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

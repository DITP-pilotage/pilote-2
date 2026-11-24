import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { récupérerUnCookie } from "@/client/utils/cookies";
import { api } from "@/server/framework/trpc/api";
import {
  dimensionSlotSchema,
  MAX_DIMENSION_SLOT,
} from "@/shared/analytics/dimensions";
import type { DimensionRow } from "./useTableauDimensions";

const TOAST_OPTIONS = {
  duration: 5000,
  position: "top-right",
  richColors: true,
} as const;

const toSlot = (value: string) => (value === "" ? null : Number(value));

const isSlot = (value: string) =>
  value === "" ||
  (/^\d+$/.test(value) && dimensionSlotSchema.safeParse(Number(value)).success);

const formSchema = z.object({
  slot: z
    .string()
    .trim()
    .refine(isSlot, `Saisissez un nombre entier de 1 à ${MAX_DIMENSION_SLOT}.`),
});

type DimensionForm = z.infer<typeof formSchema>;

export const useDimensionForm = ({
  row,
  onClose,
}: {
  row: DimensionRow;
  onClose: () => void;
}) => {
  const utils = api.useUtils();
  const reactHookForm = useForm<DimensionForm>({
    resolver: zodResolver(formSchema),
    defaultValues: { slot: row.slot === null ? "" : String(row.slot) },
  });

  const setDimensionSlot = api.analytics.setDimensionSlot.useMutation({
    onSuccess: async () => {
      await utils.analytics.dimensionSlots.invalidate();
      toast.success("Dimension enregistrée.", TOAST_OPTIONS);
      onClose();
    },
    onError: (error) => toast.error(error.message, TOAST_OPTIONS),
  });

  const save = reactHookForm.handleSubmit(({ slot }) => {
    if (setDimensionSlot.isPending) return;
    setDimensionSlot.mutate({
      dimension: row.dimension,
      slot: toSlot(slot),
      csrf: récupérerUnCookie("csrf") ?? "",
    });
  });

  return { control: reactHookForm.control, save };
};

import { toast } from "sonner";

const TOAST_OPTIONS = {
  position: "top-right" as const,
  richColors: true,
};

export const Toaster = {
  success: (message: string) => toast.success(message, TOAST_OPTIONS),
  error: (message: string) => toast.error(message, TOAST_OPTIONS),
};

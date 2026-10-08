import { useRouter } from "next/router";
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/server/framework/trpc/api";
import { ChantierDetail } from "@/server/rapport-detaille/rapportDetaille.interface";
import { CHANTIER_DETAILS_BATCH_SIZE } from "@/server/rapport-detaille/batchSize";

export type ChantierDetailState =
  | { status: "loading" }
  | { status: "success"; detail: ChantierDetail }
  | { status: "error" };

function toQuery(query: Record<string, string | string[] | undefined>) {
  return Object.fromEntries(
    Object.entries(query).filter(
      (entry): entry is [string, string | string[]] => entry[1] !== undefined,
    ),
  );
}

export function useChantierDetailsBatches(territoireCode: string) {
  const router = useRouter();
  const utils = api.useUtils();
  const [states, setStates] = useState<Map<string, ChantierDetailState>>(
    () => new Map(),
  );
  const requested = useRef(new Set<string>());
  const pending = useRef(new Set<string>());
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateStates = useCallback(
    (chantierIds: string[], state: ChantierDetailState) => {
      setStates((previous) => {
        const next = new Map(previous);
        chantierIds.forEach((chantierId) => next.set(chantierId, state));
        return next;
      });
    },
    [],
  );

  const flush = useCallback(() => {
    const chantierIds = [...pending.current];
    pending.current.clear();
    const query = toQuery(router.query);
    for (
      let index = 0;
      index < chantierIds.length;
      index += CHANTIER_DETAILS_BATCH_SIZE
    ) {
      const batch = chantierIds.slice(
        index,
        index + CHANTIER_DETAILS_BATCH_SIZE,
      );
      updateStates(batch, { status: "loading" });
      utils.rapportDetaille.chantierDetails
        .fetch({ territoireCode, query, chantierIds: batch })
        .then(({ details }) => {
          const detailsById = new Map(
            details.map((detail) => [detail.chantierId, detail]),
          );
          batch
            .filter((chantierId) => !detailsById.has(chantierId))
            .forEach((chantierId) => requested.current.delete(chantierId));
          setStates((previous) => {
            const next = new Map(previous);
            batch.forEach((chantierId) => {
              const detail = detailsById.get(chantierId);
              next.set(
                chantierId,
                detail ? { status: "success", detail } : { status: "error" },
              );
            });
            return next;
          });
        })
        .catch(() => {
          batch.forEach((chantierId) => requested.current.delete(chantierId));
          updateStates(batch, { status: "error" });
        });
    }
  }, [router.query, territoireCode, updateStates, utils]);

  const request = useCallback(
    (chantierId: string) => {
      if (requested.current.has(chantierId)) return;
      requested.current.add(chantierId);
      pending.current.add(chantierId);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(flush, 0);
    },
    [flush],
  );

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  return { states, request };
}

import { useMemo } from "react";
import { useMyRelations, type MyRelation } from "./useMyRelations";

export type ConsultantItem = {
  relationId: number;
  createdAt: string;
  consultant: { id: number; email: string; phone?: string | null; firstName: string; lastName: string };
};

export function useConsultants() {
  const query = useMyRelations();

  const mapItem = (r: MyRelation): ConsultantItem => ({
    relationId: r.id,
    createdAt: r.createdAt,
    consultant: {
      id: r.consultant.id,
      email: r.consultant.email,
      phone: r.consultant.phone ?? null,
      firstName: r.consultant.firstName,
      lastName: r.consultant.lastName,
    },
  });

  const current = useMemo(
    () => (query.data ?? []).filter((r) => r.relationType === "CONSULTANT_CLIENT").map(mapItem),
    [query.data]
  );

  const pending = useMemo(
    () => (query.data ?? []).filter((r) => r.relationType === "CONSULTANT_LEAD").map(mapItem),
    [query.data]
  );

  return {
    current,
    pending,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}



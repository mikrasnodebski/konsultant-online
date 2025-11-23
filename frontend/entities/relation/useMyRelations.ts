import { useQuery } from "@tanstack/react-query";
import { api } from "../api";

export type MyRelation = {
  id: number;
  relationType: "CONSULTANT_LEAD" | "CONSULTANT_CLIENT";
  consultant: { id: number; email: string; phone?: string | null; firstName: string; lastName: string };
  createdAt: string;
};

type MyRelationsResponse = {
  relations: MyRelation[];
};

export function useMyRelations() {
  return useQuery({
    queryKey: ["my-relations", "client"],
    queryFn: async () => {
      const res = await api.get<MyRelationsResponse>("/relations/mine-client");
      return res.data.relations;
    },
  });
}



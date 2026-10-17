import { queryOptions } from "@tanstack/react-query";
import { apiGetRewards, apiGetMedails, apiGetUserMedails } from "./catalog-api";

// Catalogs are shared and retained for the lifetime of this app instance.
const catalogCache = {
  staleTime: Infinity,
  gcTime: Infinity,
  refetchOnMount: false,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
  retry: false,
} as const;

export const rewardsQueryOptions = queryOptions({
  ...catalogCache,
  queryKey: ["rewards"],
  // Finish the first request even if the view is left before it completes.
  queryFn: () => apiGetRewards(),
});

export const medailsQueryOptions = queryOptions({
  ...catalogCache,
  queryKey: ["medails"],
  queryFn: () => apiGetMedails(),
});

export const userMedailsQueryOptions = (userId?: number) => queryOptions({
  queryKey: ["user-medails", userId],
  queryFn: ({ signal }) => apiGetUserMedails(userId!, signal),
  enabled: userId !== undefined,
  // Recheck earned medails on entry without reloading the two catalogs.
  staleTime: 0,
  gcTime: 0,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
  retry: false,
});

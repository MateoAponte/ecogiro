import { queryOptions } from '@tanstack/react-query';
import { apiGetRecoveries, type Report } from './recoveries-api';

export function recoveriesQueryOptions(
  userId: number | undefined,
  sessionReady: boolean,
) {
  const id =
    typeof userId === 'number' && Number.isSafeInteger(userId) && userId > 0
      ? userId
      : null;
  return queryOptions({
    queryKey: ['recoveries', id] as const,
    queryFn: ({ queryKey, signal }): Promise<Report[]> => {
      // refetch() can run even with enabled:false, including callbacks retained
      // across session restoration/logout. Read the ID from this query's key.
      if (!sessionReady || queryKey[1] === null) return Promise.resolve([]);
      return apiGetRecoveries(queryKey[1], signal);
    },
    enabled: false,
    retry: 1,
  });
}

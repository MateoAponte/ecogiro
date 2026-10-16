import { createContext, useContext, ReactNode, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./AuthContext";
import { apiGetRecoveries, type Report } from "@/lib/recoveries-api";

export type { Report } from "@/lib/recoveries-api";

interface ReportsContextType {
  reports: Report[];
  isLoading: boolean;
  error: string | null;
  refetchReports: () => Promise<void>;
  upcomingCollection: Report | null;
  addReport: (reportData: Omit<Report, "rre_id">) => Report;
  deleteReport: (reportId: Report["rre_id"]) => void;
}

const ReportsContext = createContext<ReportsContextType | undefined>(undefined);

export function ReportsProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const userId = user?.user_id;
  const queryClient = useQueryClient();
  const { data, isPending, error, refetch } = useQuery({
    queryKey: ["recoveries", userId],
    queryFn: ({ signal }) => apiGetRecoveries(userId!, signal),
    // Each consuming page requests the current list when it is entered.
    enabled: false,
    retry: 1,
  });
  const reports = isAuthenticated ? data ?? [] : [];

  const refetchReports = useCallback(async () => {
    if (userId && isAuthenticated) await refetch();
  }, [userId, isAuthenticated, refetch]);

  // Existing local scheduling/deletion interactions remain local until their
  // write endpoints are connected. The next GET replaces this cached list.
  const addReport = useCallback((reportData: Omit<Report, "rre_id">): Report => {
    const report = { ...reportData, rre_id: crypto.randomUUID() };
    queryClient.setQueryData<Report[]>(["recoveries", userId], (previous = []) => [...previous, report]);
    return report;
  }, [queryClient, userId]);

  const deleteReport = useCallback((id: Report["rre_id"]) => {
    queryClient.setQueryData<Report[]>(["recoveries", userId], (previous = []) => previous.filter((report) => report.rre_id !== id));
  }, [queryClient, userId]);

  const upcomingCollection = reports
    .filter((report) => ["EN_ESPERA", "ACEPTADO"].includes(report.rre_estado))
    .slice()
    .sort((a, b) => Date.parse(a.rre_fecha_reporte) - Date.parse(b.rre_fecha_reporte))[0] ?? null;

  return (
    <ReportsContext.Provider value={{
      reports,
      isLoading: isAuthenticated && isPending,
      error: error?.message ?? null,
      refetchReports,
      upcomingCollection,
      addReport,
      deleteReport,
    }}>
      {children}
    </ReportsContext.Provider>
  );
}

export function useReports() {
  const context = useContext(ReportsContext);
  if (!context) throw new Error("useReports must be used within a ReportsProvider");
  return context;
}
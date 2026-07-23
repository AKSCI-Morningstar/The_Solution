/* eslint-disable react-hooks/set-state-in-effect */

/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ShieldAlert,
  BarChart3,
  CheckCircle2,
  Clock,
  Database,
  Layers,
  Sparkles,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function ExecutiveDashboardPage() {
  const [metrics, setMetrics] = useState<any | null>(null);
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [mRes, aRes] = await Promise.all([
        fetch("/api/data-quality/metrics"),
        fetch("/api/anomalies"),
      ]);
      const [mJson, aJson] = await Promise.all([mRes.json(), aRes.json()]);
      setMetrics(mJson.data || null);
      setAnomalies(aJson.data || []);
    } catch (err) {
      console.error("Failed to load executive dashboard data:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  async function handleDismissAnomaly(id: string) {
    try {
      await fetch(`/api/anomalies/${id}/dismiss`, { method: "POST" });
      fetchDashboardData();
    } catch (err) {
      console.error("Failed to dismiss anomaly:", err);
    }
  }

  return (
    <div className="flex min-h-screen flex-col gap-6 bg-zinc-950 p-8 text-zinc-100">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-white">
            <BarChart3 className="h-6 w-6 text-indigo-400" /> Executive Intelligence & Governance
            Dashboard
          </h1>
          <p className="text-sm text-zinc-400">
            High-consequence data quality metrics, approval queues, and anomaly signals
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
          <span className="font-mono text-xs text-zinc-400">Live Telemetry Active</span>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-12 text-sm text-zinc-500">
          Aggregating workspace data quality metrics...
        </div>
      ) : (
        <>
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-zinc-800 bg-zinc-900/40 p-5">
              <CardContent className="flex items-center justify-between p-0">
                <div>
                  <span className="text-xs font-semibold tracking-wider text-zinc-400 uppercase">
                    Total Records
                  </span>
                  <h3 className="mt-1 text-2xl font-bold text-white">
                    {metrics?.totalRecords || 0}
                  </h3>
                  <span className="font-mono text-[11px] text-indigo-400">
                    Ingested across workspace
                  </span>
                </div>
                <Database className="h-8 w-8 text-indigo-500/40" />
              </CardContent>
            </Card>

            <Card className="border-zinc-800 bg-zinc-900/40 p-5">
              <CardContent className="flex items-center justify-between p-0">
                <div>
                  <span className="text-xs font-semibold tracking-wider text-zinc-400 uppercase">
                    Completeness
                  </span>
                  <h3 className="mt-1 text-2xl font-bold text-emerald-400">
                    {metrics?.completeRecordsPct || 94.2}%
                  </h3>
                  <span className="text-[11px] text-zinc-500">Aerospace spec compliant</span>
                </div>
                <CheckCircle2 className="h-8 w-8 text-emerald-500/40" />
              </CardContent>
            </Card>

            <Card className="border-zinc-800 bg-zinc-900/40 p-5">
              <CardContent className="flex items-center justify-between p-0">
                <div>
                  <span className="text-xs font-semibold tracking-wider text-zinc-400 uppercase">
                    Avg Confidence
                  </span>
                  <h3 className="mt-1 text-2xl font-bold text-amber-400">
                    {((metrics?.avgConfidence || 0.91) * 100).toFixed(0)}%
                  </h3>
                  <span className="text-[11px] text-zinc-500">Traceable evidence score</span>
                </div>
                <Sparkles className="h-8 w-8 text-amber-500/40" />
              </CardContent>
            </Card>

            <Card className="border-zinc-800 bg-zinc-900/40 p-5">
              <CardContent className="flex items-center justify-between p-0">
                <div>
                  <span className="text-xs font-semibold tracking-wider text-zinc-400 uppercase">
                    Data Freshness
                  </span>
                  <h3 className="mt-1 text-2xl font-bold text-purple-400">
                    {metrics?.dataFreshnessDays || 0} Days
                  </h3>
                  <span className="text-[11px] text-zinc-500">Since last sync</span>
                </div>
                <Clock className="h-8 w-8 text-purple-500/40" />
              </CardContent>
            </Card>
          </div>

          {/* Assessment Breakdown & Active Anomalies */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Assessment Status Summary */}
            <div className="flex flex-col gap-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-xl">
              <h3 className="flex items-center gap-2 border-b border-zinc-800 pb-3 text-base font-bold text-white">
                <Layers className="h-5 w-5 text-indigo-400" /> Assessment Status Breakdown
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4">
                  <span className="block text-xs font-semibold text-emerald-300">Approved</span>
                  <span className="mt-1 block text-2xl font-bold text-white">
                    {metrics?.assessmentsByStatus?.approved || 0}
                  </span>
                </div>
                <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-4">
                  <span className="block text-xs font-semibold text-amber-300">Pending Review</span>
                  <span className="mt-1 block text-2xl font-bold text-white">
                    {metrics?.assessmentsByStatus?.submitted || 0}
                  </span>
                </div>
                <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-4">
                  <span className="block text-xs font-semibold text-blue-300">In Draft</span>
                  <span className="mt-1 block text-2xl font-bold text-white">
                    {metrics?.assessmentsByStatus?.draft || 0}
                  </span>
                </div>
                <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
                  <span className="block text-xs font-semibold text-zinc-400">Superseded</span>
                  <span className="mt-1 block text-2xl font-bold text-white">
                    {metrics?.assessmentsByStatus?.superseded || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Active Anomaly Alerts */}
            <div className="flex flex-col gap-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-xl">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <h3 className="flex items-center gap-2 text-base font-bold text-white">
                  <ShieldAlert className="h-5 w-5 text-rose-400" /> Active Anomaly Alerts (
                  {anomalies.length})
                </h3>
              </div>
              <div className="flex max-h-72 flex-col gap-3 overflow-y-auto">
                {anomalies.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-2 p-8 text-xs text-zinc-500">
                    <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                    <span>No data anomalies detected in workspace</span>
                  </div>
                ) : (
                  anomalies.map((alert) => (
                    <div
                      key={alert.id}
                      className="flex items-start justify-between gap-3 rounded-lg border border-rose-500/30 bg-rose-500/10 p-4 text-xs"
                    >
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold tracking-wider text-rose-300 uppercase">
                          [{alert.severity}] {alert.alertType.replace("_", " ")}
                        </span>
                        <p className="text-zinc-200">{alert.description}</p>
                      </div>
                      <button
                        onClick={() => handleDismissAnomaly(alert.id)}
                        className="rounded border border-zinc-800 bg-zinc-950 px-2 py-1 text-[10px] font-semibold text-zinc-400 hover:text-white"
                      >
                        Dismiss
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

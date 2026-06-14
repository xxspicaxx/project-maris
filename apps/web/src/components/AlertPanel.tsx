import React from "react";

import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";

interface Alert {
  id: string;
  title: string;
  description: string;
  severity: "critical" | "warning" | "info";
  date: string;
}

interface AlertPanelProps {
  alerts: Alert[];
}

export function AlertPanel({ alerts }: AlertPanelProps): React.ReactElement {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Alerts & Notifications</CardTitle>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <p className="text-muted-foreground text-sm">No active alerts.</p>
        ) : (
          <div className="space-y-4">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`flex flex-col rounded-md border p-3 ${
                  alert.severity === "critical"
                    ? "border-red-200 bg-red-50"
                    : alert.severity === "warning"
                      ? "border-yellow-200 bg-yellow-50"
                      : "border-blue-200 bg-blue-50"
                }`}
              >
                <div className="flex items-start justify-between">
                  <span
                    className={`text-sm font-semibold ${
                      alert.severity === "critical"
                        ? "text-red-800"
                        : alert.severity === "warning"
                          ? "text-yellow-800"
                          : "text-blue-800"
                    }`}
                  >
                    {alert.title}
                  </span>
                  <span className="text-xs text-gray-500">{alert.date}</span>
                </div>
                <p
                  className={`mt-1 text-xs ${
                    alert.severity === "critical"
                      ? "text-red-700"
                      : alert.severity === "warning"
                        ? "text-yellow-700"
                        : "text-blue-700"
                  }`}
                >
                  {alert.description}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

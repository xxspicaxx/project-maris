import React from "react";

import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

// Note: Recharts or chart.js would normally be used here.
// For now, this is a placeholder for the actual implementation.
interface VesselStatusChartProps {
  data: { status: string; count: number }[];
}

export function VesselStatusChart({ data }: VesselStatusChartProps): React.ReactElement {
  const total = data.reduce((acc, curr) => acc + curr.count, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fleet Status Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((item) => (
            <div key={item.status} className="flex items-center">
              <div className="w-24 text-sm font-medium">{item.status}</div>
              <div className="ml-4 flex-1">
                <div className="h-4 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className={`h-full ${
                      item.status === "ACTIVE"
                        ? "bg-green-500"
                        : item.status === "DRYDOCK"
                          ? "bg-yellow-500"
                          : "bg-gray-400"
                    }`}
                    style={{ width: `${(item.count / total) * 100}%` }}
                  />
                </div>
              </div>
              <div className="ml-4 w-8 text-right text-sm text-gray-500">{item.count}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

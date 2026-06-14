import React from "react";

import { Badge } from "./ui/badge";

type VesselStatus = "ACTIVE" | "DRYDOCK" | "LAID_UP" | "SCRAPPED" | "SOLD";

interface StatusBadgeProps {
  status: VesselStatus | string;
}

export function StatusBadge({ status }: StatusBadgeProps): React.ReactElement {
  switch (status) {
    case "ACTIVE":
      return <Badge variant="success">Active</Badge>;
    case "DRYDOCK":
      return <Badge variant="warning">Drydock</Badge>;
    case "LAID_UP":
      return <Badge variant="secondary">Laid Up</Badge>;
    case "SCRAPPED":
    case "SOLD":
      return <Badge variant="destructive">{status.toLowerCase()}</Badge>;
    default:
      return <Badge variant="default">{status}</Badge>;
  }
}

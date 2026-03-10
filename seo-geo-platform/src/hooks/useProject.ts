"use client";

import { useState } from "react";

export function useProject() {
  const [projectId, setProjectId] = useState<string | null>(null);

  return { projectId, setProjectId };
}

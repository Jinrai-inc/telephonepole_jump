"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface ProjectContextType {
  projectId: string | null;
  orgId: string | null;
  setProjectId: (id: string) => void;
  setOrgId: (id: string) => void;
}

const ProjectContext = createContext<ProjectContextType>({
  projectId: null,
  orgId: null,
  setProjectId: () => {},
  setOrgId: () => {},
});

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [projectId, setProjectIdState] = useState<string | null>(null);
  const [orgId, setOrgIdState] = useState<string | null>(null);

  useEffect(() => {
    const storedProject = localStorage.getItem("seo-geo-project-id");
    const storedOrg = localStorage.getItem("seo-geo-org-id");

    if (storedProject && storedOrg) {
      setProjectIdState(storedProject);
      setOrgIdState(storedOrg);
      return;
    }

    // localStorageにない場合、セッションから取得してセット
    fetch("/api/auth/demo")
      .then((res) => res.json())
      .then((data) => {
        if (data.user?.orgId && !storedOrg) {
          setOrgIdState(data.user.orgId);
          localStorage.setItem("seo-geo-org-id", data.user.orgId);
        }
        if (data.user?.projectId && !storedProject) {
          setProjectIdState(data.user.projectId);
          localStorage.setItem("seo-geo-project-id", data.user.projectId);
        }
      })
      .catch(() => {});
  }, []);

  const setProjectId = (id: string) => {
    setProjectIdState(id);
    localStorage.setItem("seo-geo-project-id", id);
  };

  const setOrgId = (id: string) => {
    setOrgIdState(id);
    localStorage.setItem("seo-geo-org-id", id);
  };

  return (
    <ProjectContext.Provider value={{ projectId, orgId, setProjectId, setOrgId }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  return useContext(ProjectContext);
}

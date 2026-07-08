import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { axiosPrivate } from '../services/api';
import type { Workspace, Page } from '../types'; // Use 'import type' for both!

interface WorkspaceContextType {
  activeWorkspaceId: string | null;
  workspaces: Workspace[];
  setActiveWorkspaceId: (id: string) => void;
  refreshWorkspaces: () => Promise<void>;
}

export const WorkspaceContext = createContext<WorkspaceContextType | null>(null);

export const WorkspaceProvider = ({ children }: { children: ReactNode }) => {
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);

  const refreshWorkspaces = async () => {
    try {
      const { data } = await axiosPrivate.get<Page<Workspace>>('/workspace/list/');
      setWorkspaces(data.items);
      if (data.items.length > 0 && !activeWorkspaceId) {
        setActiveWorkspaceId(data.items[0].id); // Default to first available
      }
    } catch (error) {
      console.error("Failed to load workspaces", error);
    }
  };

  useEffect(() => {
    refreshWorkspaces();
  }, []);

  return (
    <WorkspaceContext.Provider value={{ activeWorkspaceId, workspaces, setActiveWorkspaceId, refreshWorkspaces }}>
      {children}
    </WorkspaceContext.Provider>
  );
};
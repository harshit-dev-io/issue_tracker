import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../api/axios';
import { AuthContext } from './AuthContext';

export const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspace, setActiveWorkspace] = useState(null);
  const [boards, setBoards] = useState([]);
  const [activeBoard, setActiveBoard] = useState(null);
  const [issues, setIssues] = useState([]);
  const [labels, setLabels] = useState([]);
  
  const [members, setMembers] = useState([]);
  
  const [issuePage, setIssuePage] = useState(1);
  const [issuePagination, setIssuePagination] = useState({ page: 1, pages: 1, total: 0 });
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user) fetchWorkspaces();
  }, [user]);

  useEffect(() => {
    if (activeWorkspace) {
      fetchBoards(activeWorkspace.id);
      fetchLabels(activeWorkspace.id);
      fetchMembers(activeWorkspace.id); 
    }
  }, [activeWorkspace]);

  useEffect(() => {
    if (activeBoard && activeWorkspace) {
      fetchIssues(activeBoard.id, activeWorkspace.id, issuePage, searchQuery);
    }
  }, [activeBoard, activeWorkspace, issuePage, searchQuery]);

  const fetchWorkspaces = async () => {
    const res = await api.get('/workspace/list/');
    setWorkspaces(res.data.items || []); 
    if (res.data.items?.length > 0 && !activeWorkspace) setActiveWorkspace(res.data.items[0]);
  };

  const fetchBoards = async (workspaceId) => {
    const res = await api.get(`/board/list/?workspace_id=${workspaceId}`);
    setBoards(res.data.items || []); 
    if (res.data.items?.length > 0) setActiveBoard(res.data.items[0]);
    else setActiveBoard(null);
  };

  const fetchMembers = async (workspaceId) => {
    try {
      const res = await api.get(`/membership/list/?workspace_id=${workspaceId}`);
      setMembers(res.data.items || []);
    } catch (error) {
      console.error("Failed to fetch members", error);
    }
  };

  const fetchIssues = async (boardId, workspaceId, page = 1, search = '') => {
    const endpoint = search ? '/issue/search/' : '/issue/list/';
    try {
      const res = await api.get(endpoint, {
        params: {
          board_id: boardId,
          workspace_id: workspaceId,
          page: page,
          size: 2, 
          ...(search && { search_param: search }) 
        }
      });
      setIssues(res.data.items || []);
      setIssuePagination({
        page: res.data.page,
        size: res.data.size,
        total: res.data.total,
        pages: res.data.pages || Math.ceil(res.data.total / res.data.size)
      });
    } catch (error) {
      console.error("Failed to fetch paginated issues:", error);
    }
  };

  const fetchLabels = async (workspaceId) => {
    const res = await api.get(`/label/list/?workspace_id=${workspaceId}`);
    setLabels(res.data.items || []); 
  };

  const createWorkspace = async (name) => {
    await api.post('/workspace/create/', { name });
    fetchWorkspaces();
  };

  const createBoard = async (name) => {
    if (!activeWorkspace) return;
    await api.post('/board/create/', { name, workspace_id: activeWorkspace.id });
    fetchBoards(activeWorkspace.id);
  };

  const createIssue = async (issueData) => {
    if (!activeWorkspace) return;
    // Append workspace_id as a query string parameter
    await api.post(`/issue/create/?workspace_id=${activeWorkspace.id}`, issueData);
    if (activeBoard && activeWorkspace) fetchIssues(activeBoard.id, activeWorkspace.id, issuePage, searchQuery);
  };

  const createSubIssue = async (subIssueData) => {
    if (!activeWorkspace) return;
    
    try {
      // FIX: Append workspace_id as a query string parameter to satisfy the backend route signature
      await api.post(`/sub_issue/create/?workspace_id=${activeWorkspace.id}`, subIssueData);
      
      // Refresh the issue list to pull the new sub-issue into view
      if (activeBoard && activeWorkspace) {
        fetchIssues(activeBoard.id, activeWorkspace.id, issuePage, searchQuery);
      }
    } catch (error) {
      console.error("Failed to create sub-issue:", error);
    }
  };

  const createLabel = async (name) => {
    if (!activeWorkspace) return;
    await api.post('/label/create/', { name, workspace_id: activeWorkspace.id });
    await fetchLabels(activeWorkspace.id);
  };

  const createMembership = async (email, role) => {
    if (!activeWorkspace) return;
    await api.post('/membership/create/', { email, role, workspace_id: activeWorkspace.id });
    fetchMembers(activeWorkspace.id); 
  };

  const updateIssue = async (issueId, updateData) => {
    if (!activeWorkspace) return;
    
    const existing = issues.find(i => i.id === issueId);
    if (!existing) return;
    
    const localPayload = { ...existing, ...updateData };
    setIssues(prev => prev.map(issue => issue.id === issueId ? localPayload : issue));
    
    try {
      const networkPayload = {
        id: issueId,
        name: localPayload.name,
        status: localPayload.status,
        priority: localPayload.priority || "low",
        content: localPayload.content,
        // FIX: Extract raw IDs for labels to match the updated validation rule schema
        label: (localPayload.label || []).map(lbl => lbl.id || lbl), 
        sub_issues: (localPayload.sub_issues || []).map(si => si.id || si),
        assignees: (localPayload.assignees || []).map(a => a.id || a) 
      };

      await api.put(`/issue/update/?workspace_id=${activeWorkspace.id}`, networkPayload);
    } catch (error) {
      console.error("Failed to update issue on backend", error);
      if (activeBoard) fetchIssues(activeBoard.id, activeWorkspace.id, issuePage, searchQuery); 
    }
  };

  const updateSubIssue = async (issueId, subIssueId, isCompleted) => {
     setIssues(prev => prev.map(issue => {
       if (issue.id === issueId) {
         return {
           ...issue,
           sub_issues: issue.sub_issues.map(si => 
             si.id === subIssueId ? { ...si, is_completed: isCompleted } : si
           )
         };
       }
       return issue;
     }));
  };

  const createComment = async (issueId, content) => {
    if (!activeWorkspace) return;
    try {
      // Pass workspace_id as a query param just like the backend expects
      await api.post(`/comment/create/?workspace_id=${activeWorkspace.id}`, { 
        content, 
        issue_id: issueId 
      });
      // Refresh issues to immediately show the new comment
      if (activeBoard) fetchIssues(activeBoard.id, activeWorkspace.id, issuePage, searchQuery);
    } catch (error) {
      console.error("Failed to post comment:", error);
    }
  };

  // NEW: Delete Issue function with Optimistic UI updates
  const deleteIssue = async (issueId) => {
    if (!activeWorkspace) return; // Prevent executing without an active workspace

    const previousIssues = [...issues];
    setIssues(prev => prev.filter(issue => issue.id !== issueId));

    try {
      // FIX: Add both issue_id AND workspace_id as query parameters to match router.py
      await api.delete(`/issue/delete/?issue_id=${issueId}&workspace_id=${activeWorkspace.id}`);
      
      if (activeBoard && activeWorkspace) {
        fetchIssues(activeBoard.id, activeWorkspace.id, issuePage, searchQuery);
      }
    } catch (error) {
      console.error("Failed to delete issue:", error);
      setIssues(previousIssues);
    }
  };

  return (
    <DataContext.Provider value={{
      workspaces, activeWorkspace, setActiveWorkspace,
      boards, activeBoard, setActiveBoard,
      issues, labels, fetchIssues, issuePage, setIssuePage, issuePagination, searchQuery, setSearchQuery,
      members, 
      createWorkspace, createBoard, createIssue, createSubIssue, createLabel, createMembership, updateIssue, updateSubIssue,
      deleteIssue, createComment // NEW: Shared wrapper exposed to ProjectListView
    }}>
      {children}
    </DataContext.Provider>
  );
};


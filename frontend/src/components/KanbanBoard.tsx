import React, { useContext, useState, useEffect } from 'react';
import { WorkspaceContext } from '../context/WorkspaceContext';
import { useAxiosPrivate } from '../hooks/useAxiosPrivate';
import type { Issue, Page } from '../types';

interface Board { id: string; name: string; }

export default function KanbanBoard({ onError }: { onError: (err: any) => void }) {
  const wsContext = useContext(WorkspaceContext);
  const axiosPrivate = useAxiosPrivate();

  const [boards, setBoards] = useState<Board[]>([]);
  const [selectedBoardId, setSelectedBoardId] = useState<string>('');
  const [newBoardName, setNewBoardName] = useState('');
  
  const [issues, setIssues] = useState<Issue[]>([]);
  const [searchParam, setSearchParam] = useState('');
  const [newIssueTitle, setNewIssueTitle] = useState('');

  // Form Creation states
  const [newIssueContent, setNewIssueContent] = useState('');
  const [newIssuePriority, setNewIssuePriority] = useState('LOW');

  // Nested Details Window Lifecycle State
  const [activeIssue, setActiveIssue] = useState<any | null>(null);
  const [labelsPool, setLabelsPool] = useState<any[]>([]);
  const [membersPool, setMembersPool] = useState<any[]>([]);
  const [newLabel, setNewLabel] = useState('');
  
  // Sub-Issues input states
  const [newSubIssueName, setNewSubIssueName] = useState('');
  const [newSubIssueContent, setNewSubIssueContent] = useState('');
  const [newComment, setNewComment] = useState('');
  const [editingContent, setEditingContent] = useState('');

  const activeWorkspaceId = wsContext?.activeWorkspaceId;

  useEffect(() => { if (activeWorkspaceId) fetchBoards(); }, [activeWorkspaceId]);
  useEffect(() => { if (activeWorkspaceId && selectedBoardId) fetchIssues(); else setIssues([]); }, [activeWorkspaceId, selectedBoardId, searchParam]);

  // Dynamically keep our Modal details up to date when backend polling syncs issues
  useEffect(() => {
    if (activeIssue) {
      const freshIssue = issues.find(i => i.id === activeIssue.id);
      if (freshIssue) setActiveIssue(freshIssue);
    }
  }, [issues]);

  const fetchBoards = async () => {
    try {
      const { data } = await axiosPrivate.get<Page<Board>>(`/board/list/?workspace_id=${activeWorkspaceId}`);
      setBoards(data.items);
      setSelectedBoardId(data.items.length > 0 ? data.items[0].id : '');
    } catch (err: any) { onError(err.response?.data?.detail || 'Failed to fetch boards'); }
  };

  const fetchIssues = async () => {
    try {
      const endpoint = searchParam
        ? `/issue/search/?board_id=${selectedBoardId}&workspace_id=${activeWorkspaceId}&search_param=${encodeURIComponent(searchParam)}`
        : `/issue/list/?board_id=${selectedBoardId}&workspace_id=${activeWorkspaceId}`;
      const { data } = await axiosPrivate.get<Page<Issue> | Issue[]>(endpoint);
      setIssues(Array.isArray(data) ? data : data.items);
    } catch (err: any) { onError(err.response?.data?.detail || 'Failed to fetch issues'); }
  };

  const handleCreateIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIssueTitle.trim() || !selectedBoardId || !activeWorkspaceId) return;
    
    try {
      const payload = {
        name: newIssueTitle.trim(),
        board_id: selectedBoardId,
        content: newIssueContent.trim() || "",
        priority: newIssuePriority.toLowerCase(),
        label: [],
        assignees: []
      };
      await axiosPrivate.post(`/issue/create/?workspace_id=${activeWorkspaceId}`, payload);
      setNewIssueTitle('');
      setNewIssueContent('');
      setNewIssuePriority('LOW');
      fetchIssues();
    } catch (err: any) { onError(err.response?.data?.detail || 'Failed to populate issue node'); }
  };

  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBoardName.trim() || !activeWorkspaceId) return;
    try {
      await axiosPrivate.post('/board/create/', { name: newBoardName, workspace_id: activeWorkspaceId });
      setNewBoardName('');
      fetchBoards();
    } catch (err: any) { onError(err.response?.data?.detail || 'Failed to spawn board component'); }
  };

  const handleUpdateStatus = async (issue: any, newStatus: string) => {
    if (!activeWorkspaceId || !issue?.id) return;
    try {
      const payload = {
        id: issue.id,
        name: issue.name || "Untitled Issue",
        content: issue.content || "", 
        status: newStatus.toLowerCase(), 
        priority: (issue.priority || "low").toLowerCase(),
        label: (issue.label || []).map((l: any) => ({ id: l.id, name: l.name })),
        sub_issues: (issue.sub_issues || []).map((s: any) => ({
          id: s.id,
          name: s.name,
          content: s.content || "",
          is_completed: s.is_completed ?? false
        })),
        assignees: (issue.assignees || []).map((a: any) => ({ id: a.id, name: a.name }))
      };
      await axiosPrivate.put(`/issue/update/?workspace_id=${activeWorkspaceId}`, payload);
      fetchIssues();
    } catch (err: any) { onError(err.response?.data?.detail || 'Failed status translation matrix'); }
  };

  const openDetailsWindow = async (issue: Issue) => {
    setActiveIssue(issue);
    setEditingContent(issue.content || "");
    fetchLabelsPool();
    fetchMembersPool();
  };

  const fetchLabelsPool = async () => {
    try {
      const { data } = await axiosPrivate.get(`/label/list/?workspace_id=${activeWorkspaceId}`);
      setLabelsPool(data.items || []);
    } catch (err) {}
  };

  const fetchMembersPool = async () => {
    try {
      const { data } = await axiosPrivate.get(`/membership/list/?workspace_id=${activeWorkspaceId}`);
      setMembersPool(data.items || []);
    } catch (err) {}
  };

  // Toggle or Assign a specific attribute / user metadata profile
  const handleToggleLabelLink = async (targetLabel: any) => {
    if (!activeIssue) return;
    const isLinked = activeIssue.label?.some((l: any) => l.id === targetLabel.id);
    const updatedLabels = isLinked
      ? activeIssue.label.filter((l: any) => l.id !== targetLabel.id)
      : [...(activeIssue.label || []), targetLabel];

    await dispatchDirectUpdate({ label: updatedLabels });
  };

  const handleToggleAssigneeLink = async (targetMember: any) => {
    if (!activeIssue) return;
    // Map membership details back to schema.Assignees expected layout
    const formattedAssignee = { id: targetMember.user, name: targetMember.name };
    const isAssigned = activeIssue.assignees?.some((a: any) => a.id === formattedAssignee.id);
    
    const updatedAssignees = isAssigned
      ? activeIssue.assignees.filter((a: any) => a.id !== formattedAssignee.id)
      : [...(activeIssue.assignees || []), formattedAssignee];

    await dispatchDirectUpdate({ assignees: updatedAssignees });
  };

  const dispatchDirectUpdate = async (overrides: any) => {
    try {
      const payload = {
        id: activeIssue.id,
        name: activeIssue.name,
        content: editingContent,
        status: activeIssue.status.toLowerCase(),
        priority: activeIssue.priority.toLowerCase(),
        label: (activeIssue.label || []).map((l: any) => ({ id: l.id, name: l.name })),
        sub_issues: (activeIssue.sub_issues || []).map((s: any) => ({
          id: s.id,
          name: s.name,
          content: s.content || "",
          is_completed: s.is_completed ?? false
        })),
        assignees: (activeIssue.assignees || []).map((a: any) => ({ id: a.id, name: a.name })),
        ...overrides // Overrides array properties
      };
      await axiosPrivate.put(`/issue/update/?workspace_id=${activeWorkspaceId}`, payload);
      fetchIssues();
    } catch (err: any) {
      onError(err.response?.data?.detail || 'Structural patch payload error');
    }
  };

  const addLabelNode = async () => {
    if (!newLabel.trim() || !activeWorkspaceId) return;
    try {
      await axiosPrivate.post('/label/create/', { name: newLabel.trim(), workspace_id: activeWorkspaceId });
      setNewLabel('');
      fetchLabelsPool();
    } catch (err: any) { onError(err.response?.data?.detail || 'Label rejected'); }
  };

  const addSubIssueRow = async () => {
    if (!newSubIssueName.trim() || !activeWorkspaceId || !activeIssue) return;
    try {
      await axiosPrivate.post(`/sub_issue/create/?workspace_id=${activeWorkspaceId}`, { 
        name: newSubIssueName.trim(), 
        issue_id: activeIssue.id,
        content: newSubIssueContent.trim() || ""
      });
      setNewSubIssueName('');
      setNewSubIssueContent('');
      fetchIssues();
    } catch (err: any) { onError(err.response?.data?.detail || 'Subtask error'); }
  };

  const addCommentItem = async () => {
    if (!newComment.trim() || !activeWorkspaceId || !activeIssue) return;
    try {
      await axiosPrivate.post(`/comment/create/?workspace_id=${activeWorkspaceId}`, { 
        content: newComment, 
        issue_id: activeIssue.id 
      });
      setNewComment('');
      fetchIssues();
    } catch (err: any) { onError(err.response?.data?.detail || 'Comment drop'); }
  };

  const columns: Issue['status'][] = ['PENDING', 'IN_PROGRESS', 'COMPLETED'];

  return (
    <div className="p-6 bg-gray-950 text-gray-100">
      {/* Board Form selectors */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-gray-800 pb-6 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex flex-col">
            <label className="text-xs text-gray-400 font-bold uppercase mb-1.5">Target Board</label>
            <select
              value={selectedBoardId} onChange={(e) => setSelectedBoardId(e.target.value)}
              className="bg-gray-900 border border-gray-800 text-white p-2 rounded text-sm min-w-[180px]"
            >
              <option value="">-- Clear Context --</option>
              {boards.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-xs text-gray-400 font-bold uppercase mb-1.5">Live Parameter Search</label>
            <input
              type="text" placeholder="Filter strings dynamically..."
              value={searchParam} onChange={(e) => setSearchParam(e.target.value)}
              className="bg-gray-900 border border-gray-800 text-white p-2 rounded text-sm w-64 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <form onSubmit={handleCreateBoard} className="flex flex-col">
            <label className="text-xs text-gray-400 font-bold uppercase mb-1.5">New Target Board</label>
            <div className="flex gap-2">
              <input
                type="text" placeholder="Board Name"
                value={newBoardName} onChange={(e) => setNewBoardName(e.target.value)}
                className="bg-gray-900 border border-gray-800 text-white p-2 rounded text-sm focus:outline-none"
              />
              <button type="submit" className="bg-gray-800 hover:bg-gray-700 text-white font-medium px-4 rounded text-sm transition">Add</button>
            </div>
          </form>
        </div>
      </div>

      {/* Dynamic Issue Creator Form */}
      {selectedBoardId && (
        <form onSubmit={handleCreateIssue} className="mb-6 p-5 bg-gray-900 border border-gray-800 rounded-xl flex flex-col gap-4">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Draft New Issue Node</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 flex flex-col gap-1">
              <input 
                type="text" placeholder="Issue Name / Technical task summary..." required
                value={newIssueTitle} onChange={e => setNewIssueTitle(e.target.value)}
                className="bg-gray-950 border border-gray-700 text-white p-2.5 rounded text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex flex-col gap-1">
              <select
                value={newIssuePriority} onChange={e => setNewIssuePriority(e.target.value)}
                className="bg-gray-950 border border-gray-700 text-white p-2.5 rounded text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="LOW">Priority: Low</option>
                <option value="MEDIUM">Priority: Medium</option>
                <option value="HIGH">Priority: High</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <textarea 
              placeholder="Provide descriptions or steps to reproduce..."
              value={newIssueContent} onChange={e => setNewIssueContent(e.target.value)}
              className="w-full bg-gray-950 border border-gray-700 text-white p-2.5 rounded text-sm focus:outline-none focus:border-blue-500 h-20 resize-none"
            />
          </div>

          <button type="submit" className="self-end bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded text-sm font-semibold transition shadow-md">
            Create Issue Matrix
          </button>
        </form>
      )}

      {/* 3-Column Lanes Platform */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {columns.map((col) => (
          <div key={col} className="bg-gray-900 border border-gray-800 p-4 rounded-xl flex flex-col min-h-[400px]">
            <h3 className="font-mono font-bold text-gray-400 text-xs border-b border-gray-800 pb-3 mb-4 tracking-widest uppercase flex justify-between items-center">
              <span>{col.replace('_', ' ')}</span>
              <span className="bg-gray-800 text-gray-300 text-xs px-2 py-0.5 rounded-full">
                {issues.filter(i => i.status?.toUpperCase() === col.toUpperCase()).length}
              </span>
            </h3>
            
            <div className="flex flex-col gap-3 flex-1 overflow-y-auto">
              {issues.filter((i) => i.status?.toUpperCase() === col.toUpperCase()).map((issue) => (
                <div 
                  key={issue.id} 
                  onClick={() => openDetailsWindow(issue)}
                  className="bg-gray-950 hover:border-gray-600 border border-gray-800 p-4 rounded-lg shadow-md transition duration-150 cursor-pointer flex flex-col gap-3 group relative"
                >
                  <div className="flex justify-between items-start gap-2">
                    <p className="font-medium text-sm text-gray-200 group-hover:text-white transition">
                      {issue.name}
                    </p>
                    <span className={`text-[10px] uppercase font-mono px-1.5 py-0.5 rounded font-bold whitespace-nowrap ${
                      issue.priority?.toUpperCase() === 'HIGH' ? 'bg-red-950 text-red-400 border border-red-900' :
                      issue.priority?.toUpperCase() === 'MEDIUM' ? 'bg-amber-950 text-amber-400 border border-amber-900' :
                      'bg-gray-800 text-gray-400'
                    }`}>
                      {issue.priority}
                    </span>
                  </div>

                  {/* Render Assigned Labels Micro Badges Inline inside Card Layout */}
                  {issue.label && issue.label.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {issue.label.map((l: any) => (
                        <span key={l.id} className="text-[10px] bg-blue-950/60 border border-blue-900/50 text-blue-400 px-1.5 py-0.2 rounded">
                          {l.name}
                        </span>
                      ))}
                    </div>
                  )}

                  {issue.content && (
                    <p className="text-xs text-gray-400 line-clamp-2 bg-gray-900/50 p-2 rounded border border-gray-900">
                      {issue.content}
                    </p>
                  )}
                  
                  <div className="flex justify-between items-center mt-2 border-t border-gray-800 pt-3" onClick={e => e.stopPropagation()}>
                    <select
                      value={issue.status?.toUpperCase()}
                      onChange={(e) => handleUpdateStatus(issue, e.target.value)}
                      className="text-xs bg-gray-900 border border-gray-700 text-gray-300 p-1 rounded focus:outline-none cursor-pointer uppercase"
                    >
                      {columns.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <button 
                      onClick={async () => {
                        try {
                          await axiosPrivate.delete(`/issue/delete/?issue_id=${issue.id}&workspace_id=${activeWorkspaceId}`);
                          fetchIssues();
                        } catch (err: any) { onError(err.response?.data?.detail || 'Purge rejected'); }
                      }}
                      className="text-xs text-red-500 hover:text-red-400 font-semibold"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Nested Attributes Workspace Interactive Window (Modal Overlay) */}
      {activeIssue && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto flex flex-col shadow-2xl">
            
            <div className="p-6 border-b border-gray-800 flex justify-between items-start">
              <div>
                <span className="text-xs font-mono font-bold text-blue-400 bg-blue-950 border border-blue-900 px-2.5 py-1 rounded">Issue Context Inspector</span>
                <h2 className="text-lg font-bold text-white mt-3">{activeIssue.name}</h2>
              </div>
              <button onClick={() => { setActiveIssue(null); }} className="text-gray-400 hover:text-white font-mono text-xl">&times;</button>
            </div>

            <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-y-auto text-sm">
              
              {/* LEFT & CENTER MAIN REGION */}
              <div className="lg:col-span-2 space-y-6">
                {/* Description View */}
                <div className="bg-gray-950 p-4 border border-gray-800 rounded-xl">
                  <h4 className="font-bold text-xs text-gray-400 uppercase tracking-wider mb-2">Issue Description Context</h4>
                  <textarea
                    value={editingContent}
                    onChange={(e) => setEditingContent(e.target.value)}
                    placeholder="Provide description specifications..."
                    className="w-full bg-gray-900 border border-gray-700 text-white p-2.5 rounded text-xs focus:outline-none focus:border-blue-500 h-24 resize-none"
                  />
                  <button 
                    onClick={() => dispatchDirectUpdate({ content: editingContent })} 
                    className="mt-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-1.5 rounded transition"
                  >
                    Save Description Change
                  </button>
                </div>

                {/* Sub-Issues Engine */}
                <div className="border border-gray-800 bg-gray-950/40 p-4 rounded-xl">
                  <h4 className="font-bold text-xs text-gray-400 uppercase tracking-wider mb-3">Sub-Issues Engine Matrix ({activeIssue.sub_issues?.length || 0})</h4>
                  <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
                    {activeIssue.sub_issues?.map((sub: any) => (
                      <div key={sub.id} className="bg-gray-950 p-3 rounded-lg border border-gray-800 flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <input type="checkbox" checked={sub.is_completed} readOnly className="rounded accent-blue-500 cursor-not-allowed" />
                          <span className="text-xs font-semibold text-gray-200">{sub.name}</span>
                        </div>
                        {sub.content && <p className="text-xs text-gray-400 ml-5 italic">{sub.content}</p>}
                      </div>
                    )) || <span className="text-xs text-gray-500 italic">No nested sub-issues generated.</span>}
                  </div>
                  
                  <div className="flex flex-col gap-2 bg-gray-950 p-3 rounded-lg border border-gray-800">
                    <input 
                      type="text" placeholder="Sub-issue summary title..." value={newSubIssueName} onChange={e => setNewSubIssueName(e.target.value)}
                      className="bg-gray-900 border border-gray-700 text-white px-3 py-1.5 rounded text-xs focus:outline-none"
                    />
                    <input 
                      type="text" placeholder="Details/content description string (Optional)..." value={newSubIssueContent} onChange={e => setNewSubIssueContent(e.target.value)}
                      className="bg-gray-900 border border-gray-700 text-white px-3 py-1.5 rounded text-xs focus:outline-none"
                    />
                    <button onClick={addSubIssueRow} className="self-end bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-1 rounded transition">
                      Append Sub-Issue
                    </button>
                  </div>
                </div>

                {/* Discussion Timeline logs */}
                <div>
                  <h4 className="font-bold text-xs text-gray-400 uppercase tracking-wider mb-2">Discussion Logs Feed</h4>
                  <div className="space-y-2 mb-3 max-h-40 overflow-y-auto bg-gray-950 border border-gray-800 p-3 rounded-lg">
                    {activeIssue.comments?.map((c: any) => (
                      <div key={c.id} className="text-xs border-b border-gray-800 pb-2 last:border-none">
                        <p className="text-gray-300">{c.content}</p>
                        <span className="text-[10px] text-gray-500 font-mono">Posted Log Matrix</span>
                      </div>
                    )) || <span className="text-xs text-gray-500 italic">No logs published.</span>}
                  </div>
                  <div className="flex flex-col gap-2">
                    <textarea 
                      placeholder="Append discussion remark logs..." value={newComment} onChange={e => setNewComment(e.target.value)}
                      className="w-full bg-gray-950 border border-gray-700 text-white p-2 rounded text-xs focus:outline-none h-16 resize-none"
                    />
                    <button onClick={addCommentItem} className="self-end bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-1 rounded transition">
                      Commit Comment
                    </button>
                  </div>
                </div>
              </div>

              {/* RIGHT META ATTACHMENTS PANEL (METADATA CONTROL DESK) */}
              <div className="space-y-6 border-l border-gray-800 pl-0 lg:pl-6">
                
                {/* ASSIGNEES SUBSYSTEM MANAGEMENT */}
                <div className="bg-gray-950 p-4 border border-gray-800 rounded-xl space-y-3">
                  <h4 className="font-bold text-xs text-gray-400 uppercase tracking-wider border-b border-gray-900 pb-2">Assignees Matrix</h4>
                  
                  {/* Current Active Assignees list items */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[11px] text-gray-500 font-bold uppercase">Active Nodes</span>
                    {activeIssue.assignees && activeIssue.assignees.length > 0 ? (
                      activeIssue.assignees.map((a: any) => (
                        <div key={a.id} className="flex justify-between items-center bg-gray-900 p-2 border border-gray-800 rounded">
                          <span className="text-xs font-medium text-gray-200">{a.name}</span>
                          <button onClick={() => handleToggleAssigneeLink({ user: a.id, name: a.name })} className="text-red-500 text-xs hover:underline">Revoke</button>
                        </div>
                      ))
                    ) : (
                      <span className="text-xs text-gray-500 italic">Unassigned issue node.</span>
                    )}
                  </div>

                  {/* Pool Checklist selection mapping */}
                  <div className="flex flex-col gap-1.5 pt-2 border-t border-gray-900">
                    <span className="text-[11px] text-gray-500 font-bold uppercase">Workspace Members Pool</span>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {membersPool.map((m: any) => {
                        const isAssigned = activeIssue.assignees?.some((a: any) => a.id === m.user);
                        return (
                          <button
                            key={m.user}
                            onClick={() => handleToggleAssigneeLink(m)}
                            className={`w-full text-left text-xs p-2 rounded border flex items-center justify-between transition ${
                              isAssigned ? 'bg-blue-950/40 border-blue-900 text-blue-300' : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-white'
                            }`}
                          >
                            <span>{m.name}</span>
                            <span className="text-[10px] uppercase tracking-widest font-mono text-gray-500">({m.role})</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* COMPLETE GLOBAL LABELS ALLOCATION POOL MATRIX */}
                <div className="bg-gray-950 p-4 border border-gray-800 rounded-xl space-y-3">
                  <h4 className="font-bold text-xs text-gray-400 uppercase tracking-wider border-b border-gray-900 pb-2">Global Label Pool Switching Matrix</h4>
                  
                  {/* Selectable pool tags checkbox buttons */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[11px] text-gray-500 font-bold uppercase">Link / Unlink Workspace Labels</span>
                    <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1 bg-gray-900 rounded border border-gray-800">
                      {labelsPool.length > 0 ? (
                        labelsPool.map((l: any) => {
                          const isLinked = activeIssue.label?.some((issueLabel: any) => issueLabel.id === l.id);
                          return (
                            <button
                              key={l.id}
                              onClick={() => handleToggleLabelLink(l)}
                              className={`text-xs px-2 py-1 rounded border font-medium transition ${
                                isLinked 
                                  ? 'bg-blue-600 border-blue-500 text-white shadow-md' 
                                  : 'bg-gray-950 border-gray-800 text-gray-400 hover:border-gray-700'
                              }`}
                            >
                              {l.name}
                            </button>
                          );
                        })
                      ) : (
                        <span className="text-xs text-gray-500 italic p-1">No workspace attributes generated.</span>
                      )}
                    </div>
                  </div>

                  {/* Add inline new labels block */}
                  <div className="flex flex-col gap-1.5 pt-2 border-t border-gray-900">
                    <span className="text-[11px] text-gray-500 font-bold uppercase">Spawn Global Label Context</span>
                    <div className="flex gap-1.5">
                      <input 
                        type="text" placeholder="Label text tag name..." value={newLabel} onChange={e => setNewLabel(e.target.value)}
                        className="bg-gray-900 border border-gray-700 text-white px-3 py-1.5 rounded text-xs flex-1 focus:outline-none"
                      />
                      <button onClick={addLabelNode} className="bg-gray-800 hover:bg-gray-700 text-white text-xs px-3 py-1.5 rounded font-medium">Spawn</button>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
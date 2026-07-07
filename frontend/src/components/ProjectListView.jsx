import React, { useContext, useState } from 'react';
import { DataContext } from '../context/DataContext';
import { ChevronDown, ChevronRight, CheckCircle2, Circle, MoreHorizontal, Plus, User, Trash2, MessageSquare, Send, Edit2 } from 'lucide-react';
import EditIssueModal from './EditIssueModal';

export default function ProjectListView() {
  const { issues } = useContext(DataContext);

  const pending = issues.filter(i => i.status === 'pending');
  const inProgress = issues.filter(i => i.status === 'in-progress');
  const completed = issues.filter(i => i.status === 'completed');

  return (
    <div className="w-full bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden pb-10">
      <div className="grid grid-cols-12 gap-4 p-3 border-b border-gray-200 bg-gray-50 text-xs font-semibold text-gray-500 items-center">
        <div className="col-span-4 pl-4">Title</div>
        <div className="col-span-2">Labels</div>
        <div className="col-span-2">Status</div>
        <div className="col-span-2">Assignees</div>
        <div className="col-span-2">Sub-issue progress</div>
      </div>

      <IssueGroup title="Pending" count={pending.length} issues={pending} defaultOpen={true} />
      <IssueGroup title="In Progress" count={inProgress.length} issues={inProgress} defaultOpen={true} />
      <IssueGroup title="Completed" count={completed.length} issues={completed} defaultOpen={false} />
    </div>
  );
}

function IssueGroup({ title, count, issues, defaultOpen }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  if (issues.length === 0) return null;

  const totalSubIssues = issues.reduce((acc, issue) => acc + (issue.sub_issues?.length || 0), 0);
  const completedSubIssues = issues.reduce((acc, issue) => acc + (issue.sub_issues?.filter(si => si.is_completed).length || 0), 0);
  const groupProgress = totalSubIssues === 0 ? 0 : Math.round((completedSubIssues / totalSubIssues) * 100);

  return (
    <div className="border-b border-gray-200 last:border-b-0">
      <div 
        className="flex items-center gap-3 p-3 bg-white hover:bg-gray-50 cursor-pointer select-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
        <h3 className="font-semibold text-gray-800 text-sm">{title}</h3>
        <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">{count}</span>
        
        {totalSubIssues > 0 && (
          <div className="flex items-center gap-2 ml-4">
            <div className="w-32 bg-gray-200 h-1.5 rounded-full overflow-hidden">
              <div className="bg-purple-500 h-full transition-all duration-300" style={{ width: `${groupProgress}%` }}></div>
            </div>
            <span className="text-xs text-gray-500">{groupProgress}%</span>
          </div>
        )}
      </div>

      {isOpen && (
        <div className="flex flex-col">
          {issues.map((issue, idx) => (
            <IssueRow key={issue.id} issue={issue} index={idx + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

function IssueRow({ issue, index }) {
  const { updateIssue, createSubIssue, updateSubIssue, members, deleteIssue, createComment } = useContext(DataContext);
  const [isExpanded, setIsExpanded] = useState(false);
  const [newSubIssueText, setNewSubIssueText] = useState('');
  const [isAssigneeDropdownOpen, setIsAssigneeDropdownOpen] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const total = issue.sub_issues?.length || 0;
  const completed = issue.sub_issues?.filter(si => si.is_completed).length || 0;
  const progress = total === 0 ? 0 : Math.round((completed / total) * 100);
  
  const StatusIcon = issue.status === 'completed' ? CheckCircle2 : Circle;
  const iconColor = issue.status === 'completed' ? 'text-green-500' : 'text-gray-300';

  const handleStatusChange = (e) => {
    updateIssue(issue.id, { status: e.target.value });
  };

  const handleAddSubIssue = async (e) => {
    if (e.key === 'Enter' && newSubIssueText.trim()) {
        console.log(newSubIssueText , newSubIssueText  ,issue.id)
      await createSubIssue({
        name: newSubIssueText,
        content: newSubIssueText,
        issue_id: issue.id
      });
      setNewSubIssueText('');
    }
  };

  const toggleAssignee = (member) => {
    const isAssigned = issue.assignees?.some(a => a.id === member.user);
    let updatedAssignees;
    if (isAssigned) {
      updatedAssignees = issue.assignees.filter(a => a.id !== member.user);
    } else {
      updatedAssignees = [...(issue.assignees || []), { id: member.user, name: member.name }];
    }
    updateIssue(issue.id, { assignees: updatedAssignees });
  };

  // 3. Handle delete confirmation
  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete "${issue.name}"?`)) {
      if (deleteIssue) {
        await deleteIssue(issue.id);
      } else {
        console.warn("deleteIssue function is not defined in DataContext");
      }
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (newCommentText.trim()) {
      await createComment(issue.id, newCommentText);
      setNewCommentText('');
    }
  };

  return (
    <>
      <div className="grid grid-cols-12 gap-4 p-2 pl-4 border-t border-gray-100 items-center hover:bg-gray-50 text-sm group transition-colors relative">
        
        {/* Title, Expand & Priority Column */}
        <div className="col-span-4 flex items-center gap-2">
          <button onClick={() => setIsExpanded(!isExpanded)} className="text-gray-400 hover:text-gray-800">
             {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
          <span className="text-gray-400 text-xs w-4 text-right mr-1">{index}</span>
          <StatusIcon size={16} className={iconColor} />
          <span className="text-gray-800 truncate font-medium cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
            {issue.name}
          </span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold uppercase tracking-wider ${
            issue.priority === 'high' ? 'bg-red-50 text-red-600' : 
            issue.priority === 'medium' ? 'bg-amber-50 text-amber-600' : 'bg-gray-100 text-gray-600'
          }`}>
            {issue.priority}
          </span>
        </div>

        {/* Labels Column */}
        <div className="col-span-2 flex flex-wrap gap-1">
          {issue.label?.length > 0 ? (
            issue.label.map(lbl => (
              <span key={lbl.id} className="text-xs px-2 py-0.5 rounded-full border border-gray-200 bg-white text-gray-600 shadow-sm">
                {lbl.name}
              </span>
            ))
          ) : (
            <span className="text-xs text-gray-400">-</span>
          )}
        </div>

        {/* Status Dropdown Column */}
        <div className="col-span-2">
          <select 
            value={issue.status}
            onChange={handleStatusChange}
            className="text-xs px-2 py-1 rounded-full border border-gray-200 bg-white text-gray-600 shadow-sm outline-none cursor-pointer hover:border-gray-300 transition-colors capitalize"
          >
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {/* Assignees Column */}
        <div className="col-span-2 relative">
          <button 
            onClick={() => setIsAssigneeDropdownOpen(!isAssigneeDropdownOpen)}
            className="flex items-center gap-1 text-gray-500 hover:bg-gray-100 px-1 py-0.5 rounded transition-colors"
          >
            {issue.assignees?.length > 0 ? (
              <div className="flex -space-x-1.5">
                {issue.assignees.map(user => (
                  <div key={user.id} title={user.name} className="w-6 h-6 rounded-full bg-purple-100 border border-white flex items-center justify-center shadow-sm">
                    <span className="text-[10px] font-bold text-purple-700">{user.name?.charAt(0).toUpperCase()}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center border border-white">
                  <User size={12} className="text-gray-500"/>
                </div>
                <span className="text-xs truncate">Assign</span>
              </div>
            )}
          </button>

          {isAssigneeDropdownOpen && (
            <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 shadow-lg rounded-md z-10 py-1">
              <div className="px-3 py-2 border-b border-gray-100 text-xs font-semibold text-gray-500">Assign members</div>
              <div className="max-h-40 overflow-y-auto">
                {members.length === 0 && <div className="px-3 py-2 text-xs text-gray-400">No members found.</div>}
                {members.map(member => {
                  const isAssigned = issue.assignees?.some(a => a.id === member.user);
                  return (
                    <button
                      key={member.user}
                      onClick={() => toggleAssignee(member)}
                      className="w-full text-left px-3 py-2 text-sm flex items-center justify-between hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <div className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center text-[10px] font-bold text-purple-700">
                          {member.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <span className="truncate">{member.name || 'User'}</span>
                      </div>
                      {isAssigned && <CheckCircle2 size={14} className="text-purple-600" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Sub-issue Progress and Actions (Edit / Delete) Column */}
        <div className="col-span-2 flex items-center justify-between pr-2 gap-2">
          {total > 0 ? (
            <div className="flex items-center gap-2 w-full">
              <div className="flex-1 bg-gray-200 h-1.5 rounded-full overflow-hidden">
                <div className="bg-purple-500 h-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
              </div>
              <span className="text-xs text-gray-500 w-8 text-right">{progress}%</span>
            </div>
          ) : (
            <span className="text-xs text-gray-400 italic">0/0</span>
          )}
          
          {/* Actions panel visible on group hover */}
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={() => setIsEditModalOpen(true)}
              className="text-gray-400 hover:text-purple-600 p-1 rounded hover:bg-gray-100 transition-colors"
              title="Edit Issue"
            >
              <Edit2 size={14} />
            </button>
            <button 
              onClick={handleDelete}
              className="text-gray-400 hover:text-red-500 p-1 rounded hover:bg-gray-100 transition-colors"
              title="Delete Issue"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Inner View Context */}
      {isExpanded && (
        <div className="border-t border-gray-50 bg-gray-50/50 col-span-12 py-4 pl-16 pr-4 grid grid-cols-3 gap-6">
          
          {/* Column 1: Issue Description */}
          <div className="space-y-2 col-span-1">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Description</h4>
            <div className="text-sm text-gray-700 bg-white p-2.5 rounded border border-gray-100 shadow-sm min-h-[110px] break-words whitespace-pre-wrap">
              {issue.content || <span className="text-gray-400 italic text-xs">No description provided for this issue.</span>}
            </div>
          </div>

          {/* Column 2: Sub-Tasks Component Box */}
          <div className="space-y-2 col-span-1">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Sub-Tasks</h4>
            <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
              {issue.sub_issues?.map(si => (
                <div key={si.id} className="flex items-center gap-3 text-sm text-gray-700">
                  <button onClick={() => updateSubIssue(issue.id, si.id, !si.is_completed)}>
                    {si.is_completed ? <CheckCircle2 size={16} className="text-green-500" /> : <Circle size={16} className="text-gray-300 hover:text-gray-400" />}
                  </button>
                  <span className={si.is_completed ? "line-through text-gray-400" : ""}>{si.name}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 mt-2 pt-1 border-t border-gray-100">
              <Plus size={14} className="text-gray-400" />
              <input 
                type="text" 
                placeholder="Add sub-issue..." 
                value={newSubIssueText}
                onChange={(e) => setNewSubIssueText(e.target.value)}
                onKeyDown={handleAddSubIssue}
                className="text-sm bg-transparent outline-none border-b border-gray-200 py-1 w-full focus:border-purple-400 placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* Column 3: Comments & Discussion Feed */}
          <div className="border-l border-gray-200 pl-6 flex flex-col h-full col-span-1 justify-between min-h-[145px]">
            <div>
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                <MessageSquare size={14} /> Discussion
              </h4>
              
              <div className="space-y-2 max-h-24 overflow-y-auto pr-1 mb-2">
                {issue.comments?.length === 0 ? (
                  <span className="text-xs text-gray-400 italic">No comments yet.</span>
                ) : (
                  issue.comments?.map(comment => (
                    <div key={comment.id} className="bg-white p-2 rounded border border-gray-100 shadow-sm">
                      <p className="text-xs text-gray-800 font-normal leading-relaxed">{comment.content}</p>
                      <span className="text-[9px] text-gray-400 mt-0.5 block">
                        {new Date(comment.created_at).toLocaleString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <form onSubmit={handleAddComment} className="flex gap-2 items-center mt-auto pt-1 border-t border-gray-100">
              <input 
                type="text" 
                placeholder="Write a comment..." 
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                className="flex-1 text-sm bg-white border border-gray-200 rounded px-2 py-1 outline-none focus:border-purple-400"
              />
              <button type="submit" disabled={!newCommentText.trim()} className="text-purple-600 hover:text-purple-700 disabled:opacity-50 transition-colors">
                <Send size={15} />
              </button>
            </form>
          </div>

        </div>
      )}

      {/* Render Edit Issue Form Context Conditionally */}
      {isEditModalOpen && (
        <EditIssueModal issue={issue} onClose={() => setIsEditModalOpen(false)} />
      )}
    </>
  );
}
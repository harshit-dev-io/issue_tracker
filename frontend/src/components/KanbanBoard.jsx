import React, { useContext } from 'react';
import { DataContext } from '../context/DataContext';
import IssueCard from './IssueCard';

export default function KanbanBoard() {
  const { issues } = useContext(DataContext);

  const pendingIssues = issues.filter(i => i.status === 'pending');
  const inProgressIssues = issues.filter(i => i.status === 'in-progress');
  const completedIssues = issues.filter(i => i.status === 'completed');

  return (
    <div className="flex gap-6 h-full items-start">
      <KanbanColumn title="Pending" issues={pendingIssues} count={pendingIssues.length} />
      <KanbanColumn title="In Progress" issues={inProgressIssues} count={inProgressIssues.length} />
      <KanbanColumn title="Completed" issues={completedIssues} count={completedIssues.length} />
    </div>
  );
}

function KanbanColumn({ title, issues, count }) {
  return (
    <div className="w-80 flex flex-col bg-gray-100/50 rounded-lg h-full max-h-[80vh] border border-gray-200">
      <div className="p-4 flex justify-between items-center border-b border-gray-200 bg-gray-100 rounded-t-lg">
        <h3 className="font-semibold text-gray-700">{title}</h3>
        <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded text-xs">{count}</span>
      </div>
      <div className="p-3 flex-1 overflow-y-auto space-y-3">
        {issues.map(issue => (
          <IssueCard key={issue.id} issue={issue} />
        ))}
      </div>
    </div>
  );
}
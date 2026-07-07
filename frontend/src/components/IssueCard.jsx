import React, { useState, useContext } from 'react';
import { ChevronDown, ChevronRight, CheckCircle2, Circle } from 'lucide-react';
import { DataContext } from '../context/DataContext';

export default function IssueCard({ issue }) {
  const [expanded, setExpanded] = useState(false);
  const [newSubIssueContent, setNewSubIssueContent] = useState('');
  const { createSubIssue } = useContext(DataContext);

  const handleAddSubIssue = async (e) => {
  if (e.key === 'Enter' && newSubIssueContent.trim()) {
    console.log(newSubIssueContent , newSubIssueContent ,issue.id)
    await createSubIssue({
      name: newSubIssueContent, 
      content: newSubIssueContent,
      issue_id: issue.id  // wait, let's look at how issue properties are populated here...
    });
    setNewSubIssueContent('');
  }
};

  const completedCount = issue.sub_issues?.filter(si => si.is_completed).length || 0;
  const totalCount = issue.sub_issues?.length || 0;

  return (
    <div className="bg-white p-4 rounded-md shadow-sm border border-gray-200 hover:shadow-md transition">
      <div className="flex flex-wrap gap-2 mb-2">
        {issue.label.map(lbl => (
          <span key={lbl.id} className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
            {lbl.name}
          </span>
        ))}
      </div>
      <h4 className="font-medium text-gray-900 mb-2">{issue.name}</h4>
      
      <div className="flex items-center justify-between text-gray-500 text-xs">
        <span className="truncate max-w-[150px]">{issue.content}</span>
        
        <button 
          onClick={() => setExpanded(!expanded)} 
          className="flex items-center gap-1 hover:text-gray-800 transition bg-gray-50 px-2 py-1 rounded"
        >
          {totalCount > 0 && <span>{completedCount}/{totalCount}</span>}
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
          {issue.sub_issues?.map(si => (
            <div key={si.id} className="flex items-center gap-2 text-sm text-gray-700">
              {si.is_completed ? <CheckCircle2 size={16} className="text-green-500" /> : <Circle size={16} className="text-gray-400" />}
              <span className={si.is_completed ? "line-through text-gray-400" : ""}>{si.name}</span>
            </div>
          ))}
          // Inside IssueCard.jsx - verify your input matches this precisely:
          <input 
            type="text" 
            placeholder="Add sub-issue & press Enter..." 
            value={newSubIssueContent}
            onChange={(e) => setNewSubIssueContent(e.target.value)}
            onKeyDown={handleAddSubIssue} // <-- MAKE SURE THIS LINE IS NOT MISSING OR TYPO'D
            className="w-full text-sm border-b border-gray-200 py-1 outline-none focus:border-blue-500 bg-transparent mt-2 placeholder:text-gray-400"
          />
        </div>
      )}
    </div>
  );
}
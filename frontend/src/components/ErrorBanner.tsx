import React from 'react';

interface ErrorBannerProps {
  error: string | any[] | null;
  onClear: () => void;
}

export default function ErrorBanner({ error, onClear }: ErrorBannerProps) {
  if (!error) return null;

  const renderErrorMessage = () => {
    if (typeof error === 'string') return error;
    if (Array.isArray(error)) {
      return (
        <ul className="list-disc pl-5 space-y-1">
          {error.map((err, idx) => (
            <li key={idx}>
              <strong className="font-mono">{err.loc?.join('.') || 'Field'}:</strong> {err.msg}
            </li>
          ))}
        </ul>
      );
    }
    return JSON.stringify(error);
  };

  return (
    <div className="bg-red-50 border-l-4 border-red-600 p-4 mb-4 flex justify-between items-start rounded-r-md shadow-sm">
      <div className="text-sm text-red-800">
        <h4 className="font-bold mb-1">Backend Exception Caught</h4>
        {renderErrorMessage()}
      </div>
      <button 
        onClick={onClear} 
        className="text-red-600 hover:text-red-800 font-bold px-2 text-lg"
      >
        &times;
      </button>
    </div>
  );
}
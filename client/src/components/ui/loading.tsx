import React from 'react';

interface LoadingProps {
  message?: string;
  progress?: number;
}

const Loading: React.FC<LoadingProps> = ({ message, progress }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-8 text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {message || 'Loading...'}
      </h3>
      {progress !== undefined && (
        <div className="mt-4 bg-gray-200 rounded-full h-2 w-full max-w-md mx-auto">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      )}
    </div>
  );
};

export default Loading;

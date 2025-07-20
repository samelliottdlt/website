export default function Loading() {
  return (
    <div className="p-5 text-center">
      <h1 className="text-3xl mb-4 font-bold text-indigo-600">
        Game of the Year
      </h1>
      
      {/* Simple loading state - only shown in edge cases with force-static */}
      <div className="flex flex-col items-center space-y-4">
        <div className="text-lg">
          <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
        </div>
        
        {/* Loading image placeholder */}
        <div className="flex justify-center">
          <div className="w-64 h-64 bg-gray-200 rounded-lg flex items-center justify-center animate-pulse">
            <div className="text-gray-400">
              <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

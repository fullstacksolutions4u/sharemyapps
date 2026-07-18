import { memo } from 'react';

const ProjectSkeleton = memo(function ProjectSkeleton() {
  return (
    <div className="bg-white border border-[#E5E1DA] rounded-xl overflow-hidden shadow-md flex flex-col animate-pulse h-full">
      {/* Banner */}
      <div className="w-full h-44 bg-gray-200" />

      {/* Body */}
      <div className="p-4 flex flex-col flex-1 gap-3">
        <div>
          <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
          <div className="h-3.5 bg-gray-200 rounded w-full mb-1.5" />
          <div className="h-3.5 bg-gray-200 rounded w-5/6" />
        </div>

        {/* Footer */}
        <div className="mt-auto pt-3 border-t border-border flex items-center justify-between gap-2">
          {/* Avatar and Name */}
          <div className="flex items-center gap-2 flex-1">
            <div className="w-6 h-6 rounded-full bg-gray-200 shrink-0" />
            <div className="flex flex-col gap-1.5">
              <div className="h-3 bg-gray-200 rounded w-20" />
              <div className="h-2.5 bg-gray-200 rounded w-16" />
            </div>
          </div>
          
          {/* Stats & Button */}
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="w-6 h-3 bg-gray-200 rounded" />
              <div className="w-6 h-3 bg-gray-200 rounded" />
              <div className="w-6 h-3 bg-gray-200 rounded" />
            </div>
            <div className="w-10 h-4 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
});

export default ProjectSkeleton;

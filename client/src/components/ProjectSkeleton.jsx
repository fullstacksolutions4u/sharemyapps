import { memo } from 'react';

const ProjectSkeleton = memo(function ProjectSkeleton() {
  return (
    <div className="bg-white border border-[#E5E1DA] rounded-xl overflow-hidden animate-pulse">
      <div className="h-44 bg-[#F3F0EB]" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-[#F3F0EB] rounded w-3/4" />
        <div className="h-3 bg-[#F3F0EB] rounded w-full" />
        <div className="h-3 bg-[#F3F0EB] rounded w-5/6" />
        <div className="flex gap-2 mt-2">
          <div className="h-5 w-14 bg-[#F3F0EB] rounded-full" />
          <div className="h-5 w-16 bg-[#F3F0EB] rounded-full" />
        </div>
      </div>
    </div>
  );
});

export default ProjectSkeleton;

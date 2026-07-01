import React from 'react';
import { 
  ThumbsUp, 
  MessageCircle, 
  Share2, 
  MoreHorizontal, 
  Heart, 
  CornerDownRight, 
  MessageSquare,
  Check,
  CheckCheck,
  ChevronDown,
  Repeat,
  BarChart2
} from 'lucide-react';

export const Icons = {
  ThumbsUp,
  MessageCircle,
  Share: Share2,
  MoreHorizontal,
  Heart,
  Reply: CornerDownRight,
  Comment: MessageSquare,
  Check,
  CheckCheck,
  ChevronDown,
  Repeat,
  BarChart2
};

export const VerifiedBadge: React.FC<{ platform: 'facebook' | 'youtube' | 'tiktok' | 'twitter' | 'instagram' }> = ({ platform }) => {
  if (platform === 'facebook') {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-blue-500 ml-1">
        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" stroke="currentColor" strokeWidth="1"/>
        <circle cx="12" cy="12" r="10" className="opacity-20 fill-blue-500" />
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
      </svg>
    );
  }
  
  if (platform === 'youtube') {
    return (
      <div className="bg-gray-500 text-white rounded-full p-[1px] ml-1 w-3.5 h-3.5 flex items-center justify-center">
        <Icons.Check size={10} strokeWidth={4} />
      </div>
    );
  }

  if (platform === 'twitter') {
    return (
      <svg viewBox="0 0 24 24" aria-label="Verified account" role="img" className="w-[18px] h-[18px] text-[#1d9bf0] ml-1 fill-current"><g><path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.918-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.337 2.25c-.416-.165-.866-.25-1.336-.25-2.21 0-3.918 1.792-3.918 4 0 .495.084.965.238 1.4-1.273.65-2.148 2.02-2.148 3.6 0 1.46.74 2.746 1.867 3.45-.013.18-.024.36-.024.55 0 2.21 1.708 3.998 3.918 3.998.47 0 .92-.086 1.336-.25C9.184 21.585 10.49 22.5 12 22.5s2.816-.917 3.336-2.25c.416.164.866.25 1.336.25 2.21 0 3.918-1.792 3.918-4 0-.19-.01-.37-.024-.55 1.127-.705 1.867-1.99 1.867-3.45zm-11.11 4.93l-4.15-4.15 1.41-1.41 2.74 2.74 5.8-5.8 1.41 1.41-7.21 7.21z"></path></g></svg>
    );
  }

  if (platform === 'instagram') {
    return (
      <svg aria-label="Verified" className="w-[14px] h-[14px] text-[#0095f6] fill-current" viewBox="0 0 40 40"><path d="M19.998 3.094 14.638 0l-2.972 5.15H5.432v6.354L0 14.64 3.094 20 0 25.359l5.432 3.137v5.905h5.975L14.638 40l5.36-3.094L25.358 40l3.232-5.6h6.162v-6.01L40 25.359 36.905 20 40 14.641l-5.248-3.03v-6.46h-6.419L25.358 0l-5.36 3.094Zm7.415 11.225 2.254 2.287-11.43 11.5-6.835-6.93 2.244-2.258 4.587 4.581 9.18-9.18Z" fillRule="evenodd"></path></svg>
    );
  }

  // TikTok
  return (
    <div className="bg-[#20D5EC] text-white rounded-full p-[1px] ml-1 w-3.5 h-3.5 flex items-center justify-center">
       <Icons.Check size={8} strokeWidth={4} />
    </div>
  );
};
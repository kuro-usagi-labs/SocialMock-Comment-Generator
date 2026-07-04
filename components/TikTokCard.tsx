import React from 'react';
import { CommentConfig } from '../types';
import Avatar from './Avatar';
import { Icons, VerifiedBadge } from './Icons';

interface Props {
  config: CommentConfig;
  contentNode?: React.ReactNode;
}

const TikTokCard: React.FC<Props> = ({ config, contentNode }) => {
  const isDark = config.theme === 'dark';
  
  // TikTok mostly uses white modal sheets on mobile, but let's support dark for desktop feel
  const bgCard = isDark ? 'bg-[#121212]' : 'bg-white';
  const textPrimary = isDark ? 'text-[rgba(255,255,255,0.9)]' : 'text-[#161823]';
  const textSecondary = isDark ? 'text-[rgba(255,255,255,0.5)]' : 'text-[rgba(22,24,35,0.5)]';

  const paddingClass = {
    compact: 'p-2',
    normal: 'p-4',
    spacious: 'p-8',
  }[config.padding];

  return (
    <div className={`w-full h-full flex items-center justify-center bg-transparent p-8`}>
      <div 
        className={`${bgCard} ${paddingClass} w-full font-sans rounded-2xl shadow-xl`}
        style={{ width: config.width }}
      >
        <div className="flex gap-3 relative">
          <Avatar 
            url={config.avatarUrl} 
            initials={config.avatarInitials} 
            color={config.avatarColor}
            size={36}
          />
          
          <div className="flex flex-col flex-grow pr-8">
            {/* Name */}
            <div className="flex items-center gap-1">
              <span className={`${textSecondary} text-[13px] font-semibold`}>
                {config.displayName}
              </span>
              {config.isVerified && <VerifiedBadge platform="tiktok" />}
            </div>

            {/* Comment Text */}
            <p 
              className={`${textPrimary} whitespace-pre-wrap break-words text-left leading-tight mt-0.5`}
              style={{ fontSize: config.fontSize }}
            >
              {contentNode ?? config.content}
            </p>

            {/* Meta Row */}
            <div className={`flex items-center gap-4 mt-1.5 ${textSecondary} text-[13px]`}>
              <span>{config.timestamp}</span>
              <span className="font-semibold cursor-pointer">Reply</span>
            </div>
            
            {/* View Replies */}
             {config.showStats && config.replies !== '0' && config.replies !== '' && (
              <div className={`flex items-center gap-2 mt-2 ${textSecondary} text-[13px] font-semibold`}>
                 <div className="w-6 h-[1px] bg-gray-300"></div>
                 <span>View {config.replies} replies</span>
                 <Icons.Reply size={12} className="rotate-[-90deg]" />
              </div>
            )}
          </div>

          {/* Like Heart (Absolute right) */}
          {config.showStats && (
            <div className="flex flex-col items-center gap-0.5 absolute right-0 top-0">
               <Icons.Heart size={20} className={`${textSecondary} opacity-50`} />
               <span className={`${textSecondary} text-[12px]`}>{config.likes}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TikTokCard;

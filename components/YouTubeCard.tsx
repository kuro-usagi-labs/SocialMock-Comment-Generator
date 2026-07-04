import React from 'react';
import { CommentConfig } from '../types';
import Avatar from './Avatar';
import { Icons, VerifiedBadge } from './Icons';

interface Props {
  config: CommentConfig;
  contentNode?: React.ReactNode;
}

const YouTubeCard: React.FC<Props> = ({ config, contentNode }) => {
  const isDark = config.theme === 'dark';
  
  const bgCard = isDark ? 'bg-[#0f0f0f]' : 'bg-white';
  const textPrimary = isDark ? 'text-white' : 'text-[#0f0f0f]';
  const textSecondary = isDark ? 'text-[#aaaaaa]' : 'text-[#606060]';
  const iconColor = isDark ? 'text-white' : 'text-[#0f0f0f]';
  const borderColor = isDark ? 'border-[#3f3f3f]' : 'border-[#e5e5e5]';

  const paddingClass = {
    compact: 'p-2',
    normal: 'p-4',
    spacious: 'p-8',
  }[config.padding];

  const hasReplies = config.showStats && config.replies !== '0' && config.replies !== '';

  return (
    <div className={`w-full h-full flex items-center justify-center bg-transparent p-8`}>
      <div 
        className={`${bgCard} ${paddingClass} w-full font-roboto rounded-2xl shadow-xl`}
        style={{ width: config.width }}
      >
        <div className="flex gap-4">
          <div className="flex flex-col items-center flex-shrink-0 relative">
             <Avatar 
                url={config.avatarUrl} 
                initials={config.avatarInitials} 
                color={config.avatarColor}
                size={40}
             />
             {/* Connector Line */}
             {hasReplies && (
                <div className={`absolute top-10 left-1/2 -translate-x-1/2 w-4 bottom-0 pointer-events-none`}>
                   <div className={`w-full h-[calc(100%-15px)] border-l-2 border-b-2 ${borderColor} rounded-bl-xl ml-[1px]`}></div>
                </div>
             )}
          </div>
          
          <div className="flex flex-col w-full z-10">
            {/* Header Line */}
            <div className="flex items-center gap-1 mb-1">
              <span className={`${textPrimary} text-[13px] font-bold`}>
                {config.username || config.displayName}
              </span>
              {config.isVerified && <VerifiedBadge platform="youtube" />}
              <span className={`${textSecondary} text-[12px] ml-1`}>
                {config.timestamp}
              </span>
            </div>

            {/* Comment Text */}
            <p 
              className={`${textPrimary} whitespace-pre-wrap break-words text-left leading-snug mb-2`}
              style={{ fontSize: config.fontSize }}
            >
              {contentNode ?? config.content}
            </p>

            {/* Action Row */}
            {config.showStats && (
              <div className={`flex items-center gap-2 ${textPrimary}`}>
                <div className="flex items-center gap-1.5 p-1.5 -ml-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
                  <Icons.ThumbsUp size={16} strokeWidth={1.5} className={iconColor} />
                  <span className={`text-[12px] ${textSecondary}`}>{config.likes}</span>
                </div>
                <div className="flex items-center gap-1.5 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
                   <Icons.ThumbsUp size={16} strokeWidth={1.5} className={`${iconColor} rotate-180`} />
                </div>
                <span className={`text-[12px] font-semibold ${textPrimary} ml-2 px-3 py-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer`}>Reply</span>
              </div>
            )}

            {/* View Replies */}
            {hasReplies && (
              <div className="flex items-center gap-2 mt-1 text-blue-600 font-bold text-[14px] cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/30 py-1.5 px-3 rounded-full w-fit -ml-2">
                 <Icons.ChevronDown size={18} className="text-blue-600" />
                 <span>{config.replies} replies</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default YouTubeCard;

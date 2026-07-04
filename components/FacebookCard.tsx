import React from 'react';
import { CommentConfig } from '../types';
import Avatar from './Avatar';
import { Icons, VerifiedBadge } from './Icons';

interface Props {
  config: CommentConfig;
  contentNode?: React.ReactNode;
}

const FacebookCard: React.FC<Props> = ({ config, contentNode }) => {
  const isDark = config.theme === 'dark';
  
  // Facebook Styling Constants
  const bgCard = isDark ? 'bg-[#242526]' : 'bg-white';
  const textPrimary = isDark ? 'text-[#e4e6eb]' : 'text-[#050505]';
  const textSecondary = isDark ? 'text-[#b0b3b8]' : 'text-[#65676b]';
  const commentBg = isDark ? 'bg-[#3a3b3c]' : 'bg-[#f0f2f5]';
  const linkColor = isDark ? 'text-[#b0b3b8]' : 'text-[#65676b]';

  const paddingClass = {
    compact: 'p-2',
    normal: 'p-4',
    spacious: 'p-8',
  }[config.padding];

  return (
    <div className={`w-full h-full flex items-center justify-center bg-transparent p-8`}>
      <div 
        className={`${bgCard} ${paddingClass} w-full font-segoe rounded-2xl shadow-xl`}
        style={{ width: config.width }}
      >
        <div className="flex gap-2">
          <Avatar 
            url={config.avatarUrl} 
            initials={config.avatarInitials} 
            color={config.avatarColor}
            size={40}
          />
          
          <div className="flex flex-col max-w-[85%]">
            {/* Comment Bubble */}
            <div className={`${commentBg} px-3 py-2 rounded-2xl inline-block relative group`}>
              <div className="flex items-center gap-1">
                <span className={`${textPrimary} text-[13px] font-semibold hover:underline cursor-pointer`}>
                  {config.displayName}
                </span>
                {config.isVerified && <VerifiedBadge platform="facebook" />}
              </div>
              <p 
                className={`${textPrimary} whitespace-pre-wrap break-words text-left leading-tight`}
                style={{ fontSize: config.fontSize }}
              >
                {contentNode ?? config.content}
              </p>

              {/* Like Count Bubble Overlay */}
              {config.showStats && parseInt(config.likes) > 0 && (
                <div className={`absolute -bottom-2 -right-1 bg-white dark:bg-[#3e4042] rounded-full shadow-sm px-1 flex items-center gap-1 border border-transparent dark:border-[#3e4042] p-0.5`}>
                   <div className="bg-blue-500 rounded-full p-[2px]">
                      <Icons.ThumbsUp size={8} className="text-white fill-white" />
                   </div>
                   <span className={`text-[11px] ${textSecondary}`}>{config.likes}</span>
                </div>
              )}
            </div>

            {/* Action Row */}
            <div className={`flex items-baseline gap-3 mt-1 ml-3 text-[12px] font-semibold ${linkColor}`}>
              <span className="cursor-pointer hover:underline">Like</span>
              <span className="cursor-pointer hover:underline">Reply</span>
              <span className="font-normal">{config.timestamp}</span>
            </div>
            
             {/* Optional Reply Thread Preview */}
             {config.showStats && config.replies !== '0' && config.replies !== '' && (
                <div className="flex items-center gap-2 mt-2 ml-3">
                   <Icons.Reply className="rotate-180 text-gray-400" size={16} />
                   <span className={`text-[13px] font-semibold ${textPrimary} cursor-pointer hover:underline`}>
                      {config.replies} Replies
                   </span>
                </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacebookCard;

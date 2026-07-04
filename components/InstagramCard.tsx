import React from 'react';
import { CommentConfig } from '../types';
import Avatar from './Avatar';
import { Icons, VerifiedBadge } from './Icons';

interface Props {
  config: CommentConfig;
  contentNode?: React.ReactNode;
}

const InstagramCard: React.FC<Props> = ({ config, contentNode }) => {
  const isDark = config.theme === 'dark';
  
  const bgCard = isDark ? 'bg-black' : 'bg-white';
  const textPrimary = isDark ? 'text-[#f5f5f5]' : 'text-[#262626]';
  const textSecondary = isDark ? 'text-[#a8a8a8]' : 'text-[#8e8e8e]';

  const paddingClass = {
    compact: 'p-2',
    normal: 'p-4',
    spacious: 'p-6',
  }[config.padding];

  return (
    <div className={`w-full h-full flex items-center justify-center bg-transparent p-8`}>
      <div 
        className={`${bgCard} ${paddingClass} w-full font-sans rounded-2xl shadow-xl`}
        style={{ width: config.width }}
      >
        <div className="flex gap-3 items-start justify-between">
          <div className="flex gap-3 items-start w-full">
            <div className="flex-shrink-0 mt-1">
              <Avatar 
                url={config.avatarUrl} 
                initials={config.avatarInitials} 
                color={config.avatarColor}
                size={32}
              />
            </div>
            
            <div className="flex flex-col w-full">
              {/* Comment Text with Inline Username */}
              <div className="leading-tight text-left break-words">
                <span className={`${textPrimary} text-[14px] font-semibold mr-1 cursor-pointer hover:text-gray-500`}>
                  {config.username.replace('@', '')}
                </span>
                {config.isVerified && <span className="inline-flex mr-1 align-middle"><VerifiedBadge platform="instagram" /></span>}
                <span 
                  className={`${textPrimary} whitespace-pre-wrap break-words`}
                  style={{ fontSize: config.fontSize }}
                >
                  {contentNode ?? config.content}
                </span>
              </div>

              {/* Action Row */}
              <div className={`flex items-center gap-3 mt-2 text-[12px] font-semibold ${textSecondary}`}>
                <span className="font-normal">{config.timestamp}</span>
                {config.showStats && parseInt(config.likes) > 0 && (
                  <span className="cursor-pointer">{config.likes} likes</span>
                )}
                <span className="cursor-pointer">Reply</span>
                <Icons.MoreHorizontal size={14} className="cursor-pointer" />
              </div>
              
              {/* View Replies */}
              {config.showStats && config.replies !== '0' && config.replies !== '' && (
                <div className="flex items-center gap-2 mt-3 cursor-pointer">
                  <div className={`w-6 h-[1px] ${isDark ? 'bg-[#a8a8a8]' : 'bg-[#8e8e8e]'}`}></div>
                  <span className={`text-[12px] font-semibold ${textSecondary}`}>
                    View replies ({config.replies})
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Heart Icon on the right */}
          <div className="flex-shrink-0 mt-2 cursor-pointer">
            <Icons.Heart size={12} className={textSecondary} strokeWidth={2} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstagramCard;

import React from 'react';
import { CommentConfig } from '../types';
import Avatar from './Avatar';
import { Icons, VerifiedBadge } from './Icons';

interface Props {
  config: CommentConfig;
}

const TwitterCard: React.FC<Props> = ({ config }) => {
  const isDark = config.theme === 'dark';
  
  const bgCard = isDark ? 'bg-black' : 'bg-white';
  const textPrimary = isDark ? 'text-[#e7e9ea]' : 'text-[#0f1419]';
  const textSecondary = isDark ? 'text-[#71767b]' : 'text-[#536471]';
  const borderColor = isDark ? 'border-[#2f3336]' : 'border-[#eff3f4]';
  const iconColor = isDark ? 'text-[#71767b]' : 'text-[#536471]';

  const paddingClass = {
    compact: 'p-3',
    normal: 'p-4',
    spacious: 'p-6',
  }[config.padding];

  return (
    <div className={`w-full h-full flex items-center justify-center bg-transparent p-8`}>
      <div 
        className={`${bgCard} ${paddingClass} w-full font-sans rounded-2xl shadow-xl border ${borderColor}`}
        style={{ width: config.width }}
      >
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            <Avatar 
              url={config.avatarUrl} 
              initials={config.avatarInitials} 
              color={config.avatarColor}
              size={48}
            />
          </div>
          
          <div className="flex flex-col w-full min-w-0">
            {/* Header Line */}
            <div className="flex items-center justify-between mb-0.5">
              <div className="flex items-center gap-1 truncate">
                <span className={`${textPrimary} text-[15px] font-bold truncate hover:underline cursor-pointer`}>
                  {config.displayName}
                </span>
                {config.isVerified && <VerifiedBadge platform="twitter" />}
                <span className={`${textSecondary} text-[15px] truncate`}>
                  {config.username}
                </span>
                <span className={`${textSecondary} text-[15px] px-1`}>·</span>
                <span className={`${textSecondary} text-[15px] hover:underline cursor-pointer`}>
                  {config.timestamp}
                </span>
              </div>
              <Icons.MoreHorizontal className={`${textSecondary} flex-shrink-0 ml-2`} size={18} />
            </div>

            {/* Comment Text */}
            <p 
              className={`${textPrimary} whitespace-pre-wrap break-words text-left leading-normal mb-3 mt-0.5`}
              style={{ fontSize: config.fontSize }}
            >
              {config.content}
            </p>

            {/* Action Row */}
            {config.showStats && (
              <div className={`flex items-center justify-between max-w-md ${iconColor}`}>
                <div className="flex items-center gap-2 group cursor-pointer">
                  <div className="p-2 rounded-full group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 group-hover:text-blue-500 transition-colors">
                    <Icons.MessageCircle size={18} strokeWidth={1.5} />
                  </div>
                  <span className={`text-[13px] group-hover:text-blue-500 transition-colors`}>{config.replies}</span>
                </div>
                
                <div className="flex items-center gap-2 group cursor-pointer">
                  <div className="p-2 rounded-full group-hover:bg-green-50 dark:group-hover:bg-green-900/20 group-hover:text-green-500 transition-colors">
                    <Icons.Repeat size={18} strokeWidth={1.5} />
                  </div>
                  <span className={`text-[13px] group-hover:text-green-500 transition-colors`}></span>
                </div>

                <div className="flex items-center gap-2 group cursor-pointer">
                  <div className="p-2 rounded-full group-hover:bg-pink-50 dark:group-hover:bg-pink-900/20 group-hover:text-pink-500 transition-colors">
                    <Icons.Heart size={18} strokeWidth={1.5} />
                  </div>
                  <span className={`text-[13px] group-hover:text-pink-500 transition-colors`}>{config.likes}</span>
                </div>

                <div className="flex items-center gap-2 group cursor-pointer">
                  <div className="p-2 rounded-full group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 group-hover:text-blue-500 transition-colors">
                    <Icons.BarChart2 size={18} strokeWidth={1.5} />
                  </div>
                </div>

                <div className="flex items-center gap-2 group cursor-pointer">
                  <div className="p-2 rounded-full group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 group-hover:text-blue-500 transition-colors">
                    <Icons.Share size={18} strokeWidth={1.5} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TwitterCard;

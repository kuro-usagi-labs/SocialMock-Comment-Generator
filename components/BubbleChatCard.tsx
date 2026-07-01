import React from 'react';
import { CommentConfig, DmStyle } from '../types';
import { Icons } from './Icons';
import Avatar from './Avatar';

interface Props {
  config: CommentConfig;
  messageOverride?: string;
}

const WhatsappBubble: React.FC<{ config: CommentConfig; content: string; isDark: boolean }> = ({ config, content, isDark }) => {
  const isMe = config.isMe;
  const bgMe = isDark ? 'bg-[#005c4b]' : 'bg-[#d9fdd3]';
  const textMe = isDark ? 'text-[#e9edef]' : 'text-[#111b21]';
  const bgThem = isDark ? 'bg-[#202c33]' : 'bg-white';
  const textThem = isDark ? 'text-[#e9edef]' : 'text-[#111b21]';
  const timeColor = isDark ? 'text-white/60' : 'text-black/40';
  const tickColor = 'text-[#53bdeb]'; // Blue ticks for read receipt

  return (
    <div className={`w-full flex ${isMe ? 'justify-end' : 'justify-start'} font-sans relative px-4 py-2`}>
      <div 
        className={`relative max-w-[85%] sm:max-w-[75%] shadow-sm ${isMe ? bgMe : bgThem} ${isMe ? textMe : textThem}`}
        style={{ 
          borderRadius: '18px',
          borderBottomRightRadius: isMe ? '0px' : '18px',
          borderBottomLeftRadius: isMe ? '18px' : '0px',
          padding: '8px 10px 8px 12px',
          fontSize: config.fontSize 
        }}
      >
        {/* Modern iOS WhatsApp Tail */}
        <svg 
          viewBox="0 0 8 10" 
          width="8" 
          height="10" 
          className={`absolute bottom-0 ${isMe ? '-right-[7px]' : '-left-[7px]'} ${isMe ? (isDark ? 'text-[#005c4b]' : 'text-[#d9fdd3]') : (isDark ? 'text-[#202c33]' : 'text-white')}`} 
          style={{ fill: 'currentColor' }}
        >
          {isMe 
            ? <path d="M0 10H8C8 5 3 2 0 0V10Z" /> 
            : <path d="M8 10H0C0 5 5 2 8 0V10Z" />
          }
        </svg>

        <p className="whitespace-pre-wrap break-words leading-[1.35] [overflow-wrap:anywhere] py-1">
          {content}
        </p>
      </div>
    </div>
  );
};

const InstagramBubble: React.FC<{ config: CommentConfig; content: string; isDark: boolean }> = ({ config, content, isDark }) => {
  const isMe = config.isMe;
  const bgMe = 'bg-gradient-to-br from-[#7c3aed] via-[#5b6cff] to-[#1d9bf0]';
  const textMe = 'text-white';
  const bgThem = isDark ? 'bg-[#262626]' : 'bg-[#efefef]';
  const textThem = isDark ? 'text-[#f5f5f7]' : 'text-[#262626]';
  
  return (
    <div className={`w-full flex ${isMe ? 'justify-end' : 'justify-start'} items-end gap-2 font-sans relative px-4 py-2`}>
      {!isMe && (
        <div className="shrink-0 mb-0.5">
          <Avatar 
            url={config.avatarUrl} 
            initials={config.avatarInitials} 
            color={config.avatarColor}
            size={Math.max(34, config.fontSize * 2)}
          />
        </div>
      )}
      <div 
        className={`max-w-[75%] px-5 py-3 ${isMe ? bgMe : bgThem} ${isMe ? textMe : textThem}`}
        style={{ 
          borderRadius: '22px',
          borderBottomRightRadius: isMe ? '4px' : '22px',
          borderBottomLeftRadius: isMe ? '22px' : '4px',
          fontSize: config.fontSize 
        }}
      >
        <p className="whitespace-pre-wrap break-words leading-[1.4] [overflow-wrap:anywhere]">
          {content}
        </p>
      </div>
    </div>
  );
};

const IMessageBubble: React.FC<{ config: CommentConfig; content: string; isDark: boolean }> = ({ config, content, isDark }) => {
  const isMe = config.isMe;
  const bgMe = isDark ? 'bg-[#0a84ff]' : 'bg-[#007aff]';
  const textMe = 'text-white';
  const bgThem = isDark ? 'bg-[#3a3a3c]' : 'bg-[#e9e9eb]';
  const textThem = isDark ? 'text-white' : 'text-black';
  
  return (
    <div className={`w-full flex flex-col ${isMe ? 'items-end' : 'items-start'} font-sans relative px-4 py-2`} style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
      <div 
        className={`relative max-w-[75%] px-[14px] py-[8px] ${isMe ? bgMe : bgThem} ${isMe ? textMe : textThem}`}
        style={{ 
          borderRadius: '20px',
          borderBottomRightRadius: isMe ? '0px' : '20px',
          borderBottomLeftRadius: isMe ? '20px' : '0px',
          fontSize: config.fontSize 
        }}
      >
        <p className="whitespace-pre-wrap break-words leading-[1.35] [overflow-wrap:anywhere]">
          {content}
        </p>
        
        {/* Tail SVG */}
        <svg 
          viewBox="0 0 10 14" 
          width="10" 
          height="14" 
          className={`absolute bottom-0 ${isMe ? '-right-[9px]' : '-left-[9px]'} ${isMe ? (isDark ? 'text-[#0a84ff]' : 'text-[#007aff]') : (isDark ? 'text-[#3a3a3c]' : 'text-[#e9e9eb]')}`} 
          style={{ fill: 'currentColor' }}
        >
          {isMe 
            ? <path d="M0 14H10C10 7 4 3 0 0V14Z" /> 
            : <path d="M10 14H0C0 7 6 3 10 0V14Z" />
          }
        </svg>
      </div>
    </div>
  );
};

const BubbleChatCard: React.FC<Props> = ({ config, messageOverride }) => {
  const isDark = config.theme === 'dark';
  const content = messageOverride || config.content;
  
  let BubbleComponent = InstagramBubble;
  if (config.dmStyle === 'whatsapp') BubbleComponent = WhatsappBubble;
  if (config.dmStyle === 'imessage') BubbleComponent = IMessageBubble;

  return (
    <div className="w-full flex items-center justify-center bg-transparent p-2 md:p-8">
      <div 
        className="w-full"
        style={{ width: config.width }}
      >
        <BubbleComponent config={config} content={content} isDark={isDark} />
      </div>
    </div>
  );
};

export default BubbleChatCard;

import React from 'react';
import { CommentConfig, DmStyle } from '../types';
import { Icons } from './Icons';
import Avatar from './Avatar';
import { Message } from '@chatscope/chat-ui-kit-react';
import '@chatscope/chat-ui-kit-styles/dist/default/styles.min.css';

interface Props {
  config: CommentConfig;
  messageOverride?: string;
}

const WhatsappBubble: React.FC<{ config: CommentConfig; content: string; isDark: boolean }> = ({ config, content, isDark }) => {
  const isMe = config.isMe;
  
  return (
    <div className={`w-full flex ${isMe ? 'justify-end' : 'justify-start'} font-sans relative px-4 py-2`}>
      <div 
        className="chatscope-override-wa w-full max-w-[85%] sm:max-w-[75%]"
        style={{ 
          fontSize: config.fontSize,
          '--cs-message-bg-color': isMe ? (isDark ? '#005c4b' : '#d9fdd3') : (isDark ? '#202c33' : '#ffffff'),
          '--cs-message-text-color': isMe ? (isDark ? '#e9edef' : '#111b21') : (isDark ? '#e9edef' : '#111b21'),
        } as React.CSSProperties}
      >
        <Message 
          model={{
            message: content,
            direction: isMe ? 'outgoing' : 'incoming',
            position: 'single'
          }} 
        />
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
  
  return (
    <div className={`w-full flex flex-col ${isMe ? 'items-end' : 'items-start'} font-sans relative px-4 py-2`} style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
      <div 
        className="chatscope-override-imessage w-full max-w-[75%]"
        style={{ 
          fontSize: config.fontSize,
          '--cs-message-bg-color': isMe ? (isDark ? '#0a84ff' : '#007aff') : (isDark ? '#3a3a3c' : '#e9e9eb'),
          '--cs-message-text-color': isMe ? '#ffffff' : (isDark ? '#ffffff' : '#000000'),
        } as React.CSSProperties}
      >
        <Message 
          model={{
            message: content,
            direction: isMe ? 'outgoing' : 'incoming',
            position: 'single'
          }} 
        />
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
      <style>{`
        /* Override chatscope variables and layout to match our style */
        .chatscope-override-wa .cs-message, .chatscope-override-imessage .cs-message {
          background-color: transparent !important;
          padding: 0 !important;
        }
        .chatscope-override-wa .cs-message__content, .chatscope-override-imessage .cs-message__content {
          background-color: var(--cs-message-bg-color) !important;
          color: var(--cs-message-text-color) !important;
        }
        .chatscope-override-wa .cs-message__html-content, .chatscope-override-imessage .cs-message__html-content {
          color: var(--cs-message-text-color) !important;
        }
        
        /* Specific overrides for WA */
        .chatscope-override-wa .cs-message--outgoing .cs-message__content {
          border-radius: 18px 18px 0px 18px !important;
        }
        .chatscope-override-wa .cs-message--incoming .cs-message__content {
          border-radius: 18px 18px 18px 0px !important;
        }
      `}</style>
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

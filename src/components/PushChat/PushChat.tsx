"use client";

import React, { useState, useEffect } from 'react';
import { X, Send, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { useSession } from "next-auth/react";

interface Message {
  id: string;
  content: string;
  sender_address: string;
  receiver_address: string | null;
  created_at: string;
  is_global: boolean;
}

interface PushChatProps {
  selectedAddress: string;
  onClose?: () => void;
}

const PushChat: React.FC<PushChatProps> = ({ selectedAddress, onClose }) => {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const { data: session } = useSession();
  // Temporary wallet address for demo
  const walletAddress = session?.user?.name
  const address = walletAddress; 
  console.log("walletAddress: ", address);
  const currentUserAddress =address;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    fetchMessages();
    
    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages(prev => {
            // Check if message already exists
            if (prev.some(msg => msg.id === newMessage.id)) {
              return prev;
            }
            
            // Filter based on chat type
            if (selectedAddress === 'Global Chat') {
              if (newMessage.is_global) {
                return [...prev, newMessage];
              }
            } else {
              if (!newMessage.is_global && 
                  ((newMessage.sender_address === currentUserAddress && newMessage.receiver_address === selectedAddress) ||
                   (newMessage.sender_address === selectedAddress && newMessage.receiver_address === currentUserAddress))) {
                return [...prev, newMessage];
              }
            }
            return prev;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedAddress]);

  const fetchMessages = async () => {
    try {
      let query = supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true });

      if (selectedAddress === 'Global Chat') {
        query = query.eq('is_global', true);
      } else {
        query = query.eq('is_global', false)
          .or(`sender_address.eq.${currentUserAddress},receiver_address.eq.${currentUserAddress}`)
          .or(`sender_address.eq.${selectedAddress},receiver_address.eq.${selectedAddress}`);
      }

      const { data, error } = await query;
      
      if (error) throw error;

      // Filter direct messages to only show conversations between current user and selected address
      const filteredData = selectedAddress === 'Global Chat' 
        ? data 
        : data.filter(msg => 
            (msg.sender_address === currentUserAddress && msg.receiver_address === selectedAddress) ||
            (msg.sender_address === selectedAddress && msg.receiver_address === currentUserAddress)
          );

      setMessages(filteredData || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleSend = async () => {
    if (!message.trim()) return;
    
    setIsSending(true);
    try {
      const newMessage = {
        content: message.trim(),
        sender_address: currentUserAddress,
        receiver_address: selectedAddress === 'Global Chat' ? null : selectedAddress,
        is_global: selectedAddress === 'Global Chat'
      };

      const { error } = await supabase
        .from('messages')
        .insert([newMessage]);

      if (error) throw error;

      setMessage('');
      // Fetch messages after sending to ensure consistency
      await fetchMessages();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const formatAddress = (address: string) => {
    if (address === 'Global Chat') return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { [date: string]: Message[] } = {};
    
    messages.forEach(message => {
      const date = format(new Date(message.created_at), 'PP');
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });

    return groups;
  };

  const messageGroups = groupMessagesByDate(messages);

  return (
    <div className="fixed bottom-0 right-0 md:bottom-4 md:right-4 w-full md:w-96 bg-card shadow-xl border-t md:border md:rounded-lg overflow-hidden">
      <div className="flex justify-between items-center p-3 md:p-4 border-b bg-muted">
        <h3 className="text-base md:text-lg font-semibold flex items-center gap-2">
          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
          {formatAddress(selectedAddress)}
        </h3>
        <button 
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-full hover:bg-muted-foreground/10"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <div className="h-[250px] md:h-[300px] overflow-y-auto p-3 md:p-4 space-y-3 md:space-y-4">
        {Object.entries(messageGroups).map(([date, messages]) => (
          <div key={date}>
            <div className="flex justify-center mb-4">
              <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                {date}
              </span>
            </div>
            <div className="space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${
                    msg.sender_address === currentUserAddress
                      ? 'justify-end'
                      : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[80%] px-4 py-2 rounded-lg ${
                      msg.sender_address === currentUserAddress
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm break-words">{msg.content}</p>
                    <p className="text-xs mt-1 opacity-70">
                      {format(new Date(msg.created_at), 'p')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        {messages.length === 0 && (
          <p className="text-muted-foreground text-center text-sm">No messages yet</p>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="p-3 md:p-4 border-t bg-card">
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-muted rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            type="submit"
            disabled={!message.trim() || isSending}
            className="bg-primary text-primary-foreground px-3 md:px-4 py-2 rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isSending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PushChat;
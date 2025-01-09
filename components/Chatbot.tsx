'use client'

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Socket } from 'socket.io-client';

interface BloodTestChatbotProps {
  socket: Socket | null;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export function BloodTestChatbot({ socket }: BloodTestChatbotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    async function initializeChat() {
      try {
        const response = await fetch(`${apiUrl}/api/initial_chat`, {
          method: 'POST',
        });

        if (response.ok) {
          const data = await response.json();
          const { conversations } = data;
          setMessages(conversations || []);
        } else {
          console.error('Failed to fetch initial chat');
        }
      } catch (error) {
        console.error('Error during initial chat:', error);
      }
    }

    initializeChat();

    if (socket) {
      socket.on('new_reading', initializeChat);
    }

    return () => {
      if (socket) {
        socket.off('new_reading', initializeChat);
      }
    };
  }, [socket]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: ChatMessage = { role: 'user', content: input };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInput('');
    setChatLoading(true);

    try {
      const response = await fetch(`${apiUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch response from API');
      }

      const data = await response.json();
      const assistantMessage: ChatMessage = { role: 'assistant', content: data.message };
      setMessages((prevMessages) => [...prevMessages, assistantMessage]);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage: ChatMessage = { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleClearChat = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/clearchat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to clear chat history');
      }

      setMessages([]); // Clear conversation history
    } catch (error) {
      console.error('Error clearing chat:', error);
    }
  };

  return (
    <Card className="w-full mt-8">
      <CardHeader>
        <h3 className="font-semibold text-lg">Chatbot</h3>
      </CardHeader>
      <CardContent className="h-[40vh] overflow-y-auto">
        {messages.map((m, index) => (
          <div key={index} className={`mb-4 ${m.role === 'user' ? 'text-right' : 'text-left'}`}>
            <span
              className={`inline-block p-2 rounded-lg ${
                m.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-black'
              }`}
              style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}
              dangerouslySetInnerHTML={{
                __html: m.content.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>'), // Converts **bold** to <b>bold</b>
              }}
            />
          </div>
        ))}
        {chatLoading && (
          <div className="text-center">
            <div
              className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em]"
              role="status"
            >
              <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0">Loading...</span>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <form onSubmit={handleSubmit} className="flex w-full space-x-2">
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder="Ask about your blood test results..."
            className="flex-grow"
          />
          <Button type="submit" disabled={chatLoading}>
            Send
          </Button>
          <Button type="button" onClick={handleClearChat} disabled={chatLoading} variant="outline" className="ml-2">
            Clear Chat
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}


import React, { useState, useRef, useEffect } from 'react';
import { PaperAirplaneIcon } from '@heroicons/react/24/solid';

interface Message {
  id: number;
  text: string;
  isUser: boolean;
  response?: {
    data: any[];
    visualizationType: string;
    summary: string;
    sql: string;
    query: string;
  };
}

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [expandedSections, setExpandedSections] = useState<{
    [key: number]: {
      sql: boolean;
      data: boolean;
      query: boolean;
    }
  }>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const toggleSection = (messageId: number, section: 'sql' | 'data' | 'query') => {
    setExpandedSections(prev => ({
      ...prev,
      [messageId]: {
        ...prev[messageId],
        [section]: !prev[messageId]?.[section]
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now(),
      text: input,
      isUser: true
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:3001/api/ask-question', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: input }),
      });

      const data = await response.json();
      console.log('Received response:', data); // Debug log

      const aiMessage: Message = {
        id: Date.now() + 1,
        text: 'Here\'s what I found:',
        isUser: false,
        response: data
      };

      setMessages(prev => [...prev, aiMessage]);
      setExpandedSections(prev => ({
        ...prev,
        [aiMessage.id]: {
          sql: true,
          data: true,
          query: true
        }
      }));
    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = {
        id: Date.now() + 1,
        text: 'Sorry, I encountered an error processing your question.',
        isUser: false
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderDataTable = (data: any[]) => {
    if (!data || data.length === 0) return null;
    
    const columns = Object.keys(data[0]);
    
    return (
      <div className="relative w-full">
        <div className="w-full overflow-hidden">
          <div className="w-full">
            <div className="overflow-hidden rounded-lg border border-gray-700">
              <table className="w-full table-fixed divide-y divide-gray-700">
                <thead>
                  <tr className="bg-[#2d2d2d]">
                    {columns.map((column) => (
                      <th 
                        key={column} 
                        className="px-4 py-3 text-left text-sm font-medium text-gray-400 overflow-hidden text-ellipsis"
                        style={{ maxWidth: `${Math.max(100 / columns.length, 12)}%` }}
                      >
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {data.map((row, i) => (
                    <tr key={i} className="hover:bg-[#2d2d2d] transition-colors">
                      {columns.map((column) => (
                        <td 
                          key={column} 
                          className="px-4 py-3 text-sm text-gray-300 overflow-hidden text-ellipsis"
                          style={{ maxWidth: `${Math.max(100 / columns.length, 12)}%` }}
                          title={row[column]?.toString() || 'null'}
                        >
                          {row[column]?.toString() || 'null'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="mt-2 text-xs text-center text-gray-500">
          Hover over cells to see full content
        </div>
      </div>
    );
  };

  const ArrowIcon = ({ expanded }: { expanded: boolean }) => (
    <svg
      className={`w-4 h-4 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 9l-7 7-7-7"
      />
    </svg>
  );

  // Modified function to format summary and put bold text on new lines
  const formatSummary = (summaryText: string) => {
    if (!summaryText) return null;
    
    // Split by double asterisks to identify bold sections
    const parts = summaryText.split(/(\*\*.*?\*\*)/g);
    
    return (
      <div className="text-gray-300 space-y-1">
        {parts.map((part, index) => {
          // Check if this part is a bold section
          if (part.startsWith('**') && part.endsWith('**')) {
            // Remove the asterisks and return as bold text on a new line
            const boldText = part.slice(2, -2);
            return <div key={index} className="text-white font-bold">{boldText}</div>;
          }
          // Return regular text
          return <div key={index}>{part}</div>;
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] bg-[#343541] text-white">
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400 text-base">Ask a question about your data to get started</p>
          </div>
        )}
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.isUser ? 'bg-[#343541]' : 'bg-[#444654]'}`}
          >
            <div className="w-full max-w-3xl mx-auto px-4 py-6">
              <div className="flex items-start space-x-4">
                <div className={`w-8 h-8 rounded-sm flex items-center justify-center flex-shrink-0 ${
                  message.isUser ? 'bg-blue-600' : 'bg-green-600'
                }`}>
                  {message.isUser ? 'U' : 'AI'}
                </div>
                <div className="flex-1 space-y-3">
                  {message.isUser ? (
                    <p className="text-base leading-relaxed">{message.text}</p>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-base text-gray-300 mb-3">{message.text}</p>
                      {message.response && (
                        <div className="space-y-3">
                          {message.response.summary && (
                            <div className="mb-6">
                              <h3 className="text-xl font-semibold text-gray-200 mb-3">Summary</h3>
                              {formatSummary(message.response.summary)}
                            </div>
                          )}
                          
                          {message.response.query && (
                            <div className="mb-4">
                              <button
                                onClick={() => toggleSection(message.id, 'query')}
                                className="flex items-center text-sm text-gray-400 hover:text-gray-300 transition-colors bg-[#2d2d2d] px-3 py-2 rounded hover:bg-[#3d3d3d]"
                              >
                                <ArrowIcon expanded={expandedSections[message.id]?.query} />
                                <span className="ml-2">Processed Query</span>
                              </button>
                              {expandedSections[message.id]?.query && (
                                <div className="bg-[#1a1a1a] p-3 rounded mt-2 border border-gray-700">
                                  <pre className="text-sm overflow-x-auto text-gray-300 font-mono whitespace-pre-wrap">
                                    {message.response.query}
                                  </pre>
                                </div>
                              )}
                            </div>
                          )}

                          {message.response.sql && (
                            <div className="mb-4">
                              <button
                                onClick={() => toggleSection(message.id, 'sql')}
                                className="flex items-center text-sm text-gray-400 hover:text-gray-300 transition-colors bg-[#2d2d2d] px-3 py-2 rounded hover:bg-[#3d3d3d]"
                              >
                                <ArrowIcon expanded={expandedSections[message.id]?.sql} />
                                <span className="ml-2">SQL Query</span>
                              </button>
                              {expandedSections[message.id]?.sql && (
                                <div className="bg-[#1a1a1a] p-3 rounded mt-2 border border-gray-700">
                                  <pre className="text-sm overflow-x-auto text-gray-300 font-mono whitespace-pre-wrap">
                                    {message.response.sql}
                                  </pre>
                                </div>
                              )}
                            </div>
                          )}

                          {message.response.data && (
                            <div>
                              <button
                                onClick={() => toggleSection(message.id, 'data')}
                                className="flex items-center text-sm text-gray-400 hover:text-gray-300 transition-colors bg-[#2d2d2d] px-3 py-2 rounded hover:bg-[#3d3d3d]"
                              >
                                <ArrowIcon expanded={expandedSections[message.id]?.data} />
                                <span className="ml-2">Data Table</span>
                              </button>
                              {expandedSections[message.id]?.data && (
                                <div className="bg-[#1a1a1a] p-3 rounded mt-2 border border-gray-700">
                                  <div className="max-w-full">
                                    {renderDataTable(message.response.data)}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex bg-[#444654]">
            <div className="w-full max-w-3xl mx-auto px-4 py-6">
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 rounded-sm bg-green-600 flex items-center justify-center flex-shrink-0">
                  AI
                </div>
                <div className="flex space-x-1">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="border-t border-gray-700 bg-[#343541] p-4">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSubmit} className="flex space-x-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question about your data..."
              className="flex-1 p-3 bg-[#40414f] text-white border border-gray-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-500 placeholder-gray-400 text-sm"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="bg-[#40414f] text-white p-3 rounded-lg hover:bg-[#4a4b57] focus:outline-none focus:ring-1 focus:ring-gray-500 disabled:opacity-50 transition-colors duration-200"
            >
              <PaperAirplaneIcon className="h-5 w-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
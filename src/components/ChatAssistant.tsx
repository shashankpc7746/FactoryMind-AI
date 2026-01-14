import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, FileText, Upload } from 'lucide-react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import * as api from '../services/api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  citations?: string[];
  reportPreview?: {
    title: string;
    summary: string;
  };
}

export function ChatAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m FactoryMind AI. I can help you query process documents, analyze operational data, and generate reports. How can I assist you today?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev: Message[]) => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsTyping(true);

    try {
      // Query backend API
      const response = await api.queryDocuments(currentInput);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.answer,
        timestamp: new Date(),
        citations: response.citations.length > 0 ? response.citations : undefined,
      };

      setMessages((prev: Message[]) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error querying documents:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I apologize, but I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please make sure the backend server is running and try again.`,
        timestamp: new Date(),
      };
      
      setMessages((prev: Message[]) => [...prev, errorMessage]);
      toast.error('Failed to get response from AI');
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileUpload = (type: 'document' | 'data') => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isPDF = file.name.endsWith('.pdf');
    const isDataFile = file.name.endsWith('.csv') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

    if (!isPDF && !isDataFile) {
      toast.error('Please upload PDF, CSV, or Excel files only');
      return;
    }

    try {
      if (isPDF) {
        toast.loading('Uploading and indexing document...', { id: 'upload' });
        await api.uploadDocument(file);
        toast.success('✓ Document indexed successfully', { id: 'upload' });
        
        // Add system message
        const systemMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `Document "${file.name}" has been successfully uploaded and indexed. You can now ask questions about its contents.`,
          timestamp: new Date(),
        };
        setMessages((prev: Message[]) => [...prev, systemMessage]);
      } else if (isDataFile) {
        toast.loading('Uploading data file...', { id: 'upload' });
        await api.uploadDataFile(file);
        toast.success('✓ Data file uploaded successfully', { id: 'upload' });
        
        // Add system message
        const systemMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `Data file "${file.name}" has been uploaded. Would you like me to generate an operations report from this data?`,
          timestamp: new Date(),
        };
        setMessages((prev: Message[]) => [...prev, systemMessage]);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`, { id: 'upload' });
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6">
        <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
          {messages.map((message: Message) => (
            <div
              key={message.id}
              className={`flex gap-3 sm:gap-4 ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.role === 'assistant' && (
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <span className="text-primary-foreground font-bold text-xs sm:text-sm">FM</span>
                </div>
              )}

              <div
                className={`flex-1 max-w-[85%] sm:max-w-[75%] lg:max-w-[70%] ${
                  message.role === 'user' ? 'ml-auto' : ''
                }`}
              >
                <Card
                  className={`p-3 sm:p-4 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card'
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words text-sm sm:text-base">{message.content}</p>

                  {message.citations && message.citations.length > 0 && (
                    <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-border/20">
                      <p className="text-xs sm:text-sm font-medium mb-2">Sources:</p>
                      <div className="flex flex-wrap gap-2">
                        {message.citations.map((citation: string, idx: number) => (
                          <Badge
                            key={idx}
                            variant="secondary"
                            className="text-[10px] sm:text-xs cursor-pointer hover:bg-secondary/80"
                          >
                            <FileText className="w-3 h-3 mr-1" />
                            {citation}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {message.reportPreview && (
                    <div className="mt-3 sm:mt-4 p-3 sm:p-4 rounded-lg bg-muted/30">
                      <p className="font-medium text-sm sm:text-base mb-1 sm:mb-2">{message.reportPreview.title}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3">
                        {message.reportPreview.summary}
                      </p>
                      <Button size="sm" variant="outline" className="text-xs sm:text-sm">
                        View Full Report
                      </Button>
                    </div>
                  )}
                </Card>

                <p className="text-[10px] sm:text-xs text-muted-foreground mt-1.5 sm:mt-2 px-1">
                  {message.timestamp.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>

              {message.role === 'user' && (
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                  <span className="text-secondary-foreground font-bold text-xs sm:text-sm">U</span>
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-3 sm:gap-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <span className="text-primary-foreground font-bold text-xs sm:text-sm">FM</span>
              </div>
              <Card className="p-3 sm:p-4 bg-card">
                <div className="flex gap-1.5 sm:gap-2">
                  <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" />
                  <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:0.2s]" />
                  <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:0.4s]" />
                </div>
              </Card>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-border bg-card/50 backdrop-blur">
        <div className="max-w-4xl mx-auto p-3 sm:p-4 lg:p-6">
          {/* Suggested Actions */}
          <div className="mb-3 sm:mb-4 flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setInput('What are the quality control procedures for product assembly?')
              }
              className="text-xs sm:text-sm"
            >
              Ask about procedures
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setInput('Generate a production efficiency report')}
              className="text-xs sm:text-sm"
            >
              Generate report
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setInput('Analyze safety incident trends')}
              className="text-xs sm:text-sm"
            >
              Analyze data
            </Button>
          </div>

          {/* Input Box */}
          <div className="flex gap-2 sm:gap-3">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.doc,.docx,.txt,.csv,.xlsx"
              onChange={handleFileChange}
              aria-label="Upload file"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              className="flex-shrink-0 h-10 w-10 sm:h-12 sm:w-12"
              aria-label="Attach file"
            >
              <Paperclip className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>

            <div className="flex-1 relative">
              <Textarea
                value={input}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
                onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask about procedures, request reports, or analyze data..."
                className="resize-none pr-10 sm:pr-12 min-h-[40px] sm:min-h-[48px] text-sm sm:text-base"
                rows={1}
              />
            </div>

            <Button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className="flex-shrink-0 h-10 w-10 sm:h-12 sm:w-12"
              size="icon"
              aria-label="Send message"
            >
              <Send className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </div>

          <p className="text-[10px] sm:text-xs text-muted-foreground mt-2 sm:mt-3 text-center">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}
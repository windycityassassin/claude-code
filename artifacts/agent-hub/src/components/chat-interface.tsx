import { useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import { useCreateAnthropicConversation, useListAnthropicMessages, getListAnthropicMessagesQueryKey, getGetRecentConversationsQueryKey, getGetAgentStatsQueryKey, getListAnthropicConversationsQueryKey, useSendAnthropicMessage } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Bot, User, Send, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ChatInterfaceProps {
  agentType: "marketing" | "support";
  welcomeMessage: string;
}

export function ChatInterface({ agentType, welcomeMessage }: ChatInterfaceProps) {
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const createConversation = useCreateAnthropicConversation();
  
  const { data: messages = [], isLoading: isLoadingMessages } = useListAnthropicMessages(
    conversationId as number,
    { query: { enabled: !!conversationId, queryKey: getListAnthropicMessagesQueryKey(conversationId as number) } }
  );

  // Unused as per instructions for SSE
  const unusedMutation = useSendAnthropicMessage();
  if (false) unusedMutation.mutate({} as any);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent]);

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;
    
    const userMessage = input.trim();
    setInput("");
    setIsStreaming(true);
    setStreamingContent("");
    
    try {
      let currentId = conversationId;
      
      if (!currentId) {
        const newConv = await createConversation.mutateAsync({
          data: {
            title: userMessage.slice(0, 30) + (userMessage.length > 30 ? "..." : ""),
            agentType
          }
        });
        currentId = newConv.id;
        setConversationId(currentId);
        
        // Invalidate lists since we created a new conv
        queryClient.invalidateQueries({ queryKey: getGetRecentConversationsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetAgentStatsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListAnthropicConversationsQueryKey() });
      }

      // Optimistically add user message if we wanted to, but we'll rely on the server refresh
      
      const response = await fetch(`/api/anthropic/conversations/${currentId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: userMessage }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to send message");
      }
      
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.done) break;
              if (data.content) {
                assistantContent += data.content;
                setStreamingContent(assistantContent);
              }
            } catch {}
          }
        }
      }
      
      // Refresh messages after stream
      await queryClient.invalidateQueries({ queryKey: getListAnthropicMessagesQueryKey(currentId) });
      
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsStreaming(false);
      setStreamingContent("");
    }
  };

  return (
    <div className="flex flex-col h-full bg-background relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-background to-background pointer-events-none" />
      
      <div className="flex-1 overflow-y-auto p-4 md:p-8 z-10" ref={scrollRef}>
        <div className="max-w-3xl mx-auto space-y-6">
          
          {/* Welcome Message */}
          <div className="flex gap-4 items-start">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30 shrink-0">
              <Bot className="w-5 h-5 text-primary" />
            </div>
            <Card className="bg-card border-border shadow-sm">
              <CardContent className="p-4 text-sm text-card-foreground">
                {welcomeMessage}
              </CardContent>
            </Card>
          </div>

          {/* Messages */}
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-4 items-start ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                msg.role === 'user' ? 'bg-secondary border border-secondary-foreground/10' : 'bg-primary/20 border border-primary/30'
              }`}>
                {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-5 h-5 text-primary" />}
              </div>
              <Card className={`${msg.role === 'user' ? 'bg-secondary text-secondary-foreground' : 'bg-card text-card-foreground'} border-border shadow-sm max-w-[80%]`}>
                <CardContent className="p-4 text-sm whitespace-pre-wrap leading-relaxed">
                  {msg.content}
                </CardContent>
              </Card>
            </div>
          ))}

          {/* Streaming Message */}
          {isStreaming && (
            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30 shrink-0">
                <Bot className="w-5 h-5 text-primary" />
              </div>
              <Card className="bg-card border-border shadow-sm max-w-[80%]">
                <CardContent className="p-4 text-sm whitespace-pre-wrap leading-relaxed flex items-center">
                  {streamingContent}
                  <span className="inline-block w-2 h-4 bg-primary ml-1 animate-pulse" />
                </CardContent>
              </Card>
            </div>
          )}
          
          {isLoadingMessages && conversationId && (
            <div className="flex justify-center p-4">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          )}
          
        </div>
      </div>

      <div className="p-4 border-t border-border bg-card z-10">
        <div className="max-w-3xl mx-auto flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Type your message..."
            className="flex-1 bg-background border-input focus-visible:ring-primary"
            data-testid="input-chat-message"
            disabled={isStreaming}
          />
          <Button 
            onClick={handleSend} 
            disabled={!input.trim() || isStreaming}
            className="shrink-0"
            data-testid="button-send-message"
          >
            {isStreaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
        <div className="text-center mt-2 text-xs text-muted-foreground">
          AI agents can make mistakes. Always verify output.
        </div>
      </div>
    </div>
  );
}

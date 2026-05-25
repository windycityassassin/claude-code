import { useRoute } from "wouter";
import { useGetAnthropicConversation, getGetAnthropicConversationQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, User, ArrowLeft, Loader2, Megaphone, LifeBuoy } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function ConversationDetail() {
  const [, params] = useRoute("/conversations/:id");
  const id = params?.id ? parseInt(params.id, 10) : 0;
  
  const { data: conversation, isLoading, error } = useGetAnthropicConversation(
    id,
    { query: { enabled: !!id, queryKey: getGetAnthropicConversationQueryKey(id) } }
  );

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !conversation) {
    return (
      <div className="flex-1 flex items-center justify-center flex-col gap-4">
        <div className="text-xl font-semibold">Conversation not found</div>
        <Link href="/conversations">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to History
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-background to-background pointer-events-none" />
      
      <div className="h-16 border-b border-border bg-card flex items-center px-6 shrink-0 z-10 gap-4">
        <Link href="/conversations">
          <Button variant="ghost" size="icon" data-testid="btn-back">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h2 className="font-semibold flex items-center gap-2" data-testid="detail-conv-title">
            {conversation.title}
          </h2>
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <Badge variant="outline" className={conversation.agentType === 'marketing' ? 'text-primary border-primary/30' : 'text-blue-500 border-blue-500/30'}>
              {conversation.agentType === 'marketing' ? <Megaphone className="w-3 h-3 mr-1" /> : <LifeBuoy className="w-3 h-3 mr-1" />}
              {conversation.agentType}
            </Badge>
            <span>{new Date(conversation.createdAt).toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 z-10">
        <div className="max-w-3xl mx-auto space-y-6">
          {conversation.messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">
              No messages in this conversation.
            </div>
          ) : (
            conversation.messages.map((msg) => (
              <div key={msg.id} className={`flex gap-4 items-start ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  msg.role === 'user' ? 'bg-secondary border border-secondary-foreground/10' : 
                  (conversation.agentType === 'marketing' ? 'bg-primary/20 border border-primary/30' : 'bg-blue-500/20 border border-blue-500/30')
                }`}>
                  {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className={`w-5 h-5 ${conversation.agentType === 'marketing' ? 'text-primary' : 'text-blue-500'}`} />}
                </div>
                <Card className={`${msg.role === 'user' ? 'bg-secondary text-secondary-foreground' : 'bg-card text-card-foreground'} border-border shadow-sm max-w-[80%]`}>
                  <CardContent className="p-4 text-sm whitespace-pre-wrap leading-relaxed">
                    {msg.content}
                  </CardContent>
                </Card>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

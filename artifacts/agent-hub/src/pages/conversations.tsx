import { useState } from "react";
import { useListAnthropicConversations, getListAnthropicConversationsQueryKey, useDeleteAnthropicConversation } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Megaphone, LifeBuoy, Trash2, Search, Loader2, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

export default function Conversations() {
  const [filterType, setFilterType] = useState<string>("all");
  const [search, setSearch] = useState("");
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const queryParams = filterType !== "all" ? { agentType: filterType } : undefined;
  
  const { data: conversations, isLoading } = useListAnthropicConversations(
    queryParams,
    { query: { queryKey: getListAnthropicConversationsQueryKey(queryParams) } }
  );

  const deleteMutation = useDeleteAnthropicConversation();

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: getListAnthropicConversationsQueryKey() });
      toast({ title: "Deleted", description: "Conversation deleted successfully." });
    } catch (err) {
      toast({ title: "Error", description: "Failed to delete conversation", variant: "destructive" });
    }
  };

  const filteredConversations = conversations?.filter(c => 
    c.title?.toLowerCase().includes(search.toLowerCase()) || !search
  );

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Conversation History</h1>
            <p className="text-muted-foreground text-sm">Review past interactions with all agents.</p>
          </div>
        </div>

        <Card className="bg-card border-border shadow-sm">
          <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search conversations..." 
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                data-testid="input-search-conv"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[180px]" data-testid="select-filter-agent">
                <SelectValue placeholder="All Agents" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Agents</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
                <SelectItem value="support">Support</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="divide-y divide-border">
            {isLoading ? (
              <div className="p-8 flex justify-center text-muted-foreground">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : filteredConversations?.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <p>No conversations found.</p>
              </div>
            ) : (
              filteredConversations?.map((conv) => (
                <div key={conv.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-accent/30 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className={`mt-1 p-2 rounded-full shrink-0 ${conv.agentType === 'marketing' ? 'bg-primary/20 text-primary' : 'bg-blue-500/20 text-blue-500'}`}>
                      {conv.agentType === 'marketing' ? <Megaphone className="w-4 h-4" /> : <LifeBuoy className="w-4 h-4" />}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground flex items-center gap-2" data-testid={`history-conv-title-${conv.id}`}>
                        {conv.title || "Untitled Conversation"}
                        <Badge variant="outline" className={conv.agentType === 'marketing' ? 'text-primary border-primary/30' : 'text-blue-500 border-blue-500/30'}>
                          {conv.agentType}
                        </Badge>
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {new Date(conv.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Link href={`/conversations/${conv.id}`}>
                      <Button variant="outline" size="sm" data-testid={`btn-view-conv-${conv.id}`}>
                        View <ArrowRight className="w-3 h-3 ml-2" />
                      </Button>
                    </Link>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(conv.id)}
                      data-testid={`btn-del-conv-${conv.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

      </div>
    </div>
  );
}

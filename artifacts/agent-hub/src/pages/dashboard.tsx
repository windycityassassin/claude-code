import { useGetAgentStats, useGetRecentConversations, getGetAgentStatsQueryKey, getGetRecentConversationsQueryKey, useHealthCheck, getHealthCheckQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { Megaphone, LifeBuoy, ArrowRight, Activity, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetAgentStats({
    query: { queryKey: getGetAgentStatsQueryKey() }
  });

  const { data: recent, isLoading: recentLoading } = useGetRecentConversations({
    query: { queryKey: getGetRecentConversationsQueryKey() }
  });
  
  const { data: health } = useHealthCheck({
    query: { queryKey: getHealthCheckQueryKey(), refetchInterval: 30000 }
  });

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Command Center</h1>
            <p className="text-muted-foreground mt-1">Monitor and manage your AI testing agents.</p>
          </div>
          <div className="flex items-center gap-2 bg-card border border-border px-3 py-1.5 rounded-full text-sm font-medium">
            <Activity className="w-4 h-4 text-primary" />
            <span className="text-muted-foreground">System Status:</span>
            <span className="text-green-500">{health?.status || 'Online'}</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Conversations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-total-convs">
                {statsLoading ? "-" : stats?.totalConversations || 0}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Messages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-total-msgs">
                {statsLoading ? "-" : stats?.totalMessages || 0}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Marketing Convs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {statsLoading ? "-" : stats?.marketingConversations || 0}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Support Convs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-500">
                {statsLoading ? "-" : stats?.supportConversations || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Agents */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="group hover:border-primary/50 transition-colors bg-card relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center mb-4">
                <Megaphone className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Marketing Agent</CardTitle>
              <CardDescription>
                Sales representative for the AI testing product. Knows pricing, features, and competitive advantages.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/marketing" className="block w-full">
                <Button className="w-full justify-between group-hover:bg-primary" data-testid="btn-start-marketing">
                  Start Conversation
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="group hover:border-blue-500/50 transition-colors bg-card relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent pointer-events-none" />
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center mb-4">
                <LifeBuoy className="w-6 h-6 text-blue-500" />
              </div>
              <CardTitle>Support Agent</CardTitle>
              <CardDescription>
                Technical support specialist available 24/7. Helps users configure tests and debug failures.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/support" className="block w-full">
                <Button variant="secondary" className="w-full justify-between hover:bg-blue-500 hover:text-white" data-testid="btn-start-support">
                  Start Conversation
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Recent Conversations */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Recent Activity</h2>
            <Link href="/conversations">
              <Button variant="ghost" size="sm" className="text-muted-foreground" data-testid="btn-view-all-activity">
                View all
              </Button>
            </Link>
          </div>
          
          <Card>
            <div className="divide-y divide-border">
              {recentLoading ? (
                <div className="p-8 text-center text-muted-foreground">Loading activity...</div>
              ) : recent?.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">No recent conversations.</div>
              ) : (
                recent?.map((conv) => (
                  <div key={conv.id} className="p-4 flex items-center justify-between hover:bg-accent/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-full ${conv.agentType === 'marketing' ? 'bg-primary/20 text-primary' : 'bg-blue-500/20 text-blue-500'}`}>
                        {conv.agentType === 'marketing' ? <Megaphone className="w-4 h-4" /> : <LifeBuoy className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="font-medium" data-testid={`conv-title-${conv.id}`}>{conv.title || "New Conversation"}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {new Date(conv.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <Link href={`/${conv.agentType}`}>
                      <Button variant="ghost" size="icon" title="Continue" data-testid={`btn-continue-conv-${conv.id}`}>
                        <MessageSquare className="w-4 h-4 text-muted-foreground" />
                      </Button>
                    </Link>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
}

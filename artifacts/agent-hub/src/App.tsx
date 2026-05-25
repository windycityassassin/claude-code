import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import MarketingAgent from "@/pages/marketing";
import SupportAgent from "@/pages/support";
import Conversations from "@/pages/conversations";
import ConversationDetail from "@/pages/conversation-detail";
import Layout from "@/components/layout";
import { ThemeProvider } from "@/components/theme-provider";

const queryClient = new QueryClient();

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/marketing" component={MarketingAgent} />
        <Route path="/support" component={SupportAgent} />
        <Route path="/conversations" component={Conversations} />
        <Route path="/conversations/:id" component={ConversationDetail} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;

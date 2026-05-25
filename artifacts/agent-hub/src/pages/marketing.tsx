import { ChatInterface } from "@/components/chat-interface";

export default function MarketingAgent() {
  return (
    <div className="flex flex-col h-full">
      <div className="h-14 border-b border-border bg-card flex items-center px-6 shrink-0">
        <h2 className="font-semibold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          Marketing AI Assistant
        </h2>
      </div>
      <div className="flex-1 overflow-hidden">
        <ChatInterface 
          agentType="marketing"
          welcomeMessage="Hello! I'm your AI sales representative. I can answer any questions you have about our automated AI testing platform, pricing, or how we compare to traditional testing tools. How can I help you today?"
        />
      </div>
    </div>
  );
}

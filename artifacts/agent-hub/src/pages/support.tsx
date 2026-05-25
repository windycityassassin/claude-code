import { ChatInterface } from "@/components/chat-interface";

export default function SupportAgent() {
  return (
    <div className="flex flex-col h-full">
      <div className="h-14 border-b border-border bg-card flex items-center px-6 shrink-0">
        <h2 className="font-semibold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          Technical Support AI
        </h2>
      </div>
      <div className="flex-1 overflow-hidden">
        <ChatInterface 
          agentType="support"
          welcomeMessage="Hi there! I'm your 24/7 technical support specialist. Whether you need help configuring your test suites, understanding a test failure, or integrating our platform with your CI/CD pipeline, I'm here to assist."
        />
      </div>
    </div>
  );
}

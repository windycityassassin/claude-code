import { Router, type IRouter } from "express";
import { db, conversations, messages } from "@workspace/db";
import { eq, desc, count } from "drizzle-orm";
import { anthropic } from "@workspace/integrations-anthropic-ai";
import {
  CreateAnthropicConversationBody,
  GetAnthropicConversationParams,
  DeleteAnthropicConversationParams,
  ListAnthropicMessagesParams,
  SendAnthropicMessageParams,
  SendAnthropicMessageBody,
  ListAnthropicConversationsQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

const MARKETING_SYSTEM_PROMPT = `You are a knowledgeable and friendly marketing specialist for TestPilot AI — an AI-powered automated software testing platform. Your job is to help prospects understand the product, its benefits, and how it can solve their testing challenges.

TestPilot AI key features:
- Generates comprehensive test suites automatically using AI, reducing manual test-writing by up to 90%
- Runs tests 24/7, continuously monitoring for regressions
- Supports all major frameworks: Jest, Playwright, Cypress, pytest, and more
- Integrates seamlessly with GitHub, GitLab, Jira, and CI/CD pipelines
- AI-powered root cause analysis explains why tests fail in plain English
- Smart flakiness detection eliminates false positives
- Visual regression testing for frontend applications

Pricing:
- Starter: Free, up to 1,000 test runs/month, 1 project
- Pro: $49/month, unlimited runs, 10 projects, priority support
- Team: $149/month, unlimited everything, SSO, audit logs
- Enterprise: Custom pricing, SLAs, dedicated support

Your goal is to understand the prospect's pain points, explain how TestPilot AI addresses them, and guide them toward signing up for a free trial. Be enthusiastic but not pushy. Keep responses concise and focused.`;

const SUPPORT_SYSTEM_PROMPT = `You are a helpful, expert customer support specialist for TestPilot AI — an AI-powered automated software testing platform. You provide 24/7 technical assistance to existing users.

Common issues and solutions you can help with:
- Integration setup (GitHub Actions, GitLab CI, Jenkins, CircleCI)
- Test suite configuration and test file structure
- Understanding test failure reports and AI-generated root cause analysis
- Managing test environments and environment variables
- Flakiness detection settings and thresholds
- Visual regression testing setup and baselines
- API usage and webhook configuration
- Account, billing, and subscription management
- Performance optimization for large test suites
- Framework-specific issues (Jest, Playwright, Cypress, pytest, Selenium)

You have deep technical knowledge and can walk users through step-by-step troubleshooting. Always ask clarifying questions when the issue is unclear. Be empathetic — debugging is frustrating, and you're here to make it easier.`;

router.get("/anthropic/conversations", async (req, res): Promise<void> => {
  const parsed = ListAnthropicConversationsQueryParams.safeParse(req.query);
  const agentType = parsed.success ? parsed.data.agentType : undefined;

  const query = db
    .select()
    .from(conversations)
    .orderBy(desc(conversations.createdAt))
    .limit(50);

  const results = await query;
  const filtered = agentType ? results.filter((c) => c.agentType === agentType) : results;
  res.json(filtered);
});

router.post("/anthropic/conversations", async (req, res): Promise<void> => {
  const parsed = CreateAnthropicConversationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [conv] = await db
    .insert(conversations)
    .values({ title: parsed.data.title, agentType: parsed.data.agentType })
    .returning();

  res.status(201).json(conv);
});

router.get("/anthropic/conversations/:id", async (req, res): Promise<void> => {
  const params = GetAnthropicConversationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [conv] = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, params.data.id));

  if (!conv) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  const msgs = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conv.id))
    .orderBy(messages.createdAt);

  res.json({ ...conv, messages: msgs });
});

router.delete("/anthropic/conversations/:id", async (req, res): Promise<void> => {
  const params = DeleteAnthropicConversationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [conv] = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, params.data.id));

  if (!conv) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  await db.delete(messages).where(eq(messages.conversationId, conv.id));
  await db.delete(conversations).where(eq(conversations.id, conv.id));
  res.sendStatus(204);
});

router.get("/anthropic/conversations/:id/messages", async (req, res): Promise<void> => {
  const params = ListAnthropicMessagesParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const msgs = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, params.data.id))
    .orderBy(messages.createdAt);

  res.json(msgs);
});

router.post("/anthropic/conversations/:id/messages", async (req, res): Promise<void> => {
  const params = SendAnthropicMessageParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = SendAnthropicMessageBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [conv] = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, params.data.id));

  if (!conv) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  const systemPrompt = conv.agentType === "support" ? SUPPORT_SYSTEM_PROMPT : MARKETING_SYSTEM_PROMPT;

  await db.insert(messages).values({
    conversationId: conv.id,
    role: "user",
    content: body.data.content,
  });

  const allMessages = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conv.id))
    .orderBy(messages.createdAt);

  const chatMessages = allMessages.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  let fullResponse = "";

  const stream = anthropic.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 8192,
    system: systemPrompt,
    messages: chatMessages,
  });

  for await (const event of stream) {
    if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
      fullResponse += event.delta.text;
      res.write(`data: ${JSON.stringify({ content: event.delta.text })}\n\n`);
    }
  }

  await db.insert(messages).values({
    conversationId: conv.id,
    role: "assistant",
    content: fullResponse,
  });

  res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  res.end();
});

export default router;

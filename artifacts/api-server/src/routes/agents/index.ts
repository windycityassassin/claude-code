import { Router, type IRouter } from "express";
import { db, conversations, messages } from "@workspace/db";
import { count, desc, eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/agents/stats", async (_req, res): Promise<void> => {
  const [totalConvRow] = await db.select({ count: count() }).from(conversations);
  const [totalMsgRow] = await db.select({ count: count() }).from(messages);

  const allConvs = await db.select().from(conversations);
  const marketingConversations = allConvs.filter((c) => c.agentType === "marketing").length;
  const supportConversations = allConvs.filter((c) => c.agentType === "support").length;

  res.json({
    totalConversations: totalConvRow?.count ?? 0,
    marketingConversations,
    supportConversations,
    totalMessages: totalMsgRow?.count ?? 0,
  });
});

router.get("/agents/recent-conversations", async (_req, res): Promise<void> => {
  const results = await db
    .select()
    .from(conversations)
    .orderBy(desc(conversations.createdAt))
    .limit(10);

  res.json(results);
});

export default router;

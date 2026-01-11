import { pgTable, text, timestamp, uuid, jsonb } from "drizzle-orm/pg-core";

// Knowledge base entries
export const knowledgeBase = pgTable("knowledge_base", {
  id: uuid("id").defaultRandom().primaryKey(),
  content: text("content").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Generated strategies
export const strategies = pgTable("strategies", {
  id: uuid("id").defaultRandom().primaryKey(),
  knowledgeBaseId: uuid("knowledge_base_id").references(() => knowledgeBase.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Generated posts
export const posts = pgTable("posts", {
  id: uuid("id").defaultRandom().primaryKey(),
  strategyId: uuid("strategy_id").references(() => strategies.id),
  content: text("content").notNull(),
  platform: text("platform"), // e.g., 'instagram', 'facebook', 'linkedin'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Agent sessions/runs
export const agentRuns = pgTable("agent_runs", {
  id: uuid("id").defaultRandom().primaryKey(),
  agentName: text("agent_name").notNull(),
  input: jsonb("input"),
  output: jsonb("output"),
  status: text("status").notNull().default("pending"), // pending, running, completed, failed
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

// Type exports
export type KnowledgeBase = typeof knowledgeBase.$inferSelect;
export type NewKnowledgeBase = typeof knowledgeBase.$inferInsert;
export type Strategy = typeof strategies.$inferSelect;
export type NewStrategy = typeof strategies.$inferInsert;
export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
export type AgentRun = typeof agentRuns.$inferSelect;
export type NewAgentRun = typeof agentRuns.$inferInsert;

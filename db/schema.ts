import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const candidateStates = sqliteTable("candidate_states", {
  candidateId: text("candidate_id").primaryKey(),
  state: text("state", { enum: ["verified", "deleted"] }).notNull(),
  updatedAt: text("updated_at").notNull(),
});

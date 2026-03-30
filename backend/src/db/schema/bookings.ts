import { pgTable, uuid, text } from "drizzle-orm/pg-core";
import { barbers } from "./barbers.js";

export const bookings = pgTable("bookings", {
  id: uuid("id").defaultRandom().primaryKey(),
  barberId: uuid("barberId")
    .notNull()
    .references(() => barbers.id, { onDelete: "cascade", onUpdate: "cascade" }),
  email: text("email").notNull(),
  date: text("date").notNull(),
  time: text("time").notNull(),
});

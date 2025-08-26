import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    image: v.optional(v.string()),
    clerkId: v.string(),
  }).index("by_clerk_id", ["clerkId"]), // query the user quickly with the clerkId

  plans: defineTable({
    userId: v.id("users"), // typed foreign key
    name: v.string(),

    // legacy fitness fields (can repurpose or remove if unused)
    workoutPlan: v.object({
      schedule: v.array(v.string()),
      exercises: v.array(
        v.object({
          day: v.string(),
          routines: v.array(
            v.object({
              name: v.string(),
              sets: v.optional(v.number()),
              reps: v.optional(v.number()),
              duration: v.optional(v.string()),
              description: v.optional(v.string()),
              exercises: v.optional(v.array(v.string())),
            })
          ),
        })
      ),
    }),

    dietPlan: v.object({
      dailyCalories: v.number(),
      meals: v.array(
        v.object({
          name: v.string(),
          foods: v.array(v.string()),
        })
      ),
    }),

    // new mental-health–focused plan
    wellbeingPlan: v.object({
      focusArea: v.string(), // e.g., "Stress Management"
      dailyGoals: v.optional(v.array(v.string())), // actionable steps
      weeklyGoals: v.optional(v.array(v.string())),
      resources: v.optional(v.array(v.string())), // helpful links
      notes: v.optional(v.string()), // reflections
    }),

    isActive: v.boolean(),
  })
    .index("by_user_id", ["userId"])
    .index("by_active", ["isActive"]),
});

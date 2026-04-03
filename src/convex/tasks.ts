import { v } from 'convex/values';

import { mutation, query } from './_generated/server';

export const get = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query('tasks').order('desc').collect();
  },
});

export const add = mutation({
  args: { text: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.insert('tasks', { text: args.text, isCompleted: false });
  },
});

export const toggle = mutation({
  args: { id: v.id('tasks') },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.id);
    if (!task) return;
    await ctx.db.patch(args.id, { isCompleted: !task.isCompleted });
  },
});

export const remove = mutation({
  args: { id: v.id('tasks') },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

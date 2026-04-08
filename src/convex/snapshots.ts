import { v } from 'convex/values';

import { mutation, query } from './_generated/server';

// ---------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------

export const createSession = mutation({
  args: {
    name: v.string(),
    language: v.string(),
  },
  handler: async (ctx, args) => {
    const sessionId = await ctx.db.insert('sessions', {
      name: args.name,
      language: args.language,
    });
    return sessionId;
  },
});

export const getSessions = query({
  args: {},
  handler: async (ctx) => {
    const sessions = await ctx.db.query('sessions').order('desc').take(100);

    // Attach the snapshot count to each session
    const withCounts = await Promise.all(
      sessions.map(async (session) => {
        // Grab the last snapshot to find the highest index
        const last = await ctx.db
          .query('snapshots')
          .withIndex('by_session', (q) => q.eq('sessionId', session._id))
          .order('desc')
          .first();
        return {
          ...session,
          snapshotCount: last ? last.snapshotIndex + 1 : 0,
        };
      }),
    );

    return withCounts;
  },
});

export const getSession = query({
  args: { sessionId: v.id('sessions') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.sessionId);
  },
});

// ---------------------------------------------------------------------------
// Snapshots
// ---------------------------------------------------------------------------

/**
 * Saves a snapshot for a session.
 * Deduplication: if the content is identical to the most-recent snapshot for
 * this session the write is skipped and `null` is returned. This keeps storage
 * lean without requiring any diff/CRDT machinery.
 */
export const saveSnapshot = mutation({
  args: {
    sessionId: v.id('sessions'),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    // Find the current last snapshot for this session
    const last = await ctx.db
      .query('snapshots')
      .withIndex('by_session', (q) => q.eq('sessionId', args.sessionId))
      .order('desc')
      .first();

    // Skip if nothing changed
    if (last && last.content === args.content) {
      return null;
    }

    const nextIndex = last ? last.snapshotIndex + 1 : 0;

    const id = await ctx.db.insert('snapshots', {
      sessionId: args.sessionId,
      content: args.content,
      snapshotIndex: nextIndex,
    });

    return id;
  },
});

/**
 * Returns all snapshots for a session in ascending order (index 0 first).
 * We cap at 500 snapshots — plenty for a typical recording session.
 */
export const getSnapshots = query({
  args: { sessionId: v.id('sessions') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('snapshots')
      .withIndex('by_session', (q) => q.eq('sessionId', args.sessionId))
      .order('asc')
      .take(500);
  },
});

/**
 * Delete an entire session and all its snapshots.
 * Processes in batches to stay within Convex transaction limits.
 */
export const deleteSession = mutation({
  args: { sessionId: v.id('sessions') },
  handler: async (ctx, args) => {
    // Delete snapshots in a single batch (500 max, see getSnapshots cap)
    const snaps = await ctx.db
      .query('snapshots')
      .withIndex('by_session', (q) => q.eq('sessionId', args.sessionId))
      .take(500);

    for (const snap of snaps) {
      await ctx.db.delete(snap._id);
    }

    await ctx.db.delete(args.sessionId);
  },
});

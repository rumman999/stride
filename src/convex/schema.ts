// Convex's codegen is hardwired to read this exact filename.
// Even if you export `defineSchema()` from another file, the generated
// dataModel.d.ts / api.d.ts won't pick it up — schema MUST live here.
import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  tasks: defineTable({
    text: v.string(),
    isCompleted: v.boolean(),
  }),

  // A recording session groups snapshots together.
  sessions: defineTable({
    name: v.string(),
    language: v.string(), // e.g. 'typescript', 'javascript', 'python'
  }),

  // Each snapshot is a full copy of the textarea content at a point in time.
  //
  // Why full snapshots instead of diffs / CRDT?
  //  - shiki-magic-move needs the full source text at every step — full
  //    snapshots slot in directly, no reconstruction pass needed.
  //  - Deduplication (skip identical content) keeps storage lean.
  //  - CRDTs are for concurrent multi-author editing — total overkill here.
  //  - Diff-based storage would require sequential reconstruction, adding
  //    latency and complexity for the viewer with no real benefit at this scale.
  snapshots: defineTable({
    sessionId: v.id('sessions'),
    content: v.string(),
    snapshotIndex: v.number(), // monotonically increasing within a session
  }).index('by_session', ['sessionId', 'snapshotIndex']),
});

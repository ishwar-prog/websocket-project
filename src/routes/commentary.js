import { Router } from 'express';
import { matchIdParamSchema } from '../validation/matches.js';
import { createCommentarySchema, listCommentaryQuerySchema } from '../validation/commentary.js';
import { commentary } from '../db/schema.js';
import { db } from '../db/db.js';
import { eq, desc } from 'drizzle-orm';

const MAX_LIMIT = 100;

export const commentaryRouter = Router({ mergeParams: true });

commentaryRouter.get('/', async (req, res) => {
  // Validate params
  const parsedParams = matchIdParamSchema.safeParse(req.params);

  if (!parsedParams.success) {
    return res.status(400).json({ 
      error: 'Invalid match ID.', 
      details: JSON.stringify(parsedParams.error) 
    });
  }

  // Validate query
  const parsedQuery = listCommentaryQuerySchema.safeParse(req.query);

  if (!parsedQuery.success) {
    return res.status(400).json({ 
      error: 'Invalid query parameters.', 
      details: parsedQuery.error.issues
    });
  }

  const matchId = parsedParams.data.id;
  const limit = Math.min(parsedQuery.data.limit || 100, MAX_LIMIT);

  try {
    const results = await db
      .select()
      .from(commentary)
      .where(eq(commentary.matchId, matchId))
      .orderBy(desc(commentary.createdAt))
      .limit(limit);

    res.status(200).json({ data: results });
  } catch (e) {
    console.error('Failed to fetch commentary:', e);
    res.status(500).json({ error: 'Failed to fetch commentary.' });
  }
});

commentaryRouter.post('/', async (req, res) => {
  const parsedParams = matchIdParamSchema.safeParse(req.params);

  if (!parsedParams.success) {
    return res.status(400).json({ 
      error: 'Invalid match ID.', 
      details: JSON.stringify(parsedParams.error) 
    });
  }

  const parsedBody = createCommentarySchema.safeParse(req.body);

  if (!parsedBody.success) {
    return res.status(400).json({ 
      error: 'Invalid payload.', 
      details: JSON.stringify(parsedBody.error) 
    });
  }

  const matchId = parsedParams.data.id;
  const { minutes, sequence, period, eventType, actor, team, message, metadata, tags } = parsedBody.data;

  try {
    const [result] = await db.insert(commentary).values({
      matchId:parsedParams.data.id,
      minutes,
      sequence,
      period,
      eventType,
      actor,
      team,
      message,
      metadata,
      tags,
    }).returning();

    res.status(201).json({ data: result });
  } catch (e) {
    console.error('Failed to create commentary:', e);
    res.status(500).json({ error: 'Failed to create commentary.' });
  }
});
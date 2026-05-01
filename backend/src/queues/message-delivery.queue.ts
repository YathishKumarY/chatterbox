import { Queue, Worker } from 'bullmq';
import type { Server } from 'socket.io';
import { getRedisClient } from '../config/redis.js';
import { logger } from '../utils/logger.js';
import * as presenceService from '../services/presence.service.js';

interface DeliveryJob {
  recipientId: string;
  message: any;
}

const QUEUE_NAME = 'message-delivery';

let queue: Queue<DeliveryJob> | null = null;
let worker: Worker<DeliveryJob> | null = null;

function getQueue(): Queue<DeliveryJob> | null {
  if (queue) return queue;
  const redis = getRedisClient();
  if (!redis) return null;

  queue = new Queue<DeliveryJob>(QUEUE_NAME, {
    connection: redis.duplicate(),
  });
  return queue;
}

export async function enqueueDelivery(recipientId: string, message: any) {
  const q = getQueue();
  if (!q) return;

  await q.add('deliver', { recipientId, message }, {
    attempts: 5,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: true,
    removeOnFail: 50,
  });
}

export function startDeliveryWorker(io: Server) {
  const redis = getRedisClient();
  if (!redis) return;

  worker = new Worker<DeliveryJob>(
    QUEUE_NAME,
    async (job) => {
      const { recipientId, message } = job.data;
      const socketIds = await presenceService.getUserSocketIds(recipientId);

      if (socketIds.length === 0) {
        throw new Error('Recipient still offline');
      }

      for (const sid of socketIds) {
        io.to(sid).emit('message:new', message);
      }
    },
    {
      connection: redis.duplicate(),
      concurrency: 10,
    },
  );

  worker.on('failed', (job, err) => {
    if (job && job.attemptsMade >= (job.opts.attempts || 5)) {
      logger.warn(
        { jobId: job.id, recipientId: job.data.recipientId, err: err?.message },
        'Delivery exhausted retries, will be fetched on reconnect',
      );
    } else {
      logger.debug({ jobId: job?.id, err: err?.message }, 'Delivery attempt failed, will retry');
    }
  });
}

export async function drainUserQueue(userId: string, io: Server) {
  const q = getQueue();
  if (!q) return;

  const waiting = await q.getWaiting();
  const delayed = await q.getDelayed();
  const jobs = [...waiting, ...delayed].filter(j => j.data.recipientId === userId);

  for (const job of jobs) {
    const socketIds = await presenceService.getUserSocketIds(userId);
    for (const sid of socketIds) {
      io.to(sid).emit('message:new', job.data.message);
    }
    await job.remove();
  }
}

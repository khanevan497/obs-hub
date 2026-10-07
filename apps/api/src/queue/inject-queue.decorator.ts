import { Inject } from '@nestjs/common';

export const getQueueToken = (name: string) => `BULLMQ_QUEUE_${name.toUpperCase()}`;

export const InjectQueue = (name: string) => Inject(getQueueToken(name));

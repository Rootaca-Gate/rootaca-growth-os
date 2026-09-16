import type { IncomingMessage, ServerResponse } from 'node:http';
import express from 'express';
import { createApp } from '../src/create-app';

const server = express();
let ready: Promise<void> | undefined;

async function ensureReady(): Promise<void> {
  await createApp(server);
}

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    ready ??= ensureReady();
    await ready;
    server(req, res);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown bootstrap error';
    console.error('ROOTACA API bootstrap failed', error);
    ready = undefined;
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ statusCode: 500, message }));
    }
  }
}

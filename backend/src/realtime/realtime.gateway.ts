import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

const allowedOrigins: (RegExp | string)[] = [
  /http:\/\/localhost:\d+/,
  /http:\/\/127\.0\.0\.1:\d+/,
];
if (process.env.FRONTEND_URL && process.env.FRONTEND_URL.trim().length > 0) {
  allowedOrigins.push(process.env.FRONTEND_URL.trim());
} else {
  allowedOrigins.push('https://konsultant-online.vercel.app');
}

@WebSocketGateway({
  cors: {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      if (!origin) return callback(null, true);
      for (const rule of allowedOrigins) {
        if (typeof rule === 'string' && origin === rule) return callback(null, true);
        if (rule instanceof RegExp && rule.test(origin)) return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'), false);
    },
    credentials: true,
  },
})
export class RealtimeGateway {
  @WebSocketServer()
  server!: Server;

  async afterInit(server: Server) {
    const url = process.env.REDIS_URL || process.env.REDIS_URI;
    if (!url) return;
    try {
      // Lazy import to avoid type issues when package isn't installed locally
      const { createAdapter } = await import('@socket.io/redis-adapter' as any);
      const { createClient } = await import('redis' as any);
      const pub = createClient({ url }) as any;
      const sub = pub.duplicate();
      await Promise.all([pub.connect(), sub.connect()]);
      server.adapter(createAdapter(pub, sub));
      // eslint-disable-next-line no-console
      console.log('[Realtime] Redis adapter enabled');
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('[Realtime] Redis adapter init failed', e);
    }
  }

  @SubscribeMessage('join')
  handleJoin(@ConnectedSocket() client: Socket, @MessageBody() data: { roomId: string }) {
    const room = this.server.sockets.adapter.rooms.get(data.roomId);
    const size = room ? room.size : 0;
    if (size >= 2) {
      client.emit('room:full');
      return;
    }
    client.join(data.roomId);
    const joinedRoom = this.server.sockets.adapter.rooms.get(data.roomId);
    const members = joinedRoom ? Array.from(joinedRoom) : [];
    if (members.length === 2) {
      const [a, b] = members;
      // Wyznacz inicjatora i stronę odpowiadającą
      this.server.to(a).emit('room:ready', { initiator: true });
      this.server.to(b).emit('room:ready', { initiator: false });
    } else {
      // poinformuj obecnych, że ktoś dołączył (dla UI)
      client.to(data.roomId).emit('peer:joined');
    }
  }

  @SubscribeMessage('signal')
  handleSignal(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; payload: any },
  ) {
    client.to(data.roomId).emit('signal', data.payload);
  }

  @SubscribeMessage('leave')
  handleLeave(@ConnectedSocket() client: Socket, @MessageBody() data: { roomId: string }) {
    client.leave(data.roomId);
    client.to(data.roomId).emit('peer:left');
  }
}



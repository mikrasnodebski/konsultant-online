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

  @SubscribeMessage('join')
  handleJoin(@ConnectedSocket() client: Socket, @MessageBody() data: { roomId: string }) {
    client.join(data.roomId);
    client.to(data.roomId).emit('peer:joined');
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



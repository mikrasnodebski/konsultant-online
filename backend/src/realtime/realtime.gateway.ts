import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: [/http:\/\/localhost:\d+/, /http:\/\/127\.0\.0\.1:\d+/],
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



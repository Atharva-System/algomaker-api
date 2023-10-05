/* eslint-disable @typescript-eslint/no-unused-vars */
import { WebSocketGateway, WebSocketServer, OnGatewayDisconnect, OnGatewayConnection, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  onModuleInit() {
    // Start your WebSocket server here
    console.log('Socket Started')
  }

  handleConnection(client: Socket) {
    // Handle connection event
    console.log('socket connected')
  }

  handleDisconnect(client: Socket) {
    // Handle disconnection event
    console.log('socket disconnected')

  }

  @SubscribeMessage('events')
  handleEvents(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
    console.log('Received events:', data);
  }

  // sendData(data: object) {
  //   this.server.emit('ticks', data);
  // }

  @SubscribeMessage('shubham')
  handleTicks(@MessageBody() data: any, @ConnectedSocket() client?: Socket) {
    client.emit('dipen', data);
  }
}

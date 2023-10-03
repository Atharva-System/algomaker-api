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
    // This method will be called when the module is initialized
    // Start your WebSocket server here
    console.log('Socket Started')
  }

  handleConnection(client: Socket) {
    // Handle connection event
    console.log('socket connected', client)
  }

  handleDisconnect(client: Socket) {
    // Handle disconnection event
    console.log('socket disconnected')

  }

  @SubscribeMessage('events')
  handleEvents(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
    console.log('Received events:', data);
  }

  @SubscribeMessage('exception')
  handleException(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
    console.log('Received exception:', data);
  }

  @SubscribeMessage('shubham')
  handleTicks(@MessageBody() data: any, @ConnectedSocket() client?: Socket) {
    console.log(data, 'datatatatatattata+++');
    this.server.emit('dipen', data);
  }
}

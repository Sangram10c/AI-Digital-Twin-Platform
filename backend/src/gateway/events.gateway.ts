import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

/**
 * Events Gateway
 *
 * Main WebSocket gateway for real-time communication.
 * Handles client connections and event broadcasting.
 */
@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  },
})
export class EventsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  afterInit(_server: Server) {
    console.log('WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  /**
   * Broadcast an event to all connected clients.
   */
  broadcast(event: string, data: unknown) {
    this.server.emit(event, data);
  }

  /**
   * Send an event to a specific room.
   */
  sendToRoom(room: string, event: string, data: unknown) {
    this.server.to(room).emit(event, data);
  }
}

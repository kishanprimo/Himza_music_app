import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';
import { socketConfig } from '../config';
import { logger } from '../utils';

interface ChatSocket extends Socket {
  chatBotId?: string;
  visitorId?: string;
  agentId?: string;
}

export const initializeSocketIO = (server: HTTPServer): void => {
  const io = new Server(server, socketConfig);

  // Middleware for authentication and connection setup
  io.use(async (socket: ChatSocket, next) => {
    const chatBotId = socket.handshake.auth.chatBotId;
    const visitorId = socket.handshake.auth.visitorId;
    const agentId = socket.handshake.auth.agentId;

    if (!chatBotId) {
      return next(new Error('Chat Bot ID not provided'));
    }

    // Store connection identifiers
    socket.chatBotId = chatBotId;
    socket.visitorId = visitorId;
    socket.agentId = agentId;

    next();
  });

  io.on('connection', async (socket: ChatSocket) => {
    logger.info(`New socket connection: ${socket.id}`);

    // Join appropriate rooms
    if (socket.chatBotId) {
      socket.join(`chatbot:${socket.chatBotId}`);
    }

    if (socket.agentId) {

      // Handle disconnection
      socket.on('disconnect', async () => {
        logger.info(`Socket disconnected: ${socket.id}`);


      });
    }
  });
};
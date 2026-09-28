import { io } from 'socket.io-client';

let socket = null;

export const getSocket = () => {
  if (socket && socket.connected) {
    return socket;
  }

  const token = localStorage.getItem('token');
  const serverUrl = window.location.origin;

  if (!socket) {
    socket = io(serverUrl, {
      auth: { token },
      query: { token },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });
  } else if (!socket.connected && token) {
    socket.auth = { token };
    socket.io.opts.query = { token };
    socket.connect();
  }

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

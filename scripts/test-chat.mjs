import { io } from 'socket.io-client';

const API = 'http://localhost:3001';

async function login(email, password) {
  const res = await fetch(`${API}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(`Login failed: ${res.status}`);
  return res.json();
}

async function getOrCreateRoom(token) {
  const list = await fetch(`${API}/api/rooms`, {
    headers: { Authorization: `Bearer ${token}` },
  }).then((r) => r.json());

  if (Array.isArray(list) && list.length > 0) return list[0];

  const created = await fetch(`${API}/api/rooms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ name: 'Chat Test Room' }),
  }).then((r) => r.json());
  return created;
}

async function joinByInvite(token, inviteCode) {
  return fetch(`${API}/api/rooms/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ inviteCode }),
  }).then((r) => r.json());
}

function connectAs(name, token, roomId) {
  return new Promise((resolve) => {
    const socket = io(`${API}/ws`, {
      auth: { token },
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      console.log(`[${name}] connected ${socket.id}`);
      socket.emit('room:join', { roomId });
    });

    socket.on('room:joined', (data) => {
      console.log(`[${name}] joined room ${data.roomId}`);
      resolve(socket);
    });

    socket.on('message:new', (msg) => {
      console.log(`[${name}] <- ${msg.author?.fullName}: ${msg.content}`);
    });

    socket.on('presence:join', (e) => console.log(`[${name}] presence:join`, e));
    socket.on('typing:start', (e) => console.log(`[${name}] typing:start`, e));

    socket.on('connect_error', (err) => {
      console.error(`[${name}] connect_error:`, err.message);
    });
    socket.on('error', (err) => console.error(`[${name}] error:`, err));
  });
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const alice = await login('test@example.com', 'password123');
  const bob = await login('bob@example.com', 'password123');

  const room = await getOrCreateRoom(alice.accessToken);
  console.log('Room:', room.id, room.inviteCode);

  // Убедимся, что Bob в комнате
  await joinByInvite(bob.accessToken, room.inviteCode).catch(() => {});

  const aliceSocket = await connectAs('alice', alice.accessToken, room.id);
  const bobSocket = await connectAs('bob', bob.accessToken, room.id);

  await wait(300);

  console.log('\n>>> Alice sends a message');
  aliceSocket.emit('message:send', { roomId: room.id, content: 'Hi Bob!' });

  await wait(500);

  console.log('\n>>> Bob starts typing');
  bobSocket.emit('typing:start', { roomId: room.id });

  await wait(500);

  console.log('\n>>> Bob sends a reply');
  bobSocket.emit('typing:stop', { roomId: room.id });
  bobSocket.emit('message:send', { roomId: room.id, content: 'Hi Alice! 👋' });

  await wait(800);

  // Подтянем историю через REST
  const history = await fetch(`${API}/api/rooms/${room.id}/messages?limit=10`, {
    headers: { Authorization: `Bearer ${alice.accessToken}` },
  }).then((r) => r.json());

  console.log('\n>>> History from REST:');
  history.items.forEach((m) => console.log(`  ${m.author?.fullName}: ${m.content}`));

  aliceSocket.close();
  bobSocket.close();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

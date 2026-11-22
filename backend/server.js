const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

const activeSessions = new Map();

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'NexusChat SKMD Backend', activeSockets: activeSessions.size });
});

app.get('/api/messages/:chatId', async (req, res) => {
  const { chatId } = req.params;
  const area = req.query.area || 'All Areas';
  const rows = await db.getMessages(chatId, area);
  res.json(rows);
});

io.on('connection', (socket) => {
  socket.on('auth:login', async ({ name, phone, role, devKey, country, state }) => {
    if (await db.isSuspended(phone)) {
      return socket.emit('auth:error', { message: 'This account is suspended.' });
    }
    const isDeveloper = role === 'developer' && devKey === (process.env.DEV_KEY || '123456');
    const session = {
      socketId: socket.id,
      name: name || 'SKMD User',
      phone: phone || '+91 98480 12345',
      isDeveloper,
      country: country || 'India',
      state: state || 'Telangana'
    };
    activeSessions.set(socket.id, session);
    socket.join(`country:${session.country}`);
    socket.join(`state:${session.country}:${session.state}`);
    socket.emit('auth:success', session);
  });

  socket.on('group:join_area', ({ chatId, area }) => {
    socket.join(`chat:${chatId}:area:${area || 'All Areas'}`);
  });

  socket.on('chat:send', async (payload) => {
    const session = activeSessions.get(socket.id);
    if (!session) return;

    const msg = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      chatId: payload.chatId,
      area: payload.area || 'All Areas',
      senderName: session.name,
      senderPhone: session.phone,
      type: payload.type || 'text',
      text: payload.text,
      ts: Date.now()
    };

    await db.saveMessage(msg);
    io.to(`chat:${msg.chatId}:area:${msg.area}`).emit('chat:message', msg);
  });

  socket.on('chat:delete_both', async ({ chatId, area, id, ts }) => {
    if (Date.now() - ts > 60000) return;
    await db.deleteMessage(id);
    io.to(`chat:${chatId}:area:${area || 'All Areas'}`).emit('chat:deleted', { chatId, id });
  });

  socket.on('developer:broadcast', async ({ country, state, text }) => {
    const session = activeSessions.get(socket.id);
    if (!session || !session.isDeveloper) return;

    const officialMsg = {
      id: 'off_' + Date.now(),
      chatId: 'chat_official',
      area: 'All Areas',
      senderName: 'NexusChat Official ✓',
      senderPhone: 'SYSTEM',
      type: 'official',
      text: `[${country} · ${state}] ${text}`,
      ts: Date.now()
    };

    await db.saveMessage(officialMsg);
    if (country === 'Worldwide') {
      io.emit('official:broadcast', officialMsg);
    } else if (state.startsWith('All ')) {
      io.to(`country:${country}`).emit('official:broadcast', officialMsg);
    } else {
      io.to(`state:${country}:${state}`).emit('official:broadcast', officialMsg);
    }
  });

  socket.on('disconnect', () => {
    activeSessions.delete(socket.id);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`✅ NexusChat Backend running on http://localhost:${PORT}`));

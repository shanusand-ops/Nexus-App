const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'nexuschat-db.json');

function loadData() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const initial = { messages: [], suspended_accounts: [], accounts: [] };
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2));
      return initial;
    }
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch (e) {
    return { messages: [], suspended_accounts: [], accounts: [] };
  }
}

function saveData(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

module.exports = {
  async saveMessage(msg) {
    const data = loadData();
    const record = {
      id: msg.id,
      chatId: msg.chatId,
      area: msg.area || 'All Areas',
      senderName: msg.senderName,
      senderPhone: msg.senderPhone,
      type: msg.type || 'text',
      text: msg.text,
      opened: msg.opened ? 1 : 0,
      ts: msg.ts || Date.now()
    };
    const idx = data.messages.findIndex((m) => m.id === record.id);
    if (idx >= 0) data.messages[idx] = record;
    else data.messages.push(record);
    saveData(data);
  },
  async getMessages(chatId, area = 'All Areas') {
    const data = loadData();
    return data.messages
      .filter((m) => m.chatId === chatId && m.area === area)
      .sort((a, b) => a.ts - b.ts);
  },
  async deleteMessage(id) {
    const data = loadData();
    data.messages = data.messages.filter((m) => m.id !== id);
    saveData(data);
  },
  async markMessageRead(id) {
    const data = loadData();
    const message = data.messages.find((m) => m.id === id);
    if (!message) return false;
    message.opened = 1;
    saveData(data);
    return true;
  },
  async isSuspended(phone) {
    const data = loadData();
    return data.suspended_accounts.some((a) => a.phone === phone);
  },
  async upsertAccount(account) {
    const data = loadData();
    if (!Array.isArray(data.accounts)) data.accounts = [];
    const normalizedPhone = String(account.phone || '').replace(/\D/g, '');
    const idx = data.accounts.findIndex((a) => String(a.phone || '').replace(/\D/g, '') === normalizedPhone);
    if (idx >= 0) data.accounts[idx] = { ...data.accounts[idx], ...account, phone: normalizedPhone };
    else data.accounts.push({ ...account, phone: normalizedPhone, registeredAt: Date.now() });
    saveData(data);
    return data.accounts[idx >= 0 ? idx : data.accounts.length - 1];
  },
  async getAccounts() {
    const data = loadData();
    return data.accounts || [];
  }
};

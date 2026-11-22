import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:4000';

const GLOBAL_USER_DIRECTORY = {
  Worldwide: {
    total: '3,42,900',
    states: { 'All Regions Worldwide': '3,42,900', India: '2,14,850', 'United States': '46,320', 'United Arab Emirates': '28,940', 'United Kingdom': '19,450' }
  },
  India: {
    total: '2,14,850',
    states: { 'All India States': '2,14,850', 'Andhra Pradesh': '48,620', Telangana: '39,410', 'Tamil Nadu': '26,180', Karnataka: '24,950', Maharashtra: '22,340' }
  },
  'United States': {
    total: '46,320',
    states: { 'All US States': '46,320', California: '12,480', Texas: '9,850', 'New Jersey': '8,120' }
  },
  'United Arab Emirates': {
    total: '28,940',
    states: { 'All Emirates': '28,940', Dubai: '16,420', 'Abu Dhabi': '7,890' }
  }
};

const APP_LANGUAGES = [
  { code: 'en', name: 'English', native: 'English' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളം' },
  { code: 'mr', name: 'Marathi', native: 'मराठी' },
  { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা' },
  { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ' }
];

const INITIAL_CHATS = [
  {
    id: 'chat_official',
    title: 'NexusChat Official ✓',
    type: 'official',
    hiddenInVault: false,
    subtitle: 'Verified Global System Announcements',
    unread: 1,
    messages: [
      { id: 'm_off_1', senderName: 'NexusChat Official ✓', senderPhone: 'SYSTEM', area: 'All Areas', type: 'text', text: 'Welcome to NexusChat SKMD Full-Stack! Protected with End-to-End Encryption.', ts: Date.now() - 7200000, starred: true }
    ]
  },
  {
    id: 'chat_admin_hq',
    title: 'SKMD Distribution HQ',
    type: 'admin_group',
    hiddenInVault: false,
    subtitle: 'Multi-Area Isolated Channels · 48 Members',
    members: ['Ramesh Traders (Vijayawada)', 'Sri Lakshmi Stores (Guntur)', 'Balaji Agencies (Narsaraopet)'],
    unread: 2,
    messages: [
      { id: 'm1', senderName: 'SKMD Admin', senderPhone: '+91 98480 12345', area: 'All Areas', type: 'text', text: 'Common price list updated for all branches. Area orders stay strictly private inside each area tab.', ts: Date.now() - 3600000, starred: true },
      { id: 'm2', senderName: 'Ramesh Traders', senderPhone: '+91 98480 22222', area: 'Vijayawada', type: 'text', text: 'Vijayawada Indent: 45 Boxes Oil & 30 Bags Rice needed by 2 PM.', ts: Date.now() - 1800000 },
      { id: 'm3', senderName: 'Sri Lakshmi Stores', senderPhone: '+91 98480 33333', area: 'Guntur', type: 'text', text: 'Guntur Indent: 60 Boxes + invoice copy attached.', ts: Date.now() - 900000 },
      { id: 'm4', senderName: 'Balaji Agencies', senderPhone: '+91 98480 44444', area: 'Narsaraopet', type: 'text', text: 'Narsaraopet Route: Vehicle reached market yard safely.', ts: Date.now() - 600000 }
    ]
  },
  {
    id: 'chat_family',
    title: 'SKMD Family Group ❤️',
    type: 'family_group',
    hiddenInVault: false,
    subtitle: 'Amma, Nanna, Ravi, Priya, You',
    unread: 1,
    messages: [
      { id: 'mf1', senderName: 'Amma', senderPhone: '+91 98480 55555', area: 'All Areas', type: 'text', text: 'Everyone join the evening family voice chat at 8 PM! ❤️', ts: Date.now() - 300000, starred: true }
    ]
  },
  {
    id: 'chat_ramesh',
    title: 'Ramesh Traders (Vijayawada)',
    type: 'direct',
    hiddenInVault: false,
    subtitle: 'Online · Vijayawada Distributor',
    unread: 0,
    messages: [
      { id: 'mr1', senderName: 'Ramesh Traders', senderPhone: '+91 98480 22222', area: 'All Areas', type: 'text', text: 'Sir, please send the UPI QR for yesterday balance ₹24,500.', ts: Date.now() - 120000 }
    ]
  },
  {
    id: 'chat_vault_vip',
    title: 'VIP Audit & Ledger Vault',
    type: 'direct',
    hiddenInVault: true,
    subtitle: 'Hidden Vault Chat · PIN Protected (9999)',
    unread: 0,
    messages: [
      { id: 'mv1', senderName: 'SKMD Admin', senderPhone: '+91 98480 12345', area: 'All Areas', type: 'text', text: 'Confidential Q4 distributor margin sheet stored securely in Vault.', ts: Date.now() - 86400000, starred: true }
    ]
  }
];

export default function App() {
  const socketRef = useRef(null);
  const mediaInputRef = useRef(null);
  const docInputRef = useRef(null);
  const pendingViewOnceRef = useRef(false);

  // Auth & Role Isolation
  const [user, setUser] = useState(null);
  const [loginRole, setLoginRole] = useState('user');
  const [name, setName] = useState('SKMD Admin');
  const [phone, setPhone] = useState('+91 98480 12345');
  const [devId, setDevId] = useState('DEV-OWNER-01');
  const [devKey, setDevKey] = useState('123456');

  // UI Accessibility & Security Modes
  const [largeText, setLargeText] = useState(false);
  const [dayTheme, setDayTheme] = useState(false);
  const [securityMode, setSecurityMode] = useState('single');
  const [appLocked, setAppLocked] = useState(false);
  const [lockPinInput, setLockPinInput] = useState('');
  const [toast, setToast] = useState('');

  // Navigation, Search, Vault, Multi-Area Groups
  const [sidebarTab, setSidebarTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [vaultUnlocked, setVaultUnlocked] = useState(false);
  const [chats, setChats] = useState(INITIAL_CHATS);
  const [activeChatId, setActiveChatId] = useState('chat_admin_hq');
  const [areas, setAreas] = useState(['All Areas', 'Vijayawada', 'Guntur', 'Narsaraopet']);
  const [activeArea, setActiveArea] = useState('All Areas');
  const [inputText, setInputText] = useState('');

  // Popovers & Modals
  const [showTopMenu, setShowTopMenu] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showEmojiPopover, setShowEmojiPopover] = useState(false);
  const [emojiTab, setEmojiTab] = useState('emojis');
  const [activeModal, setActiveModal] = useState(null);
  const [settingsTab, setSettingsTab] = useState('profile');
  const [selectedLang, setSelectedLang] = useState('te');
  const [gmailBackup, setGmailBackup] = useState('skmd.hq@gmail.com');
  const [aboutText, setAboutText] = useState('SKMD Wholesale & Distribution · Fast Dispatch');

  // Voice Room & WebRTC Call
  const [voiceRoomActive, setVoiceRoomActive] = useState(false);
  const [voiceMuted, setVoiceMuted] = useState(false);
  const [activeCall, setActiveCall] = useState(null);
  const [lightboxMedia, setLightboxMedia] = useState(null);

  // Status Updates
  const [statuses, setStatuses] = useState([
    { id: 'st1', author: 'SKMD Admin (You)', time: 'Today, 09:15 AM', text: 'Fresh morning dispatch started for Vijayawada & Guntur routes! 🚚' },
    { id: 'st2', author: 'Ramesh Traders (Vijayawada)', time: 'Today, 08:40 AM', text: 'Morning stock received in full. Ready for weekend orders.' }
  ]);
  const [newStatusText, setNewStatusText] = useState('');

  // Super-Admin Developer Console State
  const [devTab, setDevTab] = useState('broadcast');
  const [devCountry, setDevCountry] = useState('India');
  const [devState, setDevState] = useState('Andhra Pradesh');
  const [devBroadcastText, setDevBroadcastText] = useState('');
  const [systemBannerEnabled, setSystemBannerEnabled] = useState(false);
  const [systemBannerText, setSystemBannerText] = useState('NexusChat v2.4 Update Available — Please update for enhanced encryption & speed.');
  const [suspendedList, setSuspendedList] = useState(['+91 91111 22222']);
  const [banInput, setBanInput] = useState('');
  const [devLogs, setDevLogs] = useState([
    { id: 'l1', region: 'India · Andhra Pradesh', reach: '48,620 Users', text: 'Welcome to NexusChat SKMD Enterprise v2.4!', time: 'Yesterday, 09:30 AM', readRate: '94%' }
  ]);

  // Modal Form States
  const [newAreaName, setNewAreaName] = useState('');
  const [newMemberName, setNewMemberName] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupType, setNewGroupType] = useState('admin_group');
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [upiAmount, setUpiAmount] = useState('24500');
  const [pollQuestion, setPollQuestion] = useState('Morning Vehicle Dispatch Slot?');
  const [scheduleText, setScheduleText] = useState('Reminder: Submit tomorrow stock indent before 8 PM.');

  const notify = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3200);
  };

  useEffect(() => {
    const socket = io(SOCKET_URL);
    socketRef.current = socket;

    socket.on('auth:success', (session) => {
      setUser(session);
      notify('Connected to NexusChat Live Backend!');
    });
    socket.on('auth:error', (err) => notify(err.message));

    socket.on('chat:message', (msg) => {
      setChats((prev) =>
        prev.map((c) => {
          if (c.id !== msg.chatId) return c;
          if (c.messages.some((m) => m.id === msg.id)) return c;
          return { ...c, messages: [...c.messages, msg] };
        })
      );
    });

    socket.on('chat:deleted', ({ chatId, id }) => {
      setChats((prev) =>
        prev.map((c) => (c.id === chatId ? { ...c, messages: c.messages.filter((m) => m.id !== id) } : c))
      );
    });

    socket.on('official:broadcast', (msg) => {
      setChats((prev) =>
        prev.map((c) => (c.id === 'chat_official' ? { ...c, unread: c.unread + 1, messages: [...c.messages, msg] } : c))
      );
    });

    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    if (!user || !socketRef.current) return;
    socketRef.current.emit('group:join_area', { chatId: activeChatId, area: activeArea });
  }, [user, activeChatId, activeArea]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (suspendedList.includes(phone.trim())) {
      return notify('Access Denied: Number suspended by Super-Admin.');
    }
    const payload = {
      name: loginRole === 'developer' ? `NexusChat Developer (${devId})` : name,
      phone,
      role: loginRole,
      devKey,
      country: 'India',
      state: 'Telangana'
    };
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('auth:login', payload);
    } else {
      // Offline fallback if backend server isn't started yet
      const isDev = loginRole === 'developer' && devKey === '123456';
      setUser({ ...payload, isDeveloper: isDev });
      notify('Logged in (Start START_BACKEND.bat for multi-device live sync)');
    }
  };

  const toggleLargeText = () => {
    const next = !largeText;
    setLargeText(next);
    document.documentElement.classList.toggle('large-text-mode', next);
    notify(next ? 'Large Clear Text Enabled (A+)' : 'Standard Clear Text Restored');
  };

  const toggleTheme = () => {
    const next = !dayTheme;
    setDayTheme(next);
    document.documentElement.classList.toggle('light-day-theme', next);
    notify(next ? 'Daylight High-Visibility Mode On' : 'Dark Sleek Mode On');
  };

  const handleSearchChange = (val) => {
    if (val.trim() === '9999') {
      setVaultUnlocked(true);
      setSearchQuery('');
      notify('Secret Hidden Vault Unlocked!');
      return;
    }
    setSearchQuery(val);
  };

  const activeChat = chats.find((c) => c.id === activeChatId) || chats[0];

  const sendPayload = (payload) => {
    if (!activeChat || activeChat.type === 'official') return;
    const msg = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5),
      chatId: activeChat.id,
      area: activeChat.type === 'admin_group' ? activeArea : 'All Areas',
      senderName: user.name,
      senderPhone: user.phone,
      type: payload.type || 'text',
      text: payload.text,
      mediaUrl: payload.mediaUrl || '',
      fileName: payload.fileName || '',
      duration: payload.duration || '',
      amount: payload.amount || '',
      options: payload.options || null,
      opened: false,
      paid: false,
      starred: false,
      ts: Date.now()
    };

    setChats((prev) => prev.map((c) => (c.id === activeChat.id ? { ...c, messages: [...c.messages, msg] } : c)));
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('chat:send', msg);
    }
  };

  const handleSendText = () => {
    if (!inputText.trim()) return;
    sendPayload({ type: 'text', text: inputText.trim() });
    setInputText('');
  };

  const deleteForBoth = (msg) => {
    setChats((prev) =>
      prev.map((c) => (c.id === activeChat.id ? { ...c, messages: c.messages.filter((m) => m.id !== msg.id) } : c))
    );
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('chat:delete_both', { chatId: activeChat.id, area: activeArea, id: msg.id, ts: msg.ts });
    }
    notify('Deleted for both sides within 1-minute window');
  };

  const toggleStar = (msgId) => {
    setChats((prev) =>
      prev.map((c) =>
        c.id === activeChat.id
          ? { ...c, messages: c.messages.map((m) => (m.id === msgId ? { ...m, starred: !m.starred } : m)) }
          : c
      )
    );
  };

  const translateMsg = (msgId) => {
    const langObj = APP_LANGUAGES.find((l) => l.code === selectedLang) || APP_LANGUAGES[1];
    setChats((prev) =>
      prev.map((c) =>
        c.id === activeChat.id
          ? {
              ...c,
              messages: c.messages.map((m) =>
                m.id === msgId ? { ...m, translatedText: `[${langObj.name} (${langObj.native})]: ${m.text}` } : m
              )
            }
          : c
      )
    );
  };

  const openViewOnce = (msg) => {
    if (msg.opened) return;
    setLightboxMedia({
      url: msg.mediaUrl || 'https://placehold.co/600x400/0f172a/3b82f6?text=View+Once+Protected+Photo',
      caption: '① View Once Photo — Will disappear on close'
    });
    setChats((prev) =>
      prev.map((c) =>
        c.id === activeChat.id
          ? { ...c, messages: c.messages.map((m) => (m.id === msg.id ? { ...m, opened: true } : m)) }
          : c
      )
    );
  };

  const exportCsv = () => {
    const rows = [['Area', 'Sender', 'Message', 'Time']];
    activeChat.messages.forEach((m) =>
      rows.push([m.area || 'All Areas', m.senderName, `"${m.text.replace(/"/g, '""')}"`, new Date(m.ts).toLocaleTimeString()])
    );
    const blob = new Blob([rows.map((r) => r.join(',')).join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `SKMD_${activeArea.replace(/\s+/g, '_')}_Orders.csv`;
    a.click();
    notify('Area Orders exported to CSV!');
  };

  const pushOfficialBroadcast = () => {
    if (!user?.isDeveloper || !devBroadcastText.trim()) return;
    const reach = GLOBAL_USER_DIRECTORY[devCountry]?.states[devState] || '0';
    const officialMsg = {
      id: 'off_' + Date.now(),
      chatId: 'chat_official',
      senderName: 'NexusChat Official ✓',
      senderPhone: 'SYSTEM',
      area: 'All Areas',
      type: 'text',
      text: `[${devCountry} · ${devState}] ${devBroadcastText.trim()}`,
      ts: Date.now()
    };

    setChats((prev) =>
      prev.map((c) => (c.id === 'chat_official' ? { ...c, unread: c.unread + 1, messages: [...c.messages, officialMsg] } : c))
    );
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('developer:broadcast', { country: devCountry, state: devState, text: devBroadcastText.trim() });
    }
    setDevLogs((prev) => [
      { id: 'log_' + Date.now(), region: `${devCountry} · ${devState}`, reach: `${reach} Users`, text: devBroadcastText.trim(), time: 'Just now', readRate: '98%' },
      ...prev
    ]);
    setDevBroadcastText('');
    setActiveModal(null);
    notify(`Official Broadcast sent to ${reach} users in ${devState}!`);
  };

  /* ==================== LOGIN SCREEN ==================== */
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
        <form onSubmit={handleLogin} className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl font-black shadow-lg">
                <i className="fa-solid fa-shield-halved"></i>
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-white">NexusChat SKMD</h1>
                <p className="text-xs text-blue-400 font-semibold">React + Node/Express/Socket.IO Live</p>
              </div>
            </div>
            <button type="button" onClick={toggleTheme} className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-600 text-amber-300">
              <i className="fa-solid fa-sun"></i>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-800 rounded-2xl border border-slate-700">
            <button type="button" onClick={() => setLoginRole('user')} className={`py-2 rounded-xl text-xs font-bold ${loginRole === 'user' ? 'bg-blue-600 text-white shadow' : 'text-slate-300'}`}>
              <i className="fa-solid fa-user mr-1"></i> User / Business Login
            </button>
            <button type="button" onClick={() => setLoginRole('developer')} className={`py-2 rounded-xl text-xs font-bold ${loginRole === 'developer' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-300'}`}>
              <i className="fa-solid fa-terminal mr-1"></i> Developer Login
            </button>
          </div>

          {loginRole === 'user' ? (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Display / Business Name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-600 text-white text-sm font-semibold" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Mobile Number</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-600 text-white text-sm font-mono font-bold" />
              </div>
              <button type="submit" className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-extrabold shadow-lg">
                <i className="fa-solid fa-bolt mr-1.5"></i> Enter NexusChat SKMD
              </button>
            </>
          ) : (
            <>
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/40 text-xs text-amber-200">
                <i className="fa-solid fa-lock mr-1 text-amber-400"></i> Restricted Super-Admin Gateway. Invisible to regular users.
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Developer ID</label>
                <input value={devId} onChange={(e) => setDevId(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-600 text-white text-sm font-mono font-bold" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Master Passkey (123456)</label>
                <input type="password" value={devKey} onChange={(e) => setDevKey(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-amber-500 text-white text-sm font-mono font-bold" />
              </div>
              <button type="submit" className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-extrabold shadow-lg">
                Authenticate Super-Admin Developer
              </button>
            </>
          )}
        </form>
      </div>
    );
  }

  const visibleChats = chats.filter((c) => {
    if (c.hiddenInVault && !vaultUnlocked) return false;
    if (sidebarTab === 'groups' && !c.type.includes('group')) return false;
    if (searchQuery && !c.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const visibleMessages = activeChat.messages.filter((m) =>
    activeChat.type === 'admin_group' ? (m.area || 'All Areas') === activeArea : true
  );

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-950 text-slate-100 select-none overflow-hidden">
      {/* System Maintenance Banner */}
      {systemBannerEnabled && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-extrabold flex items-center justify-between shrink-0">
          <span><i className="fa-solid fa-triangle-exclamation mr-1.5"></i>{systemBannerText}</span>
          <button onClick={() => notify('You are running the latest NexusChat build!')} className="px-3 py-1 rounded-lg bg-slate-950 text-amber-300 text-xs">Update</button>
        </div>
      )}

      {/* App Lock Overlay */}
      {appLocked && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-3xl p-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center text-2xl mx-auto">
              <i className="fa-solid fa-fingerprint"></i>
            </div>
            <h2 className="text-lg font-extrabold text-white">NexusChat Locked</h2>
            <p className="text-xs text-slate-300">Verify Biometric or enter PIN (<span className="font-mono text-blue-400 font-bold">1234</span>)</p>
            <input type="password" value={lockPinInput} onChange={(e) => setLockPinInput(e.target.value)} placeholder="PIN" className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-600 text-center text-lg font-mono text-white" />
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => { setAppLocked(false); notify('Biometric Unlocked'); }} className="py-2.5 rounded-xl bg-slate-800 text-blue-300 text-xs font-bold">Biometric</button>
              <button onClick={() => { if (lockPinInput === '1234') { setAppLocked(false); setLockPinInput(''); } else notify('Wrong PIN'); }} className="py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold">Unlock PIN</button>
            </div>
          </div>
        </div>
      )}

      {/* TOP HEADER BAR */}
      <header className="h-14 bg-slate-900 border-b border-slate-800 px-3 sm:px-5 flex items-center justify-between gap-2 shrink-0 z-30">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black shadow">
            <i className="fa-solid fa-shield-halved"></i>
          </div>
          <span className="font-extrabold text-sm sm:text-base text-white">NexusChat</span>
          <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
            <i className="fa-solid fa-lock text-[10px]"></i> E2EE Live
          </span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <button onClick={() => { setSecurityMode(securityMode === 'single' ? 'dual' : 'single'); notify('Security Mode switched'); }} className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-200 border border-indigo-400/40">
            <i className="fa-solid fa-fingerprint"></i> {securityMode === 'dual' ? 'Dual-Factor' : 'Single-Factor'}
          </button>
          <button onClick={toggleLargeText} className={`px-2.5 py-1.5 rounded-xl border text-xs font-extrabold ${largeText ? 'bg-amber-500/20 border-amber-400 text-amber-300' : 'bg-slate-800 border-slate-600 text-amber-300'}`}>
            {largeText ? 'A-' : 'A+'}
          </button>
          <button onClick={toggleTheme} className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-600 flex items-center justify-center text-amber-300">
            <i className={`fa-solid ${dayTheme ? 'fa-moon text-indigo-600' : 'fa-sun'}`}></i>
          </button>
          <button onClick={() => setAppLocked(true)} className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-600 flex items-center justify-center text-slate-200">
            <i className="fa-solid fa-lock text-xs"></i>
          </button>

          {/* Logged-In User Pill */}
          <button onClick={() => { setSettingsTab('profile'); setActiveModal('settings'); }} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-full pl-1.5 pr-3 py-1">
            <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=2563eb&color=fff&bold=true`} alt="Me" className="w-7 h-7 rounded-full" />
            <div className="text-left">
              <div className="text-xs font-bold text-white leading-tight">{user.name}</div>
              <div className="text-[11px] text-blue-400 font-mono leading-tight">{user.phone}</div>
            </div>
          </button>

          {/* Top 3-Dots Menu */}
          <div className="relative">
            <button onClick={() => setShowTopMenu(!showTopMenu)} className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 flex items-center justify-center text-white">
              <i className="fa-solid fa-ellipsis-vertical"></i>
            </button>
            {showTopMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl py-2 z-50 text-xs font-semibold">
                <button onClick={() => { setShowTopMenu(false); setActiveModal('new_group'); }} className="w-full px-4 py-2.5 text-left hover:bg-slate-800 flex items-center gap-3"><i className="fa-solid fa-users text-blue-400 w-4"></i> New Group (Admin / Family)</button>
                <button onClick={() => { setShowTopMenu(false); setActiveModal('new_contact'); }} className="w-full px-4 py-2.5 text-left hover:bg-slate-800 flex items-center gap-3"><i className="fa-solid fa-user-plus text-sky-400 w-4"></i> New Contact</button>
                <button onClick={() => { setShowTopMenu(false); setActiveModal('linked_devices'); }} className="w-full px-4 py-2.5 text-left hover:bg-slate-800 flex items-center gap-3"><i className="fa-solid fa-laptop text-indigo-400 w-4"></i> Linked Devices (Web QR)</button>
                <button onClick={() => { setShowTopMenu(false); setActiveModal('starred'); }} className="w-full px-4 py-2.5 text-left hover:bg-slate-800 flex items-center gap-3"><i className="fa-solid fa-star text-yellow-400 w-4"></i> Starred Messages</button>
                <button onClick={() => { setShowTopMenu(false); setActiveModal('share_app'); }} className="w-full px-4 py-2.5 text-left hover:bg-slate-800 flex items-center gap-3"><i className="fa-solid fa-share-nodes text-teal-400 w-4"></i> Share / Download App</button>
                {user.isDeveloper && (
                  <button onClick={() => { setShowTopMenu(false); setActiveModal('developer'); }} className="w-full px-4 py-2.5 text-left bg-amber-500/15 hover:bg-amber-500/25 flex items-center gap-3 text-amber-300 font-extrabold border-y border-amber-500/30 my-1">
                    <i className="fa-solid fa-terminal text-amber-400 w-4"></i> Developer Options (Global)
                  </button>
                )}
                <button onClick={() => { setShowTopMenu(false); setSettingsTab('profile'); setActiveModal('settings'); }} className="w-full px-4 py-2.5 text-left hover:bg-slate-800 flex items-center gap-3"><i className="fa-solid fa-gear text-slate-300 w-4"></i> Settings</button>
                <button onClick={() => { setShowTopMenu(false); setUser(null); }} className="w-full px-4 py-2.5 text-left hover:bg-rose-950/60 flex items-center gap-3 text-rose-400"><i className="fa-solid fa-right-from-bracket w-4"></i> Log Out</button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* MAIN SPLIT WORKSPACE */}
      <main className="flex-1 flex overflow-hidden">
        {/* LEFT SIDEBAR */}
        <aside className="w-80 lg:w-96 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0">
          <div className="p-3 border-b border-slate-800 space-y-2.5">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                <input
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Search or Vault PIN (9999)..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                />
              </div>
              <button
                onClick={() => {
                  if (!vaultUnlocked) return notify('Enter Vault PIN (9999) in Search Box');
                  setVaultUnlocked(false);
                  if (activeChatId === 'chat_vault_vip') setActiveChatId('chat_admin_hq');
                  notify('Secret Vault Locked');
                }}
                className={`px-3 py-2 rounded-xl border text-xs font-bold ${vaultUnlocked ? 'bg-purple-600 text-white border-purple-400' : 'bg-slate-800 text-slate-300 border-slate-700'}`}
              >
                <i className="fa-solid fa-user-secret"></i>
              </button>
            </div>

            <div className="grid grid-cols-4 gap-1 bg-slate-800/80 p-1 rounded-xl text-xs font-bold">
              {['all', 'groups', 'status', 'calls'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSidebarTab(tab)}
                  className={`py-1.5 rounded-lg capitalize ${sidebarTab === tab ? 'bg-blue-600 text-white' : 'text-slate-300'}`}
                >
                  {tab === 'all' ? 'Chats' : tab}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/70">
            {sidebarTab === 'status' ? (
              <div className="p-4 space-y-3">
                <div className="p-3 rounded-2xl bg-slate-800 border border-slate-700 space-y-2">
                  <input value={newStatusText} onChange={(e) => setNewStatusText(e.target.value)} placeholder="Post dispatch status..." className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-600 text-xs text-white" />
                  <button onClick={() => { if (!newStatusText.trim()) return; setStatuses([{ id: 'st_' + Date.now(), author: user.name + ' (You)', time: 'Just now', text: newStatusText }, ...statuses]); setNewStatusText(''); }} className="w-full py-2 rounded-xl bg-blue-600 text-white text-xs font-bold">Publish Status</button>
                </div>
                {statuses.map((st) => (
                  <div key={st.id} className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white space-y-1">
                    <div className="flex justify-between text-xs font-extrabold"><span>{st.author}</span><span>{st.time}</span></div>
                    <p className="text-xs">{st.text}</p>
                  </div>
                ))}
              </div>
            ) : sidebarTab === 'calls' ? (
              <div className="p-4 space-y-2.5">
                <div className="p-3.5 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-extrabold text-white">SKMD Family Group ❤️</div>
                    <div className="text-[11px] text-blue-400">Group Video Call · Today</div>
                  </div>
                  <button onClick={() => setActiveCall({ title: 'SKMD Family Group ❤️', mode: 'VIDEO', isGroup: true })} className="w-9 h-9 rounded-xl bg-blue-600 text-white"><i className="fa-solid fa-video text-xs"></i></button>
                </div>
              </div>
            ) : (
              visibleChats.map((c) => {
                const last = c.messages[c.messages.length - 1];
                return (
                  <div
                    key={c.id}
                    onClick={() => {
                      setActiveChatId(c.id);
                      setChats((prev) => prev.map((x) => (x.id === c.id ? { ...x, unread: 0 } : x)));
                    }}
                    className={`p-3.5 flex items-center gap-3 cursor-pointer ${c.id === activeChatId ? 'bg-blue-600/20 border-l-4 border-blue-500' : 'hover:bg-slate-800/60'}`}
                  >
                    <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(c.title)}&background=2563eb&color=fff&bold=true`} alt={c.title} className="w-11 h-11 rounded-full shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <span className="font-extrabold text-xs sm:text-sm text-white truncate">{c.title}</span>
                        {c.unread > 0 && <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-extrabold">{c.unread}</span>}
                      </div>
                      <p className="text-xs text-slate-300 truncate mt-0.5">{last ? last.text : c.subtitle}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* RIGHT CONVERSATION PANEL */}
        <section className="flex-1 flex flex-col bg-slate-950 min-w-0 relative">
          {/* Chat Header */}
          <div className="h-16 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(activeChat.title)}&background=2563eb&color=fff&bold=true`} alt={activeChat.title} className="w-10 h-10 rounded-full shrink-0" />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm sm:text-base font-extrabold text-white truncate">{activeChat.title}</h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-500/20 text-blue-300 border border-blue-500/40 uppercase">{activeChat.type.replace('_', ' ')}</span>
                </div>
                <p className="text-xs text-slate-300 truncate">{activeChat.subtitle}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {activeChat.type === 'family_group' && (
                <>
                  <button onClick={() => setVoiceRoomActive(true)} className="px-3 py-1.5 rounded-xl bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold">
                    <i className="fa-solid fa-microphone-lines mr-1"></i> Voice Chat
                  </button>
                  <button onClick={() => setActiveCall({ title: activeChat.title, mode: 'VIDEO', isGroup: true })} className="px-3 py-1.5 rounded-xl bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 text-xs font-bold">
                    <i className="fa-solid fa-video mr-1"></i> Group Video
                  </button>
                </>
              )}
              {activeChat.type === 'admin_group' && (
                <>
                  <button onClick={() => setActiveModal('group_members')} title="Manage Members" className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 text-blue-300"><i className="fa-solid fa-users-gear"></i></button>
                  <button onClick={exportCsv} title="Export Area Orders CSV" className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 text-amber-300"><i className="fa-solid fa-file-csv"></i></button>
                </>
              )}
              <button onClick={() => setActiveCall({ title: activeChat.title, mode: 'AUDIO', isGroup: false })} className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 text-slate-200"><i className="fa-solid fa-phone text-xs"></i></button>
              <button onClick={() => setActiveCall({ title: activeChat.title, mode: 'VIDEO', isGroup: false })} className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 text-slate-200"><i className="fa-solid fa-video text-xs"></i></button>
            </div>
          </div>

          {/* Multi-Area Isolation Sub-Tabs */}
          {activeChat.type === 'admin_group' && (
            <div className="bg-slate-900/90 border-b border-slate-800 px-3 py-2 flex items-center justify-between gap-2 overflow-x-auto shrink-0">
              <div className="flex items-center gap-1.5">
                {areas.map((ar) => (
                  <button
                    key={ar}
                    onClick={() => setActiveArea(ar)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold shrink-0 ${activeArea === ar ? 'bg-blue-600 text-white shadow' : 'bg-slate-800 text-slate-300'}`}
                  >
                    {ar === 'All Areas' ? '📢 All Areas (Common)' : `📍 ${ar}`}
                  </button>
                ))}
              </div>
              <button onClick={() => setActiveModal('add_area')} className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-600 text-xs font-bold text-blue-300 shrink-0">+ Area</button>
            </div>
          )}

          {/* Family Live Voice Room Banner */}
          {voiceRoomActive && (
            <div className="bg-emerald-950/90 border-b border-emerald-700/50 px-4 py-2.5 flex items-center justify-between shrink-0">
              <div className="text-xs font-extrabold text-emerald-200">
                <i className="fa-solid fa-circle-dot text-emerald-400 animate-ping mr-2"></i>
                Live Family Voice Room Active (Amma, Nanna, Ravi, You)
              </div>
              <div className="flex gap-2">
                <button onClick={() => setVoiceMuted(!voiceMuted)} className="px-3 py-1 rounded-xl bg-slate-800 text-xs font-bold">{voiceMuted ? 'Unmute' : 'Mute'}</button>
                <button onClick={() => setVoiceRoomActive(false)} className="px-3 py-1 rounded-xl bg-rose-600 text-white text-xs font-bold">Leave</button>
              </div>
            </div>
          )}

          {/* Messages Viewport */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
            {visibleMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 space-y-2">
                <i className="fa-solid fa-shield-halved text-3xl text-blue-500/60"></i>
                <div className="text-sm font-bold text-slate-200">Isolated Channel: {activeArea}</div>
                <p className="text-xs max-w-sm">Messages in <b>{activeArea}</b> stay completely private to this area.</p>
              </div>
            ) : (
              visibleMessages.map((m) => {
                const mine = m.senderPhone === user.phone;
                const canDelete = mine && m.ts && Date.now() - m.ts < 60000;
                return (
                  <div key={m.id} className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
                    <div className={`max-w-[80%] sm:max-w-[68%] px-4 py-2.5 rounded-2xl shadow ${mine ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-slate-800 text-slate-100 border border-slate-700 rounded-tl-sm'}`}>
                      {!mine && <div className="text-[11px] font-extrabold text-blue-400 mb-1">{m.senderName}</div>}

                      {m.type === 'view_once' ? (
                        m.opened ? (
                          <div className="text-xs italic opacity-80">① Opened · View Once Photo expired</div>
                        ) : (
                          <button onClick={() => openViewOnce(m)} className="px-3.5 py-2 rounded-xl bg-amber-500/20 border border-amber-400/50 text-amber-200 text-xs font-extrabold">
                            <i className="fa-solid fa-eye mr-1.5"></i> ① View Once Photo (Tap to Open)
                          </button>
                        )
                      ) : m.type === 'image' ? (
                        <div className="space-y-1.5">
                          <img onClick={() => setLightboxMedia({ url: m.mediaUrl, caption: m.text })} src={m.mediaUrl} alt="Photo" className="max-h-52 rounded-xl cursor-pointer" />
                          <p className="text-xs">{m.text}</p>
                        </div>
                      ) : m.type === 'document' ? (
                        <div className="p-2.5 rounded-xl bg-black/25 flex items-center gap-3">
                          <i className="fa-solid fa-file-invoice text-xl text-sky-300"></i>
                          <div className="text-xs font-bold">{m.fileName || m.text}</div>
                        </div>
                      ) : m.type === 'location_live' || m.type === 'location_current' ? (
                        <div className="p-3 rounded-xl bg-slate-950/60 border border-blue-400/40 space-y-1.5 w-60">
                          <div className="text-[10px] font-extrabold text-emerald-300 uppercase">
                            {m.type === 'location_live' ? `● LIVE TRACKING (${m.duration || '1 Hour'})` : '📍 CURRENT PIN LOCATION'}
                          </div>
                          <div className="text-xs font-bold text-white">{m.text}</div>
                        </div>
                      ) : m.type === 'sticker' ? (
                        <div className="px-4 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-sm">{m.text}</div>
                      ) : m.type === 'upi_qr' ? (
                        <div className="p-3 rounded-xl bg-white text-slate-900 space-y-2 w-56">
                          <div className="flex justify-between text-[11px] font-extrabold text-blue-700"><span>UPI QR</span><span>{m.paid ? '✅ PAID' : '⏳ PENDING'}</span></div>
                          <div className="text-base font-black">₹{m.amount}</div>
                          <div className="p-2 bg-slate-100 rounded-lg text-center"><i className="fa-solid fa-qrcode text-5xl"></i></div>
                          {!m.paid && (
                            <button
                              onClick={() =>
                                setChats((prev) =>
                                  prev.map((c) =>
                                    c.id === activeChat.id ? { ...c, messages: c.messages.map((x) => (x.id === m.id ? { ...x, paid: true } : x)) } : c
                                  )
                                )
                              }
                              className="w-full py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold"
                            >
                              Mark as Paid
                            </button>
                          )}
                        </div>
                      ) : m.type === 'poll' ? (
                        <div className="space-y-1.5 w-60">
                          <div className="text-xs font-extrabold">📊 {m.text}</div>
                          {(m.options || []).map((opt, idx) => (
                            <button
                              key={idx}
                              onClick={() =>
                                setChats((prev) =>
                                  prev.map((c) =>
                                    c.id === activeChat.id
                                      ? {
                                          ...c,
                                          messages: c.messages.map((x) =>
                                            x.id === m.id
                                              ? { ...x, options: x.options.map((o, i) => (i === idx ? { ...o, votes: o.votes + 1 } : o)) }
                                              : x
                                          )
                                        }
                                      : c
                                  )
                                )
                              }
                              className="w-full px-3 py-1.5 rounded-lg bg-black/25 text-left text-xs flex justify-between"
                            >
                              <span>{opt.label}</span>
                              <span className="font-bold">{opt.votes}</span>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs sm:text-sm whitespace-pre-wrap">{m.text}</p>
                      )}

                      {m.translatedText && <div className="mt-1.5 pt-1.5 border-t border-white/20 text-xs text-amber-200">🌐 {m.translatedText}</div>}

                      <div className="mt-1.5 flex items-center justify-end gap-2 text-[10px] opacity-85">
                        <button onClick={() => translateMsg(m.id)} className="hover:underline">🌐 Translate</button>
                        <button onClick={() => toggleStar(m.id)}>{m.starred ? '⭐' : '☆'}</button>
                        {canDelete && <button onClick={() => deleteForBoth(m)} className="text-rose-200 font-bold hover:underline">🗑️ Delete for Both</button>}
                        <span>{new Date(m.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Composer */}
          {activeChat.type === 'official' ? (
            <div className="bg-slate-900 border-t border-slate-800 p-3 text-center text-xs text-slate-300">
              <i className="fa-solid fa-circle-check text-sky-400 mr-1"></i> Official Verified Announcements Channel · Read-Only
            </div>
          ) : (
            <div className="bg-slate-900 border-t border-slate-800 p-3 shrink-0 relative">
              {showAttachMenu && (
                <div className="absolute bottom-16 left-3 w-64 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl py-2 z-40 text-xs font-semibold">
                  <button onClick={() => { pendingViewOnceRef.current = false; setShowAttachMenu(false); mediaInputRef.current.click(); }} className="w-full px-4 py-2.5 text-left hover:bg-slate-800 flex items-center gap-3"><i className="fa-solid fa-image text-blue-400 w-4"></i> Photo / Video Gallery</button>
                  <button onClick={() => { pendingViewOnceRef.current = true; setShowAttachMenu(false); mediaInputRef.current.click(); }} className="w-full px-4 py-2.5 text-left hover:bg-slate-800 flex items-center gap-3"><i className="fa-solid fa-eye-slash text-amber-400 w-4"></i> ① View Once Photo</button>
                  <button onClick={() => { setShowAttachMenu(false); docInputRef.current.click(); }} className="w-full px-4 py-2.5 text-left hover:bg-slate-800 flex items-center gap-3"><i className="fa-solid fa-file-lines text-sky-400 w-4"></i> Document (PDF/Excel/Word)</button>
                  <button onClick={() => { setShowAttachMenu(false); setActiveModal('location'); }} className="w-full px-4 py-2.5 text-left hover:bg-slate-800 flex items-center gap-3"><i className="fa-solid fa-location-dot text-rose-400 w-4"></i> Share Location (Live / Current)</button>
                  <button onClick={() => { setShowAttachMenu(false); setActiveModal('upi'); }} className="w-full px-4 py-2.5 text-left hover:bg-slate-800 flex items-center gap-3"><i className="fa-solid fa-qrcode text-indigo-400 w-4"></i> Request UPI Payment / QR</button>
                  <button onClick={() => { setShowAttachMenu(false); setActiveModal('poll'); }} className="w-full px-4 py-2.5 text-left hover:bg-slate-800 flex items-center gap-3"><i className="fa-solid fa-square-poll-vertical text-teal-400 w-4"></i> Create Stock Poll</button>
                  <button onClick={() => { setShowAttachMenu(false); setEmojiTab('stickers'); setShowEmojiPopover(true); }} className="w-full px-4 py-2.5 text-left hover:bg-slate-800 flex items-center gap-3 text-pink-300 font-bold"><i className="fa-solid fa-note-sticky text-pink-400 w-4"></i> Send Sticker</button>
                </div>
              )}

              {showEmojiPopover && (
                <div className="absolute bottom-16 left-12 w-72 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-3 z-40">
                  <div className="grid grid-cols-2 gap-1.5 bg-slate-800 p-1 rounded-xl mb-2 text-xs font-bold">
                    <button onClick={() => setEmojiTab('emojis')} className={`py-1 rounded-lg ${emojiTab === 'emojis' ? 'bg-blue-600 text-white' : 'text-slate-300'}`}>😊 Emojis</button>
                    <button onClick={() => setEmojiTab('stickers')} className={`py-1 rounded-lg ${emojiTab === 'stickers' ? 'bg-blue-600 text-white' : 'text-slate-300'}`}>🏷️ Stickers</button>
                  </div>
                  {emojiTab === 'emojis' ? (
                    <div className="grid grid-cols-6 gap-1.5 text-xl text-center">
                      {['😊', '🙏', '👍', '❤️', '🚚', '📦', '✅', '💰', '🧾', '🔥', '🎉', '⭐'].map((em) => (
                        <button key={em} onClick={() => setInputText((p) => p + em)} className="p-1 hover:bg-slate-800 rounded">{em}</button>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {['ORDER CONFIRMED ✅', 'DISPATCHED 🚚', 'FRESH STOCK 📦', 'PAYMENT PAID 💰', 'URGENT INDENT ⚡', 'THANK YOU 🙏'].map((st) => (
                        <button key={st} onClick={() => { sendPayload({ type: 'sticker', text: st }); setShowEmojiPopover(false); }} className="p-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-[11px]">
                          {st}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <input
                ref={mediaInputRef}
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files[0];
                  if (!f) return;
                  sendPayload({ type: pendingViewOnceRef.current ? 'view_once' : 'image', text: pendingViewOnceRef.current ? '① View Once Photo' : f.name, mediaUrl: URL.createObjectURL(f) });
                  e.target.value = '';
                }}
              />
              <input
                ref={docInputRef}
                type="file"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files[0];
                  if (!f) return;
                  sendPayload({ type: 'document', text: f.name, fileName: `${f.name} (${Math.max(1, Math.round(f.size / 1024))} KB)` });
                  e.target.value = '';
                }}
              />

              <div className="flex items-center gap-2">
                <button onClick={() => { setShowAttachMenu(!showAttachMenu); setShowEmojiPopover(false); }} className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 shrink-0"><i className="fa-solid fa-paperclip"></i></button>
                <button onClick={() => { setShowEmojiPopover(!showEmojiPopover); setShowAttachMenu(false); }} className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 text-amber-300 shrink-0"><i className="fa-regular fa-face-smile"></i></button>
                <input value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendText()} placeholder="Type encrypted message..." className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white" />
                <button onClick={() => setActiveModal('schedule')} className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 text-sky-300 shrink-0"><i className="fa-regular fa-clock"></i></button>
                <button onClick={() => sendPayload({ type: 'text', text: '🎙️ Encrypted Voice Note (0:14) · Tap to Play' })} className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 text-blue-300 shrink-0"><i className="fa-solid fa-microphone"></i></button>
                <button onClick={handleSendText} className="px-4 h-10 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shrink-0">Send</button>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* ==================== MODALS ==================== */}
      {activeModal === 'location' && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-5 space-y-3">
            <div className="flex justify-between items-center"><h3 className="font-extrabold">Share Location</h3><button onClick={() => setActiveModal(null)}>✕</button></div>
            <div className="p-3.5 rounded-2xl bg-blue-950/50 border border-blue-500/40 space-y-2">
              <div className="text-xs font-extrabold text-white"><i className="fa-solid fa-satellite-dish text-emerald-400 mr-1.5"></i>Share Live Location (Real-Time GPS)</div>
              <div className="grid grid-cols-3 gap-2">
                {['15 Mins', '1 Hour', '8 Hours'].map((dur) => (
                  <button key={dur} onClick={() => { sendPayload({ type: 'location_live', text: 'NH-16 Auto Nagar Route · Live GPS', duration: dur }); setActiveModal(null); }} className="py-2 rounded-xl bg-blue-600 text-white text-xs font-bold">{dur}</button>
                ))}
              </div>
            </div>
            <button onClick={() => { sendPayload({ type: 'location_current', text: 'SKMD Main Warehouse & Dispatch Hub (Current Pin)' }); setActiveModal(null); }} className="w-full p-3.5 rounded-2xl bg-slate-800 border border-slate-600 text-left text-xs font-extrabold text-white">
              <i className="fa-solid fa-location-dot text-rose-400 mr-2"></i>Send Your Current Location (Static GPS Pin)
            </button>
          </div>
        </div>
      )}

      {activeModal === 'upi' && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-3xl p-5 space-y-3">
            <div className="flex justify-between items-center"><h3 className="font-extrabold">Request UPI Payment / QR</h3><button onClick={() => setActiveModal(null)}>✕</button></div>
            <input type="number" value={upiAmount} onChange={(e) => setUpiAmount(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-600 text-white font-bold" />
            <button onClick={() => { sendPayload({ type: 'upi_qr', text: 'UPI Request ₹' + upiAmount, amount: upiAmount }); setActiveModal(null); }} className="w-full py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold">Send UPI QR Card</button>
          </div>
        </div>
      )}

      {activeModal === 'poll' && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-3xl p-5 space-y-3">
            <div className="flex justify-between items-center"><h3 className="font-extrabold">Create Stock / Order Poll</h3><button onClick={() => setActiveModal(null)}>✕</button></div>
            <input value={pollQuestion} onChange={(e) => setPollQuestion(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-600 text-white text-xs font-bold" />
            <button onClick={() => { sendPayload({ type: 'poll', text: pollQuestion, options: [{ label: '7:00 AM Morning Slot', votes: 1 }, { label: '2:00 PM Afternoon Slot', votes: 0 }] }); setActiveModal(null); }} className="w-full py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold">Publish Poll</button>
          </div>
        </div>
      )}

      {activeModal === 'schedule' && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-3xl p-5 space-y-3">
            <div className="flex justify-between items-center"><h3 className="font-extrabold">Schedule Message</h3><button onClick={() => setActiveModal(null)}>✕</button></div>
            <input value={scheduleText} onChange={(e) => setScheduleText(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-600 text-white text-xs" />
            <button onClick={() => { const t = scheduleText; setActiveModal(null); notify('Scheduled! Auto-delivering in 5s...'); setTimeout(() => sendPayload({ type: 'text', text: '🕒 [Scheduled]: ' + t }), 5000); }} className="w-full py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold">Deliver in 5 Seconds (Demo)</button>
          </div>
        </div>
      )}

      {activeModal === 'add_area' && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-3xl p-5 space-y-3">
            <div className="flex justify-between items-center"><h3 className="font-extrabold">Add Isolated Area Tab</h3><button onClick={() => setActiveModal(null)}>✕</button></div>
            <input value={newAreaName} onChange={(e) => setNewAreaName(e.target.value)} placeholder="e.g., Ongole or Nellore" className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-600 text-white text-xs" />
            <button onClick={() => { if (!newAreaName.trim()) return; setAreas([...new Set([...areas, newAreaName.trim()])]); setActiveArea(newAreaName.trim()); setNewAreaName(''); setActiveModal(null); }} className="w-full py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold">Create Area Channel</button>
          </div>
        </div>
      )}

      {activeModal === 'group_members' && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-5 space-y-3">
            <div className="flex justify-between items-center"><h3 className="font-extrabold">Manage Group Members</h3><button onClick={() => setActiveModal(null)}>✕</button></div>
            <div className="space-y-1.5">
              {(activeChat.members || []).map((mem, i) => (
                <div key={i} className="p-2.5 rounded-xl bg-slate-800 flex justify-between text-xs"><span className="font-bold">{mem}</span><span className="text-blue-400">Verified</span></div>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={newMemberName} onChange={(e) => setNewMemberName(e.target.value)} placeholder="Add distributor..." className="flex-1 px-3 py-2 rounded-xl bg-slate-800 text-xs" />
              <button onClick={() => { if (!newMemberName.trim()) return; setChats((prev) => prev.map((c) => (c.id === activeChat.id ? { ...c, members: [...(c.members || []), newMemberName.trim()] } : c))); setNewMemberName(''); }} className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold">Add</button>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'new_group' && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-3xl p-5 space-y-3">
            <div className="flex justify-between items-center"><h3 className="font-extrabold">Create New Group</h3><button onClick={() => setActiveModal(null)}>✕</button></div>
            <input value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} placeholder="Group Name" className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 text-xs" />
            <select value={newGroupType} onChange={(e) => setNewGroupType(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 text-xs">
              <option value="admin_group">Admin Group (Multi-Area Isolation)</option>
              <option value="family_group">Family Group (Voice & Group Video)</option>
            </select>
            <button onClick={() => { if (!newGroupName.trim()) return; const id = 'grp_' + Date.now(); setChats([{ id, title: newGroupName, type: newGroupType, hiddenInVault: false, subtitle: 'Encrypted Group', members: ['You'], unread: 0, messages: [] }, ...chats]); setActiveChatId(id); setNewGroupName(''); setActiveModal(null); }} className="w-full py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold">Create Group</button>
          </div>
        </div>
      )}

      {activeModal === 'new_contact' && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-3xl p-5 space-y-3">
            <div className="flex justify-between items-center"><h3 className="font-extrabold">Add New Contact</h3><button onClick={() => setActiveModal(null)}>✕</button></div>
            <input value={newContactName} onChange={(e) => setNewContactName(e.target.value)} placeholder="Store / Contact Name" className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 text-xs" />
            <input value={newContactPhone} onChange={(e) => setNewContactPhone(e.target.value)} placeholder="+91 98765 43210" className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 text-xs font-mono" />
            <button onClick={() => { if (!newContactName.trim()) return; const id = 'dir_' + Date.now(); setChats([{ id, title: newContactName, type: 'direct', hiddenInVault: false, subtitle: newContactPhone || 'Verified Contact', unread: 0, messages: [] }, ...chats]); setActiveChatId(id); setNewContactName(''); setNewContactPhone(''); setActiveModal(null); }} className="w-full py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold">Save & Chat</button>
          </div>
        </div>
      )}

      {activeModal === 'linked_devices' && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-3xl p-5 space-y-3 text-center">
            <div className="flex justify-between items-center"><h3 className="font-extrabold">Linked Devices (Web QR)</h3><button onClick={() => setActiveModal(null)}>✕</button></div>
            <div className="p-4 rounded-2xl bg-white text-slate-900"><i className="fa-solid fa-qrcode text-7xl"></i><div className="text-xs font-bold mt-2">Scan from web.nexuschat.app</div></div>
          </div>
        </div>
      )}

      {activeModal === 'starred' && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-5 space-y-3">
            <div className="flex justify-between items-center"><h3 className="font-extrabold">Starred Messages</h3><button onClick={() => setActiveModal(null)}>✕</button></div>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {chats.flatMap((c) => c.messages.filter((m) => m.starred).map((m) => (
                <div key={m.id} className="p-3 rounded-xl bg-slate-800 text-xs"><div className="font-bold text-blue-400">{c.title}</div><div>{m.text}</div></div>
              )))}
            </div>
          </div>
        </div>
      )}

      {activeModal === 'share_app' && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-5 space-y-3">
            <div className="flex justify-between items-center"><h3 className="font-extrabold">Share & Download App</h3><button onClick={() => setActiveModal(null)}>✕</button></div>
            {[
              { label: 'Android APK / Play Store', url: 'https://nexuschat.app/android' },
              { label: 'iOS App Store', url: 'https://nexuschat.app/ios' },
              { label: 'Windows Desktop (.exe)', url: 'https://nexuschat.app/windows' }
            ].map((item) => (
              <div key={item.url} className="p-3 rounded-xl bg-slate-800 flex justify-between items-center text-xs">
                <span className="font-bold">{item.label}</span>
                <button onClick={() => { navigator.clipboard?.writeText(item.url); notify('Copied ' + item.url); }} className="px-3 py-1 rounded-lg bg-blue-600 text-white font-bold">Copy</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SETTINGS MODAL */}
      {activeModal === 'settings' && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl overflow-hidden flex flex-col max-h-[88vh]">
            <div className="px-5 py-4 border-b border-slate-800 flex justify-between items-center">
              <h3 className="font-extrabold text-base">NexusChat Settings</h3>
              <button onClick={() => setActiveModal(null)}>✕</button>
            </div>
            <div className="px-5 py-3 border-b border-slate-800 flex gap-2 overflow-x-auto">
              {['profile', 'subscriptions', 'account', 'privacy', 'language'].map((t) => (
                <button key={t} onClick={() => setSettingsTab(t)} className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize ${settingsTab === t ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300'}`}>
                  {t}
                </button>
              ))}
            </div>
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {settingsTab === 'profile' && (
                <div className="space-y-3">
                  <input value={user.name} onChange={(e) => setUser({ ...user, name: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-600 text-white font-bold" />
                  <input value={aboutText} onChange={(e) => setAboutText(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-600 text-white" />
                  <div className="flex gap-2">
                    <input value={gmailBackup} onChange={(e) => setGmailBackup(e.target.value)} className="flex-1 px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-600 text-white" />
                    <button onClick={() => notify('Backup synced to ' + gmailBackup)} className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold">Verify Gmail Backup</button>
                  </div>
                </div>
              )}
              {settingsTab === 'subscriptions' && (
                <div className="p-4 rounded-2xl bg-blue-950/50 border border-blue-500/40 space-y-1">
                  <div className="font-extrabold text-sm text-white">NexusChat Business Pro (Active)</div>
                  <p className="text-slate-300">Unlimited Multi-Area Admin Groups, UPI QR Cards, & CSV Export enabled.</p>
                </div>
              )}
              {settingsTab === 'account' && (
                <div className="space-y-2">
                  <div className="p-3 rounded-xl bg-slate-800 flex justify-between"><span>Hardware Passkey & Biometric Login</span><input type="checkbox" defaultChecked /></div>
                  <div className="p-3 rounded-xl bg-slate-800 flex justify-between"><span>Two-Step Verification (2FA PIN)</span><input type="checkbox" defaultChecked /></div>
                </div>
              )}
              {settingsTab === 'privacy' && (
                <div className="space-y-2">
                  <div className="p-3 rounded-xl bg-slate-800 flex justify-between"><span>Last Seen & Online</span><span className="font-bold text-blue-400">My Contacts Only</span></div>
                  <div className="p-3 rounded-xl bg-slate-800 flex justify-between"><span>App Lock</span><button onClick={() => setAppLocked(true)} className="px-3 py-1 rounded-lg bg-blue-600 text-white font-bold">Test App Lock</button></div>
                </div>
              )}
              {settingsTab === 'language' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {APP_LANGUAGES.map((l) => (
                    <button key={l.code} onClick={() => { setSelectedLang(l.code); notify('Language set to ' + l.name); }} className={`p-3 rounded-xl border text-left ${selectedLang === l.code ? 'bg-blue-600/20 border-blue-500 text-white' : 'bg-slate-800 border-slate-700'}`}>
                      <div className="font-bold">{l.native}</div>
                      <div className="opacity-75">{l.name}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* DEVELOPER CONSOLE MODAL (Strictly Role-Isolated) */}
      {activeModal === 'developer' && user.isDeveloper && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-slate-900 border border-amber-500/50 rounded-3xl overflow-hidden flex flex-col max-h-[88vh]">
            <div className="px-5 py-4 bg-amber-500/10 border-b border-amber-500/30 flex justify-between items-center">
              <h3 className="font-extrabold text-amber-300">Developer Super-Admin Console</h3>
              <button onClick={() => setActiveModal(null)}>✕</button>
            </div>
            <div className="px-5 py-3 border-b border-slate-800 flex gap-2">
              {['broadcast', 'controls', 'logs'].map((t) => (
                <button key={t} onClick={() => setDevTab(t)} className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold capitalize ${devTab === t ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-200'}`}>
                  {t === 'controls' ? 'Maintenance & Ban' : t}
                </button>
              ))}
            </div>
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {devTab === 'broadcast' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <select value={devCountry} onChange={(e) => { setDevCountry(e.target.value); setDevState(Object.keys(GLOBAL_USER_DIRECTORY[e.target.value].states)[0]); }} className="p-2.5 rounded-xl bg-slate-800 font-bold">
                      {Object.keys(GLOBAL_USER_DIRECTORY).map((c) => <option key={c} value={c}>{c} ({GLOBAL_USER_DIRECTORY[c].total})</option>)}
                    </select>
                    <select value={devState} onChange={(e) => setDevState(e.target.value)} className="p-2.5 rounded-xl bg-slate-800 font-bold">
                      {Object.entries(GLOBAL_USER_DIRECTORY[devCountry].states).map(([st, cnt]) => <option key={st} value={st}>{st} ({cnt})</option>)}
                    </select>
                  </div>
                  <div className="p-3 rounded-xl bg-sky-950/50 border border-sky-500/40 font-bold text-sky-200">
                    Reach: {GLOBAL_USER_DIRECTORY[devCountry]?.states[devState]} Users (Direct System Broadcast)
                  </div>
                  <textarea rows={3} value={devBroadcastText} onChange={(e) => setDevBroadcastText(e.target.value)} placeholder="Official announcement from NexusChat Official ✓..." className="w-full p-3 rounded-xl bg-slate-800 text-sm" />
                  <button onClick={pushOfficialBroadcast} className="w-full py-3 rounded-xl bg-amber-500 text-slate-950 font-extrabold text-sm">Push Official Broadcast Now</button>
                </>
              )}
              {devTab === 'controls' && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-2xl bg-slate-800 space-y-2">
                    <div className="flex justify-between items-center font-bold">
                      <span>Force App Update / Maintenance Banner</span>
                      <input type="checkbox" checked={systemBannerEnabled} onChange={(e) => setSystemBannerEnabled(e.target.checked)} />
                    </div>
                    <input value={systemBannerText} onChange={(e) => setSystemBannerText(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-900" />
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-800 space-y-2">
                    <div className="font-bold">Suspend / Unban Spam Account</div>
                    <div className="flex gap-2">
                      <input value={banInput} onChange={(e) => setBanInput(e.target.value)} placeholder="+91 90000 00000" className="flex-1 px-3 py-2 rounded-xl bg-slate-900 font-mono" />
                      <button onClick={() => { if (!banInput.trim()) return; setSuspendedList([...new Set([...suspendedList, banInput.trim()])]); setBanInput(''); }} className="px-4 py-2 rounded-xl bg-rose-600 text-white font-bold">Suspend</button>
                    </div>
                    {suspendedList.map((num) => (
                      <div key={num} className="flex justify-between items-center p-2 bg-slate-900 rounded-xl">
                        <span className="font-mono text-rose-300">{num}</span>
                        <button onClick={() => setSuspendedList(suspendedList.filter((n) => n !== num))} className="px-2.5 py-1 rounded bg-emerald-600 text-white font-bold">Unban</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {devTab === 'logs' && (
                <div className="space-y-2">
                  {devLogs.map((l) => (
                    <div key={l.id} className="p-3 rounded-xl bg-slate-800 space-y-1">
                      <div className="flex justify-between font-bold text-amber-300"><span>{l.region} · {l.reach}</span><span>Read: {l.readRate}</span></div>
                      <div>{l.text}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* WEBRTC CALL OVERLAY */}
      {activeCall && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 flex flex-col items-center justify-between p-6">
          <div className="text-center mt-6">
            <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold">End-to-End Encrypted {activeCall.mode}</span>
            <h2 className="text-2xl font-extrabold mt-2">{activeCall.title}</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 w-full max-w-2xl">
            {(activeCall.isGroup ? ['You (Host)', 'Amma ❤️', 'Nanna', 'Ravi'] : ['You', activeCall.title]).map((p) => (
              <div key={p} className="h-44 rounded-2xl bg-slate-900 border border-slate-700 flex flex-col items-center justify-center gap-2">
                <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center font-extrabold text-lg">{p.charAt(0)}</div>
                <span className="text-xs font-bold">{p}</span>
              </div>
            ))}
          </div>
          <button onClick={() => setActiveCall(null)} className="w-16 h-16 rounded-full bg-rose-600 text-white text-xl mb-6"><i className="fa-solid fa-phone-slash"></i></button>
        </div>
      )}

      {/* LIGHTBOX */}
      {lightboxMedia && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-slate-900 rounded-3xl overflow-hidden border border-slate-700">
            <div className="px-4 py-3 flex justify-between items-center border-b border-slate-800">
              <span className="text-xs font-bold text-amber-300">{lightboxMedia.caption}</span>
              <button onClick={() => setLightboxMedia(null)} className="px-3 py-1 rounded bg-slate-800 text-xs">Close</button>
            </div>
            <img src={lightboxMedia.url} alt="Preview" className="max-h-[65vh] mx-auto" />
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl bg-slate-900 border border-blue-500 text-white text-xs font-bold shadow-2xl">
          <i className="fa-solid fa-circle-check text-blue-400 mr-2"></i>{toast}
        </div>
      )}
    </div>
  );
}

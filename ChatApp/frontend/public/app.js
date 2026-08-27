(() => {
    const loginView = document.getElementById('login');
    const chatView = document.getElementById('chat');
    const loginForm = document.getElementById('login-form');
    const usernameInput = document.getElementById('username');
    const channelInput = document.getElementById('channel');
    const meUsername = document.getElementById('me-username');
    const currentChannelLabel = document.getElementById('current-channel');
    const channelListEl = document.getElementById('channel-list');
    const newChannelForm = document.getElementById('new-channel-form');
    const newChannelInput = document.getElementById('new-channel');
    const messagesEl = document.getElementById('messages');
    const messageForm = document.getElementById('message-form');
    const messageInput = document.getElementById('message-input');

    let socket = null;
    let username = '';
    let currentChannel = '';

    function renderMarkdown(text) {
        // marked@0.3.5 exposes a single callable function, not .parse().
        return marked(text, { breaks: true, sanitize: true });
        // return marked(text);
    }

    // --- Rendering ------------------------------------------------------
    function appendMessage({ username: from, content, timestamp }, kind = 'message') {
        const el = document.createElement('div');
        el.className = `msg msg-${kind}`;
        const time = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        if (kind === 'system') {
            el.innerHTML = `<span class="msg-time">${time}</span> <span class="msg-system">${escapeText(content)}</span>`;
        } else {
            const bodyHtml = renderMarkdown(content);
            el.innerHTML = `
                <div class="msg-meta"><strong>${escapeText(from)}</strong> <span class="msg-time">${time}</span></div>
                <div class="msg-body">${bodyHtml}</div>`;
        }
        messagesEl.appendChild(el);
        messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    function escapeText(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function renderChannelList(channels) {
        channelListEl.innerHTML = '';
        const all = new Set(channels || []);
        all.add(currentChannel);
        for (const channel of all) {
            const li = document.createElement('li');
            li.textContent = channel;
            li.className = channel === currentChannel ? 'active' : '';
            li.addEventListener('click', () => switchChannel(channel));
            channelListEl.appendChild(li);
        }
    }

    // --- Networking -------------------------------------------------------
    function connect() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        socket = new WebSocket(`${protocol}//${window.location.host}/ws/chat`);

        socket.addEventListener('open', () => join(currentChannel));

        socket.addEventListener('message', (event) => {
            const data = JSON.parse(event.data);
            switch (data.type) {
                case 'history':
                    messagesEl.innerHTML = '';
                    currentChannelLabel.textContent = data.channel;
                    (data.messages || []).forEach((m) => appendMessage(m, 'message'));
                    break;
                case 'message':
                    if (data.channel === currentChannel) appendMessage(data, 'message');
                    break;
                case 'system':
                    if (data.channel === currentChannel) appendMessage(data, 'system');
                    break;
                case 'channels':
                    renderChannelList(data.channels);
                    break;
                case 'error':
                    console.error('Server error:', data.content);
                    break;
            }
        });

        socket.addEventListener('close', () => {
            appendMessage({ content: 'Disconnected. Reconnecting…', timestamp: Date.now() }, 'system');
            setTimeout(connect, 2000);
        });
    }

    function join(channel) {
        currentChannel = channel;
        currentChannelLabel.textContent = channel;
        send({ type: 'join', channel, username });
    }

    function switchChannel(channel) {
        if (channel === currentChannel || socket.readyState !== WebSocket.OPEN) return;
        join(channel);
    }

    function send(payload) {
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify(payload));
        }
    }

    // --- UI wiring --------------------------------------------------------
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        username = usernameInput.value.trim();
        const channel = channelInput.value.trim().toLowerCase().replace(/\s+/g, '-') || 'general';
        if (!username) return;

        await fetch('/api/login', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username }),
        });

        meUsername.textContent = username;
        loginView.classList.add('hidden');
        chatView.classList.remove('hidden');
        currentChannel = channel;
        connect();
    });

    newChannelForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const channel = newChannelInput.value.trim().toLowerCase().replace(/\s+/g, '-');
        if (channel) switchChannel(channel);
        newChannelInput.value = '';
    });

    messageForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const content = messageInput.value;
        if (!content.trim()) return;
        send({ type: 'message', channel: currentChannel, content });
        messageInput.value = '';
    });
})();

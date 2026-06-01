const UNTITLED = "新聊天";

function defaultNow() {
  return new Date().toISOString();
}

function defaultId() {
  return `chat-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function titleFromMessages(messages) {
  const firstUserMessage = messages.find((message) => message.role === "user" && message.content);
  if (!firstUserMessage) {
    return UNTITLED;
  }

  const singleLine = firstUserMessage.content.replace(/\s+/g, " ").trim();
  return singleLine.length > 32 ? `${singleLine.slice(0, 32)}...` : singleLine;
}

function titleForConversation(conversation, messages) {
  if (conversation.customTitle) {
    return conversation.title || UNTITLED;
  }

  return titleFromMessages(messages);
}

function makeConversation({ id, title = UNTITLED, messages = [], now = defaultNow }) {
  const timestamp = now();
  return {
    id,
    title: title || titleFromMessages(messages),
    customTitle: false,
    pinned: false,
    messages,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function normalizeConversation(conversation, fallbackId, now) {
  const messages = Array.isArray(conversation.messages) ? conversation.messages : [];
  const updatedAt =
    conversation.updatedAt ||
    messages[messages.length - 1]?.createdAt ||
    conversation.createdAt ||
    now();

  return {
    id: conversation.id || fallbackId,
    title: conversation.title || titleFromMessages(messages),
    customTitle: Boolean(conversation.customTitle),
    pinned: Boolean(conversation.pinned),
    messages,
    createdAt: conversation.createdAt || updatedAt,
    updatedAt,
  };
}

function sortConversations(conversations) {
  return [...conversations].sort((a, b) => {
    if (Boolean(a.pinned) !== Boolean(b.pinned)) {
      return a.pinned ? -1 : 1;
    }

    return String(b.updatedAt).localeCompare(String(a.updatedAt));
  });
}

function normalizeChats(rawChats = {}, options = {}) {
  const now = options.now || defaultNow;
  const ids = options.ids || defaultId;

  if (Array.isArray(rawChats.conversations) && rawChats.conversations.length > 0) {
    const conversations = sortConversations(
      rawChats.conversations.map((conversation) => normalizeConversation(conversation, ids(), now))
    );
    const activeConversationId = conversations.some((item) => item.id === rawChats.activeConversationId)
      ? rawChats.activeConversationId
      : conversations[0].id;

    return { activeConversationId, conversations };
  }

  if (Array.isArray(rawChats.messages) && rawChats.messages.length > 0) {
    const id = ids();
    const conversation = normalizeConversation(
      {
        id,
        title: titleFromMessages(rawChats.messages),
        messages: rawChats.messages,
      },
      id,
      now
    );
    return { activeConversationId: id, conversations: [conversation] };
  }

  const conversation = makeConversation({ id: ids(), now });
  return { activeConversationId: conversation.id, conversations: [conversation] };
}

function activeConversation(chats) {
  return chats.conversations.find((conversation) => conversation.id === chats.activeConversationId) || chats.conversations[0];
}

function replaceConversation(chats, replacement) {
  return {
    activeConversationId: replacement.id,
    conversations: sortConversations(
      chats.conversations.map((conversation) => (conversation.id === replacement.id ? replacement : conversation))
    ),
  };
}

function appendMessagesToActive(chats, messages, options = {}) {
  const now = options.now || defaultNow;
  const active = activeConversation(chats);
  const nextMessages = [...active.messages, ...messages];
  const replacement = {
    ...active,
    title: titleForConversation(active, nextMessages),
    messages: nextMessages,
    updatedAt: now(),
  };

  return replaceConversation(chats, replacement);
}

function createConversation(chats, options = {}) {
  const now = options.now || defaultNow;
  const ids = options.ids || defaultId;
  const conversation = makeConversation({ id: ids(), now });
  return {
    activeConversationId: conversation.id,
    conversations: sortConversations([conversation, ...chats.conversations]),
  };
}

function setActiveConversation(chats, conversationId) {
  if (!chats.conversations.some((conversation) => conversation.id === conversationId)) {
    return chats;
  }

  return {
    ...chats,
    activeConversationId: conversationId,
  };
}

function deleteConversation(chats, conversationId, options = {}) {
  const now = options.now || defaultNow;
  const ids = options.ids || defaultId;
  const conversations = chats.conversations.filter((conversation) => conversation.id !== conversationId);

  if (!conversations.length) {
    const conversation = makeConversation({ id: ids(), now });
    return {
      activeConversationId: conversation.id,
      conversations: [conversation],
    };
  }

  const activeConversationId = conversations.some((conversation) => conversation.id === chats.activeConversationId)
    ? chats.activeConversationId
    : conversations[0].id;

  return {
    activeConversationId,
    conversations: sortConversations(conversations),
  };
}

function renameConversation(chats, conversationId, title, options = {}) {
  const now = options.now || defaultNow;
  const cleanTitle = String(title || "").replace(/\s+/g, " ").trim();
  if (!cleanTitle) {
    return chats;
  }

  const conversation = chats.conversations.find((item) => item.id === conversationId);
  if (!conversation) {
    return chats;
  }

  return replaceConversation(chats, {
    ...conversation,
    title: cleanTitle,
    customTitle: true,
    updatedAt: now(),
  });
}

function togglePinnedConversation(chats, conversationId, pinned, options = {}) {
  const now = options.now || defaultNow;
  const updatedConversations = chats.conversations.map((conversation) =>
    conversation.id === conversationId
      ? {
          ...conversation,
          pinned: Boolean(pinned),
          updatedAt: now(),
        }
      : conversation
  );

  return {
    activeConversationId: chats.activeConversationId,
    conversations: sortConversations(updatedConversations),
  };
}

module.exports = {
  normalizeChats,
  createConversation,
  appendMessagesToActive,
  setActiveConversation,
  deleteConversation,
  renameConversation,
  togglePinnedConversation,
  activeConversation,
};

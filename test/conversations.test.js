const test = require("node:test");
const assert = require("node:assert/strict");

const {
  normalizeChats,
  createConversation,
  appendMessagesToActive,
  setActiveConversation,
  deleteConversation,
  clearConversations,
  renameConversation,
  togglePinnedConversation,
  activeConversation,
} = require("../src/conversations");

const now = () => "2026-05-31T12:00:00.000Z";
let idNumber = 0;
const ids = () => `chat-${++idNumber}`;

test("migrates legacy single-message-list chats into one conversation", () => {
  idNumber = 0;
  const chats = normalizeChats(
    {
      messages: [{ role: "user", content: "hello old chat", createdAt: "2026-05-30T10:00:00.000Z" }],
    },
    { now, ids }
  );

  assert.equal(chats.activeConversationId, "chat-1");
  assert.equal(chats.conversations.length, 1);
  assert.equal(chats.conversations[0].title, "hello old chat");
  assert.equal(chats.conversations[0].messages.length, 1);
});

test("creates new conversation without deleting older conversations", () => {
  idNumber = 0;
  const first = normalizeChats({}, { now, ids });
  const withMessage = appendMessagesToActive(
    first,
    [{ role: "user", content: "first chat", createdAt: now() }],
    { now }
  );
  const second = createConversation(withMessage, { now, ids });

  assert.equal(second.conversations.length, 2);
  assert.equal(activeConversation(second).title, "新聊天");
  assert.deepEqual(
    second.conversations.find((conversation) => conversation.title === "first chat").messages.map((message) => message.content),
    ["first chat"]
  );
});

test("updates active conversation title from first user message", () => {
  idNumber = 0;
  const chats = normalizeChats({}, { now, ids });
  const updated = appendMessagesToActive(
    chats,
    [
      { role: "user", content: "请帮我写一个旅行计划，需要温柔一点", createdAt: now() },
      { role: "assistant", content: "当然可以。", createdAt: now() },
    ],
    { now }
  );

  assert.equal(activeConversation(updated).title, "请帮我写一个旅行计划，需要温柔一点");
});

test("switches active conversation by id", () => {
  idNumber = 0;
  const first = normalizeChats({}, { now, ids });
  const second = createConversation(first, { now, ids });
  const switched = setActiveConversation(second, "chat-1");

  assert.equal(switched.activeConversationId, "chat-1");
});

test("deletes a conversation and keeps another active", () => {
  idNumber = 0;
  const first = normalizeChats({}, { now, ids });
  const second = createConversation(first, { now, ids });
  const deleted = deleteConversation(second, "chat-2", { now, ids });

  assert.equal(deleted.conversations.length, 1);
  assert.equal(deleted.activeConversationId, "chat-1");
});

test("deleting the last conversation creates a blank one", () => {
  idNumber = 0;
  const chats = normalizeChats({}, { now, ids });
  const deleted = deleteConversation(chats, "chat-1", { now, ids });

  assert.equal(deleted.conversations.length, 1);
  assert.equal(deleted.activeConversationId, "chat-2");
  assert.equal(activeConversation(deleted).title, "新聊天");
});

test("clearing conversations leaves one blank active chat", () => {
  idNumber = 0;
  const first = appendMessagesToActive(
    normalizeChats({}, { now, ids }),
    [{ role: "user", content: "first chat", createdAt: now() }],
    { now }
  );
  const second = createConversation(first, { now, ids });

  const cleared = clearConversations(second, { now, ids });

  assert.equal(cleared.conversations.length, 1);
  assert.equal(cleared.activeConversationId, "chat-3");
  assert.equal(activeConversation(cleared).messages.length, 0);
});

test("renames a conversation and preserves custom title after new messages", () => {
  idNumber = 0;
  const chats = normalizeChats({}, { now, ids });
  const renamed = renameConversation(chats, "chat-1", "旅行助手", { now });
  const updated = appendMessagesToActive(
    renamed,
    [{ role: "user", content: "这个不应该覆盖标题", createdAt: now() }],
    { now }
  );

  assert.equal(activeConversation(updated).title, "旅行助手");
});

test("pins conversations above unpinned conversations", () => {
  idNumber = 0;
  const first = appendMessagesToActive(
    normalizeChats({}, { now, ids }),
    [{ role: "user", content: "first", createdAt: "2026-05-31T11:00:00.000Z" }],
    { now: () => "2026-05-31T11:00:00.000Z" }
  );
  const second = appendMessagesToActive(
    createConversation(first, { now, ids }),
    [{ role: "user", content: "second", createdAt: "2026-05-31T12:00:00.000Z" }],
    { now: () => "2026-05-31T12:00:00.000Z" }
  );
  const pinned = togglePinnedConversation(second, "chat-1", true, { now });

  assert.deepEqual(
    pinned.conversations.map((conversation) => conversation.id),
    ["chat-1", "chat-2"]
  );
  assert.equal(pinned.conversations[0].pinned, true);
});

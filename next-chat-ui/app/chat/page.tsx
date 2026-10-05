"use client";

import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import styles from "./page.module.css";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const STORAGE_KEY = "aparna-chat-session";

function createSessionId() {
  return `aparna-chat-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function createMessage(
  role: Message["role"],
  content: string
): Message {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    role,
    content,
  };
}

export default function ChatPage() {
  const [sessionId, setSessionId] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [error, setError] = useState("");

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const existingSession = window.localStorage.getItem(STORAGE_KEY);

    if (existingSession) {
      setSessionId(existingSession);
    } else {
      const newSession = createSessionId();
      window.localStorage.setItem(STORAGE_KEY, newSession);
      setSessionId(newSession);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, isThinking]);

  function startNewChat() {
    const newSession = createSessionId();

    window.localStorage.setItem(STORAGE_KEY, newSession);

    setSessionId(newSession);
    setMessages([]);
    setInput("");
    setError("");

    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  }

  async function sendMessage() {
    const text = input.trim();

    if (!text || isThinking || !sessionId) {
      return;
    }

    const userMessage = createMessage("user", text);

    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    setInput("");
    setError("");
    setIsThinking(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session_id: sessionId,
          messages: nextMessages.map((message) => ({
            role: message.role,
            content: message.content,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok || data?.status !== "ok") {
        throw new Error(
          data?.error || "Aparna could not respond right now."
        );
      }

      const assistantMessage = createMessage(
        "assistant",
        data.reply
      );

      setMessages((current) => [
        ...current,
        assistantMessage,
      ]);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Something went wrong.";

      setError(message);
    } finally {
      setIsThinking(false);

      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    await sendMessage();
  }

  function handleKeyDown(
    event: KeyboardEvent<HTMLTextAreaElement>
  ) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.shell}>
        <header className={styles.header}>
          <div>
            <div className={styles.eyebrow}>PRIVATE CHAT</div>

            <h1 className={styles.title}>Aparna</h1>

            <div className={styles.status}>
              <span className={styles.statusDot} />
              online
            </div>
          </div>

          <button
            type="button"
            className={styles.newChatButton}
            onClick={startNewChat}
          >
            New chat
          </button>
        </header>

        <div className={styles.contextBar}>
          <span className={styles.spark}>✦</span>

          <span>
            Aparna remembers the conversation and brings in
            deeper context only when it matters.
          </span>
        </div>

        <section className={styles.messages}>
          {messages.length === 0 && (
            <div className={styles.emptyState}>
              <div className={styles.emptyAvatar}>A</div>

              <h2>hey.</h2>

              <p>
                i'm here. talk to me.
              </p>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`${styles.messageRow} ${
                message.role === "user"
                  ? styles.userRow
                  : styles.assistantRow
              }`}
            >
              <div
                className={`${styles.message} ${
                  message.role === "user"
                    ? styles.userMessage
                    : styles.assistantMessage
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}

          {isThinking && (
            <div
              className={`${styles.messageRow} ${styles.assistantRow}`}
            >
              <div
                className={`${styles.message} ${styles.assistantMessage} ${styles.thinking}`}
              >
                <span />
                <span />
                <span />
              </div>
            </div>
          )}

          {error && (
            <div className={styles.error}>
              {error}
            </div>
          )}

          <div ref={messagesEndRef} />
        </section>

        <form
          className={styles.composer}
          onSubmit={handleSubmit}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="say something..."
            rows={1}
            disabled={isThinking || !sessionId}
          />

          <button
            type="submit"
            disabled={
              !input.trim() ||
              isThinking ||
              !sessionId
            }
            aria-label="Send message"
          >
            ↑
          </button>
        </form>

        <div className={styles.footer}>
          Enter to send · Shift + Enter for a new line
        </div>
      </section>
    </main>
  );
}
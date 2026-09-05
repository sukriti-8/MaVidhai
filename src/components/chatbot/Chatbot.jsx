"use client";

import { useState } from "react";

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async () => {
    if (!message.trim() || isLoading) return;

    const userMessage = message.trim();

    setMessages((currentMessages) => [
      ...currentMessages,
      {
        role: "user",
        content: userMessage,
      },
    ]);

    setMessage("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      setMessages((currentMessages) => [
        ...currentMessages,
        {
          role: "assistant",
          content: data.reply,
        },
      ]);
    } catch (error) {
      console.error("Chatbot error:", error);

      setMessages((currentMessages) => [
        ...currentMessages,
        {
          role: "assistant",
          content: "Sorry, I couldn't process your message.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Chatbot Button */}
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#C9A227] text-2xl text-white shadow-lg transition hover:bg-[#B8860B]"
        aria-label={
          isOpen
            ? "Close MaVidhai AI assistant"
            : "Open MaVidhai AI assistant"
        }
      >
        {isOpen ? "×" : "💬"}
      </button>

      {/* Chatbot Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 flex h-[500px] w-[360px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">

          {/* Header */}
          <div className="flex items-center justify-between bg-[#C9A227] px-5 py-4 text-white">
            <div>
              <h2 className="font-semibold">MaVidhai AI</h2>

              <p className="text-xs opacity-90">
                How can we help you?
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-xl hover:opacity-80"
              aria-label="Close chatbot"
            >
              ×
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 space-y-3 overflow-y-auto bg-[#FAF8F3] p-4">

            {/* Welcome Message */}
            <div className="mr-auto max-w-[80%] rounded-xl bg-white p-3 text-sm text-gray-700 shadow-sm">
              Hi! 👋 How can I help you today?
            </div>

            {/* Conversation */}
            {messages.map((chatMessage, index) => (
              <div
                key={index}
                className={
                  chatMessage.role === "user"
                    ? "ml-auto max-w-[80%] rounded-xl bg-[#C9A227] p-3 text-sm text-white shadow-sm"
                    : "mr-auto max-w-[80%] rounded-xl bg-white p-3 text-sm text-gray-700 shadow-sm"
                }
              >
                {chatMessage.content}
              </div>
            ))}

            {/* Thinking */}
            {isLoading && (
              <div className="mr-auto max-w-[80%] rounded-xl bg-white p-3 text-sm text-gray-500 shadow-sm">
                Thinking...
              </div>
            )}
          </div>

          {/* Input */}
          <div className="flex gap-2 border-t border-gray-200 bg-white p-3">

            <input
              type="text"
              placeholder="Ask something..."
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#C9A227] focus:outline-none disabled:bg-gray-100"
              aria-label="Message MaVidhai AI"
            />

            <button
              type="button"
              onClick={handleSendMessage}
              disabled={isLoading || !message.trim()}
              className="rounded-lg bg-[#C9A227] px-4 py-2 text-white transition hover:bg-[#B8860B] disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Send message"
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
}
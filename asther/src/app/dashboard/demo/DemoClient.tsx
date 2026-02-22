"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
  imageUrl?: string;
}

export default function DemoClient({ bearerToken }: { bearerToken: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [showImageInput, setShowImageInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [participantId, setParticipantId] = useState("");
  const [userName, setUserName] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Generate a demo participantId (not persisted to DB)
    const storedId = sessionStorage.getItem("demo-participant-id");
    const storedName = sessionStorage.getItem("demo-user-name");
    
    if (storedId) {
      setParticipantId(storedId);
    } else {
      const newId = `demo-${Date.now()}`;
      sessionStorage.setItem("demo-participant-id", newId);
      setParticipantId(newId);
    }
    
    if (storedName) {
      setUserName(storedName);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const activeParticipantId = participantId || `demo-${Date.now()}`;
    if (!participantId) {
      setParticipantId(activeParticipantId);
    }

    const userMessage = input.trim();
    const currentImageUrl = imageUrl.trim() || undefined;
    setInput("");
    setImageUrl("");
    setShowImageInput(false);
    
    // Add user message with optional image
    setMessages((prev) => [...prev, { 
      role: "user", 
      content: userMessage,
      imageUrl: currentImageUrl 
    }]);
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${bearerToken}`,
        },
        body: JSON.stringify({
          participantId: activeParticipantId,
          message: userMessage,
          userName: userName || undefined,
          imageUrl: currentImageUrl,
          saveHistory: false, // Demo mode: don't save to database
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader");

      const decoder = new TextDecoder();
      let assistantMessage = "";

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        const lines = text.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") break;

            try {
              const { content } = JSON.parse(data);
              if (content) {
                assistantMessage += content;
                setMessages((prev) => {
                  const newMessages = [...prev];
                  newMessages[newMessages.length - 1] = {
                    role: "assistant",
                    content: assistantMessage,
                  };
                  return newMessages;
                });
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, there was an error processing your message.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function clearChat() {
    setMessages([]);
    // Generate new participantId to start fresh (still not saved to DB)
    const newId = `demo-${Date.now()}`;
    sessionStorage.setItem("demo-participant-id", newId);
    setParticipantId(newId);
  }

  function handleUserNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const name = e.target.value;
    setUserName(name);
    sessionStorage.setItem("demo-user-name", name);
  }

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-semibold text-stone-900">Demo</h1>
          <p className="text-stone-500 text-sm">Test the chatbot and RAG system</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={userName}
            onChange={handleUserNameChange}
            placeholder="Your name (optional)"
            suppressHydrationWarning
            className="px-3 py-1.5 text-sm bg-white border border-stone-300 rounded-md text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent w-40"
          />
          <button
            onClick={clearChat}
            className="px-3 py-1.5 text-sm text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-md"
          >
            New Chat
          </button>
        </div>
      </div>

      <div className="flex-1 bg-white border border-stone-200 rounded-lg overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-stone-400 py-12">
              <p className="text-sm">Send a message to start the conversation</p>
              <p className="text-xs mt-2 text-stone-500">
                💡 Make sure RAG is enabled in Config to use knowledge base
              </p>
              <p className="text-xs mt-1">
                Session ID:{" "}
                <code className="font-mono" suppressHydrationWarning>
                  {participantId || "Generating..."}
                </code>
              </p>
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] px-4 py-2.5 rounded-lg text-sm ${
                  message.role === "user"
                    ? "bg-stone-900 text-white"
                    : "bg-stone-100 text-stone-900"
                }`}
              >
                {message.imageUrl && (
                  <div className="mb-2">
                    <img 
                      src={message.imageUrl} 
                      alt="User uploaded" 
                      className="max-w-full max-h-48 rounded object-contain"
                    />
                  </div>
                )}
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}

          {loading && messages[messages.length - 1]?.role === "user" && (
            <div className="flex justify-start">
              <div className="bg-stone-100 text-stone-500 px-4 py-2.5 rounded-lg text-sm">
                <span className="inline-flex items-center gap-1">
                  <span className="size-1.5 bg-stone-400 rounded-full animate-pulse" />
                  <span className="size-1.5 bg-stone-400 rounded-full animate-pulse delay-75" />
                  <span className="size-1.5 bg-stone-400 rounded-full animate-pulse delay-150" />
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSubmit} className="border-t border-stone-200 p-4">
          {showImageInput && (
            <div className="mb-3 flex gap-2">
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Enter image URL..."
                className="flex-1 px-3 py-2 text-sm bg-white border border-stone-300 rounded-md text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => {
                  setShowImageInput(false);
                  setImageUrl("");
                }}
                className="px-3 py-2 text-stone-500 hover:text-stone-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
          {imageUrl && (
            <div className="mb-3 p-2 bg-stone-50 rounded-md flex items-center gap-2">
              <img src={imageUrl} alt="Preview" className="h-12 w-12 object-cover rounded" />
              <span className="text-xs text-stone-500 truncate flex-1">{imageUrl}</span>
            </div>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowImageInput(!showImageInput)}
              disabled={loading}
              className="px-3 py-2 text-stone-500 hover:text-stone-700 hover:bg-stone-100 rounded-md disabled:opacity-50"
              title="Add image URL"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              disabled={loading}
              suppressHydrationWarning
              className="flex-1 px-3 py-2 bg-white border border-stone-300 rounded-md text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent disabled:bg-stone-50"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-4 py-2 bg-stone-900 hover:bg-stone-800 disabled:bg-stone-300 text-white font-medium rounded-md"
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

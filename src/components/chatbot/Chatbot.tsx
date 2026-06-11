import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { sendChatMessage } from "../../utils/chatbotApi";
import type { ChatMessage } from "../../utils/chatbotApi";
import "./chatbot.scss";

interface BotMessage extends ChatMessage {
  route?: string;
}

const WELCOME: BotMessage = {
  role: "bot",
  text: "Hi! I'm the Noris Crusher assistant. Ask me anything about the system — how to add a vehicle, where to find reports, anything.",
  ts: Date.now(),
};

const Chatbot: React.FC = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState<boolean>(false);
  const [messages, setMessages] = useState<BotMessage[]>([WELCOME]);
  const [input, setInput] = useState<string>("");
  const [sending, setSending] = useState<boolean>(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, open]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;

    const userMsg: BotMessage = { role: "user", text, ts: Date.now() };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setSending(true);

    try {
      const { reply, route } = await sendChatMessage({
        message: text,
        history: next.map((m) => ({ role: m.role, text: m.text })),
      });
      setMessages((curr) => [
        ...curr,
        { role: "bot", text: reply, ts: Date.now(), route },
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleGo = (route: string) => {
    navigate(route);
    setOpen(false);
  };

  return (
    <div className="noris-chatbot">
      {open && (
        <div className="noris-chatbot__panel" role="dialog" aria-label="Chatbot">
          <div className="noris-chatbot__header">
            <div className="noris-chatbot__title">
              <span className="noris-chatbot__avatar">
                <i className="bi bi-robot" />
              </span>
              <div>
                <div className="noris-chatbot__name">Noris Assistant</div>
                <div className="noris-chatbot__status">Online</div>
              </div>
            </div>
            <button
              type="button"
              className="noris-chatbot__close"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
            >
              <i className="bi bi-x-lg" />
            </button>
          </div>

          <div className="noris-chatbot__messages" ref={listRef}>
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`noris-chatbot__msg noris-chatbot__msg--${m.role}`}
              >
                <div className="noris-chatbot__bubble">
                  {m.text}
                  {m.role === "bot" && m.route && (
                    <button
                      type="button"
                      className="noris-chatbot__cta"
                      onClick={() => handleGo(m.route!)}
                    >
                      <i className="bi bi-arrow-right-circle" /> Take me there
                    </button>
                  )}
                </div>
              </div>
            ))}
            {sending && (
              <div className="noris-chatbot__msg noris-chatbot__msg--bot">
                <div className="noris-chatbot__bubble noris-chatbot__bubble--typing">
                  <span /> <span /> <span />
                </div>
              </div>
            )}
          </div>

          <div className="noris-chatbot__input">
            <input
              type="text"
              placeholder="Type a message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={sending}
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={sending || !input.trim()}
              aria-label="Send message"
            >
              <i className="bi bi-send-fill" />
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        className={`noris-chatbot__toggle${open ? " is-open" : ""}`}
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close chatbot" : "Open chatbot"}
      >
        <i className={open ? "bi bi-x-lg" : "bi bi-chat-dots-fill"} />
      </button>
    </div>
  );
};

export default Chatbot;

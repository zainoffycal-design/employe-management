import { memo, useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMessageCircle, FiX, FiSend, FiCpu, FiTrash2 } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { useTask } from '../../contexts/TaskContext';
import { useNotification } from '../../contexts/NotificationContext';
import { sendAIChatMessage, isAIChatConfigured } from '../../services/aiChatService';
import { APP_NAME } from '../../constants/app';
import './AIChatbot.scss';

const WELCOME = `Hi! I'm EMS Assistant. I can help you with ${APP_NAME} — navigate pages, check projects & tasks, create/assign/move/delete tasks by title, list users, and explain what you can do based on your role.`;

const AIChatbot = memo(() => {
  const { currentUser } = useAuth();
  const { projects, tasks, createTask, updateTask, deleteTask } = useTask();
  const { notifications } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: WELCOME }
  ]);

  const listRef = useRef(null);
  const inputRef = useRef(null);
  const configured = isAIChatConfigured();

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, loading, open]);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }
  }, [open]);

  const buildContext = useCallback(() => ({
    currentUser,
    projects,
    tasks,
    notifications,
    navigate,
    createTask,
    updateTask,
    deleteTask,
    currentPath: location.pathname
  }), [currentUser, projects, tasks, notifications, navigate, createTask, updateTask, deleteTask, location.pathname]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    if (!configured) {
      setMessages((prev) => [
        ...prev,
        { role: 'user', content: text },
        {
          role: 'assistant',
          content: 'AI is not configured. Add VITE_OPENAI_API_KEY to your .env.local file and restart the dev server.'
        }
      ]);
      setInput('');
      return;
    }

    const userMessage = { role: 'user', content: text };
    const nextMessages = [...messages.filter((m) => m.role !== 'system'), userMessage];
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const apiMessages = nextMessages
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .map((m) => ({ role: m.role, content: m.content }));

      const reply = await sendAIChatMessage(apiMessages, buildContext());
      setMessages((prev) => [...prev, { role: 'assistant', content: reply.content }]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Sorry, something went wrong: ${error.message}` }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([{ role: 'assistant', content: WELCOME }]);
  };

  if (!currentUser) return null;

  return (
    <div className="ai-chatbot">
      <AnimatePresence>
        {open && (
          <motion.div
            className="ai-chatbot__panel"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.2 }}
          >
            <header className="ai-chatbot__header">
              <div className="ai-chatbot__header-info">
                <FiCpu size={20} />
                <div>
                  <strong>EMS Assistant</strong>
                  <span>AI helper for {APP_NAME}</span>
                </div>
              </div>
              <div className="ai-chatbot__header-actions">
                <button type="button" className="ai-chatbot__icon-btn" onClick={clearChat} title="Clear chat">
                  <FiTrash2 size={16} />
                </button>
                <button type="button" className="ai-chatbot__icon-btn" onClick={() => setOpen(false)} title="Close">
                  <FiX size={18} />
                </button>
              </div>
            </header>

            <div className="ai-chatbot__messages" ref={listRef}>
              {messages.map((msg, i) => (
                <div
                  key={`${msg.role}-${i}`}
                  className={`ai-chatbot__message ai-chatbot__message--${msg.role}`}
                >
                  <div className="ai-chatbot__bubble">{msg.content}</div>
                </div>
              ))}
              {loading && (
                <div className="ai-chatbot__message ai-chatbot__message--assistant">
                  <div className="ai-chatbot__bubble ai-chatbot__bubble--typing">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              )}
            </div>

            <footer className="ai-chatbot__footer">
              <textarea
                ref={inputRef}
                className="ai-chatbot__input"
                rows={1}
                placeholder="Ask about projects, tasks, navigation..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
              />
              <button
                type="button"
                className="ai-chatbot__send"
                onClick={handleSend}
                disabled={loading || !input.trim()}
                aria-label="Send message"
              >
                <FiSend size={18} />
              </button>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        className={`ai-chatbot__toggle${open ? ' ai-chatbot__toggle--open' : ''}`}
        onClick={() => setOpen((v) => !v)}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        aria-label={open ? 'Close AI assistant' : 'Open AI assistant'}
      >
        {open ? <FiX size={22} /> : <FiMessageCircle size={22} />}
      </motion.button>
    </div>
  );
});

AIChatbot.displayName = 'AIChatbot';

export default AIChatbot;

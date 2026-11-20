import { useState, useEffect } from "react";
import "./App.css";

const API = "http://localhost:8000";

// Turns the sources into short text, like "rules.pdf p.2"
function showSources(sources) {
  const names = sources.map((s) => `${s.source} p.${s.page}`);
  return [...new Set(names)].join(" · ");
}
function App() {
  // The app's memory
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pieces, setPieces] = useState(0);

  // Gets the number of pieces when the page opens
  useEffect(() => {
    fetch(`${API}/`)
      .then((res) => res.json())
      .then((data) => setPieces(data.pieces))
      .catch(() => {});
  }, []);

  // Adds one message to the chat
  function addMessage(msg) {
    setMessages((old) => [...old, msg]);
  }

  // Empties the messages list
  function clearMessages() {
    setMessages([]);
  }
  async function askQuestion() {
    if (!question.trim()) return;
    const myQuestion = question;
    addMessage({ role: "user", text: myQuestion });
    setQuestion("");
    setLoading(true);
    try {
      const res = await fetch(`${API}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: myQuestion }),
      });
      if (!res.ok) throw new Error("Server error");
      const data = await res.json();
      addMessage({ role: "bot", text: data.answer, sources: data.sources });
    } catch {
      addMessage({ role: "bot", text: "Oops! Is the backend running?" });
    }
    setLoading(false);
  }

  // BONUS: runs when you pick a PDF file
  async function uploadPdf(e) {
    const file = e.target.files[0];
    if (!file) return;
    const form = new FormData();
    form.append("file", file);
    setLoading(true);
    try {
      const res = await fetch(`${API}/upload`, { method: "POST", body: form });
      if (!res.ok) throw new Error("Upload error");
      const data = await res.json();
      addMessage({ role: "bot", text: data.message });
      fetch(`${API}/`)
        .then((res) => res.json())
        .then((d) => setPieces(d.pieces))
        .catch(() => {});
    } catch {
      addMessage({ role: "bot", text: "Upload failed. Try again." });
    }
    setLoading(false);
  }

  return (
    <div className="app">
      <h1>📚 Ask My Notes</h1>
      <p className="pieces">📄 {pieces} pieces in your notes</p>
      <div className="chat">
        {messages.length === 0 && (
          <p className="hint">Ask anything about your notes 👇</p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`msg ${m.role}`}>
            <p>{m.text}</p>
            {m.sources && <small>📄 {showSources(m.sources)}</small>}
          </div>
        ))}
        {loading && <div className="msg bot">Thinking… 🤔</div>}
      </div>
      <div className="ask-box">
        <label className="upload">
          📎 PDF
          <input type="file" accept=".pdf" hidden onChange={uploadPdf} />
        </label>
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && askQuestion()}
          placeholder="Type your question…"
        />
        <button onClick={askQuestion} disabled={loading}>
          Ask
        </button>
        <button onClick={clearMessages} className="clear">
          Clear
        </button>
      </div>
    </div>
  );
}

export default App;




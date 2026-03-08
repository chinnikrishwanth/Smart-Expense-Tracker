import React, { useState, useRef, useEffect } from "react";
import { apiRequest } from "../utils/api";

function FinancialChatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'assistant', text: 'Hello! I am your AI Financial Consultant. How can I help you today?' }
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const toggleChat = () => setIsOpen(!isOpen);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMessage = input.trim();
        setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
        setInput("");
        setLoading(true);

        try {
            const data = await apiRequest('/ai/chat', {
                method: 'POST',
                body: JSON.stringify({ message: userMessage })
            });

            setMessages(prev => [...prev, { role: 'assistant', text: data.reply || "Sorry, I couldn't process that." }]);
        } catch (err) {
            console.error("Chat Error:", err);
            setMessages(prev => [...prev, { role: 'assistant', text: "Error connecting to AI service. Please try again later." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <button
                onClick={toggleChat}
                style={{
                    position: "fixed",
                    bottom: "20px",
                    right: "20px",
                    width: "60px",
                    height: "60px",
                    borderRadius: "30px",
                    background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                    color: "white",
                    border: "none",
                    boxShadow: "0 10px 25px rgba(99,102,241,0.5)",
                    cursor: "pointer",
                    fontSize: "24px",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    zIndex: 9999,
                    transition: "transform 0.3s ease"
                }}
                onMouseEnter={e => e.currentTarget.style.transform = "scale(1.1)"}
                onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
            >
                💬
            </button>

            {isOpen && (
                <div style={{
                    position: "fixed",
                    bottom: "90px",
                    right: "20px",
                    width: "350px",
                    height: "500px",
                    background: "white",
                    borderRadius: "16px",
                    boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                    zIndex: 9999,
                    animation: "slideIn 0.3s ease"
                }}>
                    <div style={{
                        background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                        color: "white",
                        padding: "1rem",
                        fontWeight: "bold",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                    }}>
                        <span>AI Financial Consultant</span>
                        <button onClick={toggleChat} style={{ background: "none", border: "none", color: "white", cursor: "pointer", fontSize: "16px" }}>×</button>
                    </div>

                    <div style={{
                        flex: 1,
                        padding: "1rem",
                        overflowY: "auto",
                        display: "flex",
                        flexDirection: "column",
                        gap: "1rem",
                        background: "#f8fafc"
                    }}>
                        {messages.map((msg, i) => (
                            <div key={i} style={{
                                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                background: msg.role === 'user' ? '#6366f1' : '#e2e8f0',
                                color: msg.role === 'user' ? 'white' : '#1e293b',
                                padding: "0.75rem 1rem",
                                borderRadius: "12px",
                                maxWidth: "80%",
                                lineHeight: "1.4"
                            }}>
                                {msg.text}
                            </div>
                        ))}
                        {loading && (
                            <div style={{ alignSelf: 'flex-start', background: '#e2e8f0', padding: "0.75rem 1rem", borderRadius: "12px", color: "#64748b" }}>
                                Typing...
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <form onSubmit={handleSend} style={{
                        display: "flex",
                        padding: "1rem",
                        borderTop: "1px solid #e2e8f0",
                        background: "white"
                    }}>
                        <input
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            placeholder="Ask about your finances..."
                            style={{
                                flex: 1,
                                padding: "0.75rem",
                                border: "1px solid #cbd5e1",
                                borderRadius: "8px 0 0 8px",
                                outline: "none"
                            }}
                        />
                        <button type="submit" disabled={loading} style={{
                            background: "#6366f1",
                            color: "white",
                            border: "none",
                            padding: "0 1rem",
                            borderRadius: "0 8px 8px 0",
                            cursor: "pointer",
                            fontWeight: "bold"
                        }}>
                            Send
                        </button>
                    </form>
                </div>
            )}
        </>
    );
}

export default FinancialChatbot;

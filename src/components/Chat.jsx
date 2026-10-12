import React, { useState } from 'react';
import { fetchChatResponse } from '../deepseekService';


const Chat = () => {
    const [userMessage, setUserMessage] = useState('');
    const [chatResponse, setChatResponse] = useState('');
    const [loading, setLoading] = useState(false);
    const handleSendMessage = async () => {
      if (!userMessage.trim()) return;
      setLoading(true);
      try {
        const response = await fetchChatResponse(userMessage);
        setChatResponse(response.messages[0]?.content || 'No response');
      } catch (error) {
        setChatResponse('An error occurred. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    return (
      <div style={{ padding: '20px' }}>
        <h1>Deepseek Chat</h1>
        <textarea
          rows="4"
          cols="50"
          value={userMessage}
          onChange={(e) => setUserMessage(e.target.value)}
          placeholder="Type your message here..."
        />
        <br />
        <button onClick={handleSendMessage} disabled={loading}>
          {loading ? 'Sending...' : 'Send'}
        </button>
        <div style={{ marginTop: '20px' }}>
          <h3>Response:</h3>
          <p>{chatResponse}</p>
        </div>
      </div>
    );
  };
  export default Chat;
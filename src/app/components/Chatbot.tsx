import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import * as THREE from 'three';

export interface ChatbotProps {
  visible: boolean;
  onSend?: (message: string) => void;
}

export interface ChatbotHandle {
  getTexture: () => THREE.CanvasTexture | null;
  updateTexture: () => void;
}

const Chatbot = forwardRef<ChatbotHandle, ChatbotProps>(({ visible }, ref) => {
  const [chatMessages, setChatMessages] = useState<{ text: string; isUser: boolean }[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const chatCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const chatTextureRef = useRef<THREE.CanvasTexture | null>(null);

  // Draw chat UI on canvas
  const updateProjectorTexture = () => {
    if (!chatCanvasRef.current) return;
    const canvas = chatCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(255, 182, 193, 0.95)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    let y = 30;
    chatMessages.slice(-7).forEach((message) => {
      ctx.fillStyle = message.isUser ? '#FFB6C1' : '#FFFFFF';
      const x = message.isUser ? canvas.width - 320 : 20;
      const width = 300;
      ctx.beginPath();
      ctx.roundRect(x, y, width, 40, 15);
      ctx.fill();
      ctx.fillStyle = message.isUser ? '#FFFFFF' : '#000000';
      ctx.font = '18px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(message.text, x + 15, y + 25, width - 30);
      y += 50;
    });
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.beginPath();
    ctx.roundRect(20, canvas.height - 70, canvas.width - 40, 40, 10);
    ctx.fill();
    ctx.fillStyle = '#888';
    ctx.font = '18px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(inputMessage || 'Type your message...', 35, canvas.height - 42);
    if (chatTextureRef.current) {
      chatTextureRef.current.needsUpdate = true;
    }
  };

  useEffect(() => {
    updateProjectorTexture();
  }, [chatMessages, inputMessage]);

  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 500;
    chatCanvasRef.current = canvas;
    const texture = new THREE.CanvasTexture(canvas);
    chatTextureRef.current = texture;
    updateProjectorTexture();
    return () => {
      chatCanvasRef.current = null;
      chatTextureRef.current = null;
    };
    // eslint-disable-next-line
  }, []);

  const handleSendMessage = () => {
    if (inputMessage.trim()) {
      setChatMessages(prev => [...prev, { text: inputMessage, isUser: true }]);
      setTimeout(() => {
        setChatMessages(prev => [...prev, {
          text: "I'm a friendly robot! How can I help you today?",
          isUser: false
        }]);
      }, 1000);
      setInputMessage('');
    }
  };

  useImperativeHandle(ref, () => ({
    getTexture: () => chatTextureRef.current,
    updateTexture: updateProjectorTexture,
  }), [chatTextureRef, updateProjectorTexture]);

  if (!visible) return null;

  return (
    <>
      <canvas ref={chatCanvasRef} width={800} height={500} style={{ display: 'none' }} />
      <div style={{
        position: 'fixed',
        left: '50%',
        bottom: '40px',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        display: 'flex',
        gap: '10px',
        background: 'rgba(255,255,255,0.8)',
        borderRadius: '10px',
        padding: '10px 20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <input
          type="text"
          value={inputMessage}
          onChange={e => setInputMessage(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            fontSize: '16px',
            background: 'transparent'
          }}
          placeholder="Type your message..."
        />
        <button
          onClick={handleSendMessage}
          style={{
            background: '#FFB6C1',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 16px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          Send
        </button>
      </div>
    </>
  );
});

export default Chatbot; 
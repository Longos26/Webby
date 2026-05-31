import { useEffect, useRef, useState } from 'react';

export const useWebSocket = (userId) => {
  const [jobUpdates, setJobUpdates] = useState({});
  const [activities, setActivities] = useState([]);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!userId) return;

    // FIXED: Use correct WebSocket URL
    const wsUrl = process.env.REACT_APP_WS_URL || 'wss://webby-1osa.onrender.com';
    const ws = new WebSocket(`${wsUrl}/ws/jobs/${userId}`);
    socketRef.current = ws;

    ws.onopen = () => console.log('WebSocket connected');
    
    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        if (message.type === 'job_update') {
          setJobUpdates(prev => ({
            ...prev,
            [message.data.id]: message.data
          }));
        } 
        else if (message.type === 'activity') {
          setActivities(prev => [message.data, ...prev].slice(0, 20));
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => console.log('WebSocket disconnected');
    
    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [userId]);

  return { jobUpdates, activities };
};
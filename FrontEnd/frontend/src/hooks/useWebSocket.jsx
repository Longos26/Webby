import { useEffect, useRef, useState } from 'react';

export const useWebSocket = (userId) => {
  const [jobUpdates, setJobUpdates] = useState({});
  const [activities, setActivities] = useState([]);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!userId) return;

    const ws = new WebSocket(`ws://localhost:8000/api/ws/jobs/${userId}`);
    socketRef.current = ws;

    ws.onopen = () => console.log('WebSocket connected');
    
    ws.onmessage = (event) => {
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
    };

    ws.onclose = () => console.log('WebSocket disconnected');
    
    return () => {
      ws.close();
    };
  }, [userId]);

  return { jobUpdates, activities };
};
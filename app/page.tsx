'use client'

import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { Chart } from '../components/Chart';
import { BloodTestChatbot } from '../components/Chatbot';
import { Form } from '../components/Form';
import { Button } from "@/components/ui/button";
import { clearAllReadings } from '../utils/storage';
import Explanations from '../components/Results';
import Suggestions from '../components/Improvement';

interface Suggestion {
  [key: string]: string;
}

interface Explanation {
  [key: string]: string;
}

interface HealthData {
  Explanations: Explanation[];
  Suggestions: Suggestion[];
}

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function Dashboard() {
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [noDataMessage, setNoDataMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [dataCleared, setDataCleared] = useState<boolean>(false);
  const [showChatbot, setShowChatbot] = useState<boolean>(true);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const newSocket = io(apiUrl);
    setSocket(newSocket);

    // WebSocket event for receiving new readings
    newSocket.on('new_reading', () => {
      fetchInsights();
      setDataCleared(false);
      setShowChatbot(true);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/api/generate_insights`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.statusText}`);
      }

      const result = await response.json();
      console.log(result);

      if (result.response_text === "No data found.") {
        setNoDataMessage("No data available.");
        setHealthData(null);
      } else {
        try {
          const parsedData: HealthData = JSON.parse(result.response_text);
          console.log(parsedData);
          setHealthData(parsedData);
          setNoDataMessage('');
        } catch (error) {
          console.error("Error parsing response_text:", error);
          setNoDataMessage("Error processing data.");
        }
      }
    } catch (error) {
      console.error('Fetch error:', error);
      setNoDataMessage("Error fetching data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!dataCleared) {
      fetchInsights();
    }
  }, [dataCleared]);

  const handleClearAll = () => {
    clearAllReadings();
    setHealthData(null);
    setNoDataMessage("No data available.");
    setDataCleared(true);
    setShowChatbot(false);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Metabolic Health Monitor</h1>
        <Button variant="destructive" onClick={handleClearAll} className="mb-4">Clear Session</Button>
        
        {noDataMessage && <div className="text-red-500 font-bold mb-8">{noDataMessage}</div>}

        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <Form onSubmit={() => {}} />
          </div>

          {!dataCleared && <Chart socket={socket} />}
          
          {loading && (
            <div className="flex justify-center items-center mb-8">
              <div className="border-t-4 border-blue-500 border-solid rounded-full w-12 h-12 animate-spin"></div>
            </div>
          )}
          
          {healthData && !dataCleared && !loading && (
            <div className="mt-8 space-y-6">
              <div className="p-4 border rounded-md shadow-md">
                <Explanations explanations={healthData.Explanations} />
              </div>
            </div> 
          )}

          {healthData && !dataCleared && !loading && (  
            <div className="mt-8 space-y-6">
              <div className="p-4 border rounded-md shadow-md">
                <Suggestions suggestions={healthData.Suggestions} />
              </div>
            </div>
          )}

          {healthData && showChatbot && <BloodTestChatbot socket={socket} />}
        </div>
      </div>
    </div>
  );
}

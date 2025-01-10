'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Chart } from '../components/Chart';
import { BloodTestChatbot } from '../components/Chatbot';
import { Form } from '../components/Form';
import { Button } from '@/components/ui/button';
import { clearAllReadings, addReading, generateInsights } from '../utils/storage';
import Explanations from '../components/Results';
import Suggestions from '../components/Improvement';

const Dashboard = () => {
  const [healthData, setHealthData] = useState(null);
  const [noDataMessage, setNoDataMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [dataCleared, setDataCleared] = useState(false);
  const [triggerUpdate, setTriggerUpdate] = useState(false);

  // Fetch insights and update state
  const fetchInsights = useCallback(async () => {
    try {
      const result = await generateInsights();
      if (result.response_text === 'No data found.') {
        setNoDataMessage('No data available.');
        setHealthData(null);
      } else {
        const parsedData = JSON.parse(result.response_text);
        setHealthData(parsedData);
        setNoDataMessage('');
      }
    } catch (error) {
      setNoDataMessage('Error fetching data.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle adding a new reading
  const handleAddReading = async (reading) => {
    try {
      setLoading(true);
      await addReading(reading);
      setDataCleared(false);
      await fetchInsights(); // Refresh insights after adding a reading
      setTriggerUpdate((prev) => !prev); // Trigger updates for dependent components
    } catch (error) {
      console.error('Error adding reading:', error);
    }
  };

  // Handle clearing all readings
  const handleClearAll = async () => {
    try {
      await clearAllReadings();
      setHealthData(null);
      setNoDataMessage('No data available.');
      setDataCleared(true);
    } catch (error) {
      console.error('Error clearing readings:', error);
    }
  };

  // Trigger initial fetch and refresh after clearing data
  useEffect(() => {
    if (!dataCleared) fetchInsights();
  }, [dataCleared, fetchInsights]);

  return (
    <div className="container mx-auto p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Metabolic Health Monitor</h1>
        <Button variant="destructive" onClick={handleClearAll} className="mb-4">
          Clear Session
        </Button>

        {noDataMessage && <div className="text-red-500 font-bold mb-8">{noDataMessage}</div>}

        <div className="space-y-6">
          <Form onSubmit={handleAddReading} />

          {!dataCleared && !loading && <Chart triggerUpdate={triggerUpdate} />}

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
              <div className="p-4 border rounded-md shadow-md">
                <Suggestions suggestions={healthData.Suggestions} />
              </div>
              <div className="p-4 border rounded-md shadow-md">
                <BloodTestChatbot triggerUpdate={triggerUpdate} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

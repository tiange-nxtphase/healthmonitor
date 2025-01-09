// components/HealthSummary.tsx
import React from 'react'

interface Suggestion {
  [key: string]: string;
}

interface HealthSummaryProps {
  data: {
    Biomarker: string;
    Value: string;
    Score: string;
    Risk: string;
    Explanation: string;
    Suggestions: Suggestion[]; // Ensure it's always an array
  };
}

const HealthSummary: React.FC<HealthSummaryProps> = ({ data }) => {
  return (
    <div className="p-4 border rounded-md shadow-md">
      <h2 className="text-2xl font-semibold">Insights</h2>
      <p><strong>Biomarker:</strong> {data.Biomarker}</p>
      <p><strong>Value:</strong> {data.Value}</p>
      <p><strong>Score:</strong> {data.Score}</p>
      <p><strong>Risk:</strong> {data.Risk}</p>
      <p><strong>Explanation:</strong> {data.Explanation}</p>
      
      {/* Render Suggestions */}
      <div className="space-y-4 mt-6">
        <h3 className="font-semibold text-lg">Suggestions</h3>
        {data.Suggestions?.length > 0 ? (
          data.Suggestions.map((suggestion, index) => {
            const [title, description] = Object.entries(suggestion)[0];
            return (
              <div key={index} className="space-y-2">
                <h4 className="font-medium">{title}</h4>
                <p>{description}</p>
              </div>
            );
          })
        ) : (
          <p>No suggestions available</p>
        )}
      </div>
    </div>
  )
}

export default HealthSummary

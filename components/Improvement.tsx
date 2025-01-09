import React from 'react';

interface Suggestion {
  [key: string]: string;
}

interface SuggestionsProps {
  suggestions: Suggestion[];
}

const Suggestions: React.FC<SuggestionsProps> = ({ suggestions }) => {
  return (
    <div>
      <h3 className="font-semibold text-lg">How to improve your metabolic health</h3>
      {suggestions?.length > 0 ? (
        suggestions.map((suggestion, index) => {
          const [title, description] = Object.entries(suggestion)[0];
          return (
            <div key={index} className="space-y-2">
              {/* Change font-medium to font-bold to make the title bold */}
              <h4 className="font-bold">{title}</h4>
              <p>{description}</p>
            </div>
          );
        })
      ) : (
        <p>No suggestions available</p>
      )}
    </div>
  );
};

export default Suggestions;

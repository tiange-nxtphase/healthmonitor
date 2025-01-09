
import React from 'react';

interface Explanation {
  [key: string]: string;
}

interface ExplanationProps {
  explanations: Explanation[];
}

const Explanations: React.FC<ExplanationProps> = ({ explanations }) => {
  return (
    <div>
      <h3 className="font-semibold text-lg">What does your result indicate</h3>
      {explanations?.length > 0 ? (
        explanations.map((explanation, index) => {
          const [title, description] = Object.entries(explanation)[0];
          return (
            <div key={index} className="space-y-2">
              {/* Change font-medium to font-bold to make the title bold */}
              <h4 className="font-bold">{title}</h4>
              <p>{description}</p>
            </div>
          );
        })
      ) : (
        <p>No explanation available</p>
      )}
    </div>
  );
};

export default Explanations;

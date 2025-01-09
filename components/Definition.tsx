import React from 'react';

const Definition: React.FC = () => {
  return (
    <div className="p-4 border rounded-md shadow-md">
      <h3 className="font-semibold text-lg">What is HbA1c</h3>
      <p>
        HbA1c (Hemoglobin A1c) is a form of hemoglobin that is chemically linked to glucose. 
        It is used to measure the average blood sugar levels over the past 2 to 3 months. 
        The higher the HbA1c, the higher the risk of diabetes and related complications, as it indicates higher average blood glucose levels.
        Haemoglobin (Hb) is the protein in red blood cells that carries oxygen through your body. HbA1c refers to glucose and haemoglobin joined together (the haemoglobin is &apos;glycated&apos;). The amount of HbA1c formed is directly related to the amount of glucose in your blood. 
        Red blood cells live for an average of 120 days, so HbA1c gives an indication of how much sugar there has been in your blood over the past few months. It&apos;s different to a glucose test, which measures how much sugar is in the blood at that moment.
      </p>
    </div>
  );
};

export default Definition;

// Define types based on the API response
export interface HbA1cReading {
  date: string;
  hsCRP: number;
  hba1c: number;
  fasting_glucose: number;
  ldl_cholesterol: number;
  triglycerides: number;
  hdl_cholesterol: number;
  ALT_liver_enzymes:number

}

export interface ReadingsResponse {
  [date: string]: number; // key is the date (string), value is the HbA1c value (number)
}


export interface InsightsResponse {
  response_text: string;
}

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// https://healthmonitor-c4ceejh2fdhfh6hj.swedencentral-01.azurewebsites.net/api/readings
// http://localhost:5000/api/readings

export async function getReadings(): Promise<ReadingsResponse> {
  const response = await fetch(`${apiUrl}/api/readings`);
  const data = await response.json();
  return data;
}

// https://healthmonitor-c4ceejh2fdhfh6hj.swedencentral-01.azurewebsites.net/api/addReading
// http://localhost:5000/api/addReading
export async function addReading(reading: HbA1cReading): Promise<any> {
  const response = await fetch(`${apiUrl}/api/addReading`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(reading),
  });

  const data = await response.json();
  return data;
}

// https://healthmonitor-c4ceejh2fdhfh6hj.swedencentral-01.azurewebsites.net/api/generate_insights
// http://localhost:5000/api/generate_insights

export async function generateInsights(): Promise<InsightsResponse> {
  const response = await fetch(`${apiUrl}/api/generate_insights`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();
  return data;
}
// https://healthmonitor-c4ceejh2fdhfh6hj.swedencentral-01.azurewebsites.net/api/clearAllReadings
// http://localhost:5000/api/clearAllReadings
export async function clearAllReadings(): Promise<void> {
  const response = await fetch(`${apiUrl}/api/clearAllReadings`, {
    method: 'DELETE',
  });

  return;
}

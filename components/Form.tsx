"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { addReading } from "../utils/storage";

export interface HbA1cReading {
  date: string;
  hsCRP: number | null;
  hba1c: number | null;
  fasting_glucose: number | null;
  ldl_cholesterol: number | null;
  triglycerides: number | null;
  hdl_cholesterol: number | null;
  ALT_liver_enzymes: number | null;
  triglyceride_hdl_ratio: number | null;
}

const initialReadingState: Omit<HbA1cReading, "date"> = {
  hsCRP: null,
  hba1c: null,
  fasting_glucose: null,
  ldl_cholesterol: null,
  triglycerides: null,
  hdl_cholesterol: null,
  ALT_liver_enzymes: null,
  triglyceride_hdl_ratio: null,
};

const biomarkerUnits: Record<keyof Omit<HbA1cReading, "date">, string> = {
  hsCRP: "mg/L",
  hba1c: "%",
  fasting_glucose: "mmol/L",
  ldl_cholesterol: "mmol/L",
  triglycerides: "mmol/L",
  hdl_cholesterol: "mmol/L",
  ALT_liver_enzymes: "U/L",
  triglyceride_hdl_ratio: "",
};

export function Form({
  onSubmit,
}: {
  onSubmit: (reading: HbA1cReading) => void;
}) {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [readings, setReadings] = useState<Omit<HbA1cReading, "date">>(
    initialReadingState
  );

  const calculateTriglyceridHDLRatio = (): number | null => {
    const triglycerides = parseFloat(`${readings.triglycerides}`);
    const hdl = parseFloat(`${readings.hdl_cholesterol}`);
    if (!isNaN(triglycerides) && !isNaN(hdl) && hdl !== 0) {
      return Number((triglycerides / hdl).toFixed(2));
    }
    return null;
  };

  useEffect(() => {
    const ratio = calculateTriglyceridHDLRatio();
    setReadings((prev) => ({ ...prev, triglyceride_hdl_ratio: ratio }));
  }, [readings.triglycerides, readings.hdl_cholesterol]);

  const handleInputChange =
    (field: keyof Omit<HbA1cReading, "date">) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value.trim();
      setReadings((prev) => ({
        ...prev,
        [field]: value === "" ? null : parseFloat(value),
      }));
    };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newReading: HbA1cReading = { date, ...readings };
    addReading(newReading); // Update the backend
    onSubmit(newReading); // Notify parent
    setDate(new Date().toISOString().split("T")[0]);
    setReadings(initialReadingState); // Reset form
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardContent>
        <form
          onSubmit={handleSubmit}
          className="flex flex-col sm:flex-row gap-6 p-4"
        >
          <div className="w-full sm:w-1/3">
            <Label
              htmlFor="date"
              className="text-lg font-semibold mb-2 block"
            >
              Date
            </Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full"
            />
          </div>
          <div className="w-full sm:w-2/3 space-y-4">
            {Object.entries(readings).map(([field, value]) => (
              <div key={field} className="flex flex-col">
                <Label
                  htmlFor={field}
                  className="text-sm font-medium mb-1"
                >
                  {field
                    .replace(/_/g, " ")
                    .replace(/\b\w/g, (l) => l.toUpperCase())}{" "}
                  {biomarkerUnits[field as keyof Omit<HbA1cReading, "date">] &&
                    `(${biomarkerUnits[
                      field as keyof Omit<HbA1cReading, "date">
                    ]})`}
                </Label>
                {field === "triglyceride_hdl_ratio" ? (
                  <Input
                    id={field}
                    type="text"
                    value={
                      value === null
                        ? "Calculated automatically"
                        : value.toString()
                    }
                    readOnly
                    className="w-full bg-gray-100"
                  />
                ) : (
                  <Input
                    id={field}
                    type="number"
                    step="0.01"
                    placeholder={`Enter ${field.replace(/_/g, " ")} value`}
                    value={value === null ? "" : value.toString()}
                    onChange={handleInputChange(
                      field as keyof Omit<HbA1cReading, "date">
                    )}
                    className="w-full"
                  />
                )}
              </div>
            ))}
            <Button type="submit" className="w-full mt-6">
              Add Reading
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

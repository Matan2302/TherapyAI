import React from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts";
import "./PatientDashboard.css";

const PatientDashboard = () => {
  const exampleData = [
    { time: "09:00", goodMoods: 3, badMoods: 7 },
    { time: "09:05", goodMoods: 5, badMoods: 5 },
    { time: "09:10", goodMoods: 6, badMoods: 4 },
    { time: "09:15", goodMoods: 8, badMoods: 2 },
    { time: "09:20", goodMoods: 7, badMoods: 3 },
    { time: "09:25", goodMoods: 9, badMoods: 1 },
    { time: "09:30", goodMoods: 10, badMoods: 0 },
    { time: "09:35", goodMoods: 7, badMoods: 3 },
    { time: "09:40", goodMoods: 6, badMoods: 4 },
    { time: "09:45", goodMoods: 5, badMoods: 5 },
    { time: "09:50", goodMoods: 4, badMoods: 6 },
    { time: "09:55", goodMoods: 2, badMoods: 8 },
  ];

  return (
    <div className="patient-dashboard">
      <div className="mood-tracking">
        <h2 className="text-2xl mb-4">Patient Dashboard</h2>
        <h3 className="text-xl mb-2">Mood Tracking Example</h3>
        <LineChart width={600} height={300} data={exampleData}>
          <XAxis dataKey="time" />
          <YAxis />
          <CartesianGrid strokeDasharray="3 3" />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="goodMoods" stroke="#82ca9d" name="Good Moods" strokeWidth={2} />
          <Line type="monotone" dataKey="badMoods" stroke="#ff6b6b" name="Bad Moods" strokeWidth={2} />
        </LineChart>
      </div>
    </div>
  );
};

export default PatientDashboard;

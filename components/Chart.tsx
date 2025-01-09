"use client"

import { useState, useEffect } from 'react'
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, ReferenceArea } from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Scale, ZoomOut } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { getReadings } from '../utils/storage'
import { Socket } from 'socket.io-client'

function getStatus(value: number) {
  if (value < 5.7) return { label: "NORMAL", color: "bg-green-500 hover:bg-green-500" }
  if (value < 6.5) return { label: "ELEVATED", color: "bg-yellow-500 hover:bg-yellow-500" }
  return { label: "HIGH", color: "bg-red-500 hover:bg-red-500" }
}

function getLineColor(value: number) {
  if (value < 5.7) return "#22c55e"
  if (value < 6.5) return "#eab308"
  return "#ef4444"
}

interface ChartData {
  date: string;
  value: number;
  displayDate: string;
}

interface ChartProps {
  socket: Socket | null;
}

export function Chart({ socket }: ChartProps) {
  const [sortedData, setSortedData] = useState<ChartData[]>([])
  const [status, setStatus] = useState({ label: "NO DATA", color: "bg-gray-500 hover:bg-gray-500" })
  const [left, setLeft] = useState<string | number>('dataMin')
  const [right, setRight] = useState<string | number>('dataMax')
  const [refAreaLeft, setRefAreaLeft] = useState('')
  const [refAreaRight, setRefAreaRight] = useState('')
  const [top, setTop] = useState<string | number>('dataMax+1')
  const [bottom, setBottom] = useState<string | number>('dataMin-1')
  const [loading, setLoading] = useState<boolean>(false)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const readings = await getReadings()
      const sorted = Object.keys(readings)
        .filter(date => readings[date]['hba1c'] !== null)
        .map(date => ({ date, value: parseFloat(readings[date]['hba1c']) }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map(reading => ({
          ...reading,
          displayDate: new Date(reading.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
        }));    
      setSortedData(sorted)

      const latestReading = sorted[sorted.length - 1]
      if (latestReading) {
        setStatus(getStatus(latestReading.value))
      }
      setLoading(false)
    }

    fetchData()

    if (socket) {
      socket.on('new_reading', fetchData)
    }

    return () => {
      if (socket) {
        socket.off('new_reading', fetchData)
      }
    }
  }, [socket])

  const zoom = () => {
    if (refAreaLeft === refAreaRight || refAreaRight === '') {
      setRefAreaLeft('')
      setRefAreaRight('')
      return
    }

    const leftIndex = sortedData.findIndex(item => item.date === refAreaLeft)
    const rightIndex = sortedData.findIndex(item => item.date === refAreaRight)
    const [newLeft, newRight] = [leftIndex, rightIndex].sort((a, b) => a - b)

    setLeft(sortedData[newLeft].date)
    setRight(sortedData[newRight].date)

    setRefAreaLeft('')
    setRefAreaRight('')
  }

  const zoomOut = () => {
    setLeft('dataMin')
    setRight('dataMax')
    setTop('dataMax+1')
    setBottom('dataMin-1')
  }

  return (
    <Card className="relative">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">HbA1c</CardTitle>
            <CardDescription className="text-muted-foreground">
              HbA1c (Hemoglobin A1c) is a measure of the average blood sugar (glucose) level to diagnose and monitor diabetes. 
            </CardDescription>
          </div>
          <Badge className={status.color}>{status.label}</Badge>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Scale className="h-4 w-4" />
          <span className="text-sm">Blood glucose balance</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] w-full">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <div className="border-t-4 border-blue-500 border-solid rounded-full w-12 h-12 animate-spin"></div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={sortedData}
                onMouseDown={(e) => e && setRefAreaLeft(e.activeLabel || '')}
                onMouseMove={(e) => e && refAreaLeft && setRefAreaRight(e.activeLabel || '')}
                onMouseUp={zoom}
              >
                <XAxis
                  dataKey="displayDate"
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  domain={[left, right]}
                />
                <YAxis
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}%`}
                  domain={[bottom, top]}
                />
                <Tooltip
                  labelFormatter={(label) => `Date: ${label}`}
                  formatter={(value: number) => [`${value}%`, 'HbA1c']}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#8884d8"
                  strokeWidth={2}
                  dot={(props) => {
                    const { cx, cy, payload } = props;
                    return (
                      <circle
                        key={`dot-${payload.date}`}
                        cx={cx}
                        cy={cy}
                        r={4}
                        stroke={getLineColor(payload.value)}
                        fill="white"
                        strokeWidth={2}
                      />
                    );
                  }}
                  activeDot={{ r: 8, fill: "#8884d8" }}
                />
                {refAreaLeft && refAreaRight ? (
                  <ReferenceArea x1={refAreaLeft} x2={refAreaRight} strokeOpacity={0.3} />
                ) : null}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="flex justify-end mt-4">
          <Button
            variant="outline"
            size="icon"
            onClick={zoomOut}
            aria-label="Zoom out"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

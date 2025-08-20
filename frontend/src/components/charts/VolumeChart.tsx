'use client'

import { 
  ResponsiveContainer, 
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  Tooltip,
  Cell
} from 'recharts'

interface VolumeChartProps {
  data: any[]
  selectedTimeframe: string
}

export default function VolumeChart({ data, selectedTimeframe }: VolumeChartProps) {
  const getXAxisInterval = (dataLength: number) => {
    if (dataLength <= 6) return 0
    return Math.floor(dataLength / 6)
  }

  return (
    <ResponsiveContainer width="100%" height="100%" style={{ outline: 'none' }}>
      <BarChart 
        data={data} 
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        syncId="chart"
      >
        <XAxis 
          dataKey="date" 
          tick={{ fontSize: 12 }}
          interval={['2h', '1d', '2d'].includes(selectedTimeframe) ? getXAxisInterval(data.length) : getXAxisInterval(data.length)}
          type={['2h', '1d', '2d'].includes(selectedTimeframe) ? 'number' : 'category'}
          scale={['2h', '1d', '2d'].includes(selectedTimeframe) ? 'time' : 'auto'}
          domain={['2h', '1d', '2d'].includes(selectedTimeframe) ? ['dataMin', 'dataMax'] : undefined}
          tickFormatter={['2h', '1d', '2d'].includes(selectedTimeframe) ? 
            (value) => new Date(value).toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit',
              hour12: false 
            }) : undefined
          }
        />
        <YAxis 
          orientation="right"
          tick={{ fontSize: 10 }}
          tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
          axisLine={false}
        />
        <Tooltip content={() => null} />
        <Bar dataKey="volume" opacity={0.8}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.volumeColor} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
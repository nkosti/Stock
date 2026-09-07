interface MetricRowProps {
  label: string
  value: string | number | null | undefined
  isHighlighted?: boolean
  isPercentage?: boolean
  prefix?: string
}

export default function MetricRow({ 
  label, 
  value, 
  isHighlighted = false, 
  isPercentage = false,
  prefix = ""
}: MetricRowProps) {
  const formatValue = () => {
    if (value === null || value === undefined) return 'N/A'
    if (isPercentage && typeof value === 'number') {
      return `${(value * 100).toFixed(2)}%`
    }
    if (typeof value === 'number') {
      return `${prefix}${value.toFixed(2)}`
    }
    return value
  }

  return (
    <div className="flex justify-between">
      <span className="text-slate-700">{label}</span>
      <span className={`font-semibold ${
        isHighlighted 
          ? 'text-lg text-emerald-600 font-bold' 
          : 'text-slate-900'
      }`}>
        {formatValue()}
      </span>
    </div>
  )
}
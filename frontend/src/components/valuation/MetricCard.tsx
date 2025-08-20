interface MetricCardProps {
  title: string
  children: React.ReactNode
  className?: string
}

export default function MetricCard({ title, children, className = "" }: MetricCardProps) {
  return (
    <div className={`bg-white rounded-lg shadow-lg border border-slate-200 p-6 ${className}`}>
      <h3 className="text-xl font-bold text-blue-900 mb-4">{title}</h3>
      {children}
    </div>
  )
}
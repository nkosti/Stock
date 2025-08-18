import Link from "next/link";
import { TrendingUp, Calculator, BarChart3, Briefcase, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center">
        <h1 className="text-5xl font-black tracking-tight text-blue-900 sm:text-7xl">
          Professional Stock Analysis Platform
        </h1>
        <p className="mt-6 text-2xl leading-9 text-gray-600 font-semibold">
          Advanced valuation models, option pricing, and portfolio analytics for informed investment decisions
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <Link
            href="/valuation"
            className="rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 transition-colors"
          >
            Start Analyzing
          </Link>
          <Link href="/portfolio" className="text-lg font-bold leading-6 text-blue-900 hover:text-emerald-600 transition-colors">
            View Portfolio <ArrowRight className="inline h-4 w-4 ml-1" />
          </Link>
        </div>
      </div>

      <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
        <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
          <div className="relative pl-16">
            <dt className="text-xl font-black leading-7 text-blue-900">
              <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600 shadow-lg">
                <Calculator className="h-6 w-6 text-white" />
              </div>
              Stock Valuation
            </dt>
            <dd className="mt-2 text-lg leading-7 text-gray-600 font-medium">
              DCF models, P/E ratios, and comprehensive fundamental analysis tools for accurate stock valuations.
            </dd>
          </div>
          <div className="relative pl-16">
            <dt className="text-xl font-black leading-7 text-blue-900">
              <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600 shadow-lg">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              Options Pricing
            </dt>
            <dd className="mt-2 text-lg leading-7 text-gray-600 font-medium">
              Black-Scholes model and Greeks calculations for sophisticated options trading strategies.
            </dd>
          </div>
          <div className="relative pl-16">
            <dt className="text-xl font-black leading-7 text-blue-900">
              <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600 shadow-lg">
                <Briefcase className="h-6 w-6 text-white" />
              </div>
              Portfolio Analysis
            </dt>
            <dd className="mt-2 text-lg leading-7 text-gray-600 font-medium">
              Risk assessment, diversification metrics, and performance tracking for your investment portfolio.
            </dd>
          </div>
          <div className="relative pl-16">
            <dt className="text-xl font-black leading-7 text-blue-900">
              <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600 shadow-lg">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              Real-time Data
            </dt>
            <dd className="mt-2 text-lg leading-7 text-gray-600 font-medium">
              Live market data and historical analysis powered by reliable financial data providers.
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

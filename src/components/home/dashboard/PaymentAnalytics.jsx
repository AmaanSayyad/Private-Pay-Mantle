import { useEffect, useState } from "react";
import { Skeleton, Spinner } from "@nextui-org/react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { useAptos } from "../../../providers/MantleWalletProvider.jsx";
import { getPaymentAnalytics } from "../../../lib/supabase.js";
import { formatMNTAmount } from "../../../utils/mantle-utils.js";
import dayjs from "dayjs";
import { TrendingUp, DollarSign, Activity, BarChart3 } from "lucide-react";

export default function PaymentAnalytics() {
  const { account } = useAptos();
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeframe, setTimeframe] = useState("daily"); // daily, weekly, monthly

  useEffect(() => {
    async function loadAnalytics() {
      if (account) {
        setIsLoading(true);
        try {
          const data = await getPaymentAnalytics(account);
          setAnalytics(data);
        } catch (error) {
          console.error("Error loading analytics:", error);
        } finally {
          setIsLoading(false);
        }
      }
    }

    loadAnalytics();

    // Listen for balance updates to refresh analytics
    const handleUpdate = () => {
      loadAnalytics();
    };

    window.addEventListener("balance-updated", handleUpdate);
    window.addEventListener("points-updated", handleUpdate);

    return () => {
      window.removeEventListener("balance-updated", handleUpdate);
      window.removeEventListener("points-updated", handleUpdate);
    };
  }, [account]);

  if (!account) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="w-full rounded-3xl bg-gradient-to-br from-white to-indigo-50/30 border border-neutral-200 shadow-sm overflow-hidden">
        <div className="w-full px-6 py-6">
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!analytics || analytics.totalPayments === 0) {
    return (
      <div className="w-full rounded-3xl bg-gradient-to-br from-white to-indigo-50/30 border border-neutral-200 shadow-sm overflow-hidden">
        <div className="w-full px-6 py-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-primary-50 rounded-full">
              <BarChart3 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-lg text-gray-800">Payment Analytics</p>
              <p className="text-xs text-gray-500">Privacy-preserving insights</p>
            </div>
          </div>
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">No payment data available yet</p>
            <p className="text-xs mt-1">Analytics will appear after receiving payments</p>
          </div>
        </div>
      </div>
    );
  }

  const chartData =
    timeframe === "daily"
      ? analytics.paymentFrequency.daily
      : timeframe === "weekly"
      ? analytics.paymentFrequency.weekly
      : analytics.paymentFrequency.monthly;

  const formatChartDate = (key) => {
    if (timeframe === "daily") {
      return dayjs(key).format("MMM DD");
    } else if (timeframe === "weekly") {
      return key.split("-W")[1] || key;
    } else {
      return dayjs(key + "-01").format("MMM YYYY");
    }
  };

  return (
    <div className="w-full rounded-3xl bg-gradient-to-br from-white to-indigo-50/30 border border-neutral-200 shadow-sm overflow-hidden" data-analytics-section>
      <div className="w-full px-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary-50 rounded-full">
              <BarChart3 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-lg text-gray-800">Payment Analytics</p>
              <p className="text-xs text-gray-500">Privacy-preserving insights</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <StatCard
            icon={<DollarSign className="w-4 h-4" />}
            label="Total Received"
            value={formatMNTAmount(analytics.totalReceived.toString(), false, 4)}
            subValue={`${analytics.totalPayments} payments`}
          />
          <StatCard
            icon={<TrendingUp className="w-4 h-4" />}
            label="Average Payment"
            value={formatMNTAmount(analytics.averagePaymentSize.toString(), false, 4)}
            subValue={`Max: ${formatMNTAmount(analytics.largestPayment.toString(), false, 2)}`}
          />
        </div>

        {/* Timeframe Selector */}
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => setTimeframe("daily")}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
              timeframe === "daily"
                ? "bg-primary text-white"
                : "bg-primary-50 text-primary"
            }`}
          >
            Daily
          </button>
          <button
            onClick={() => setTimeframe("weekly")}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
              timeframe === "weekly"
                ? "bg-primary text-white"
                : "bg-primary-50 text-primary"
            }`}
          >
            Weekly
          </button>
          <button
            onClick={() => setTimeframe("monthly")}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
              timeframe === "monthly"
                ? "bg-primary text-white"
                : "bg-primary-50 text-primary"
            }`}
          >
            Monthly
          </button>
        </div>

        {/* Chart */}
        <div className="w-full h-[280px] -mx-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
            >
              <defs>
                <linearGradient id="analyticsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4} />
                  <stop offset="50%" stopColor="#818cf8" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#a5b4fc" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e5e7eb"
                vertical={false}
                opacity={0.5}
              />
              <XAxis
                dataKey={timeframe === "daily" ? "date" : timeframe === "weekly" ? "week" : "month"}
                tickFormatter={formatChartDate}
                style={{ fontSize: "11px", fill: "#6b7280" }}
                tickLine={false}
                axisLine={false}
                tickMargin={10}
              />
              <YAxis
                tickFormatter={(value) => formatMNTAmount(value.toString(), false, 2)}
                style={{ fontSize: "11px", fill: "#6b7280" }}
                tickLine={false}
                axisLine={false}
                width={60}
              />
              <Tooltip
                content={<CustomTooltip timeframe={timeframe} />}
                cursor={{ stroke: "#6366f1", strokeWidth: 1, strokeDasharray: "5 5" }}
              />
              <Area
                type="monotone"
                dataKey="total"
                stroke="#6366f1"
                strokeWidth={2.5}
                fill="url(#analyticsGradient)"
                fillOpacity={1}
                dot={{ fill: "#6366f1", strokeWidth: 2, r: 3 }}
                activeDot={{ r: 5, fill: "#6366f1", stroke: "#fff", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Payment Frequency Info */}
        <div className="mt-4 pt-4 border-t border-neutral-200">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <Activity className="w-3.5 h-3.5" />
              <span>Payment Frequency</span>
            </div>
            <span>
              {analytics.totalPayments} payments over{" "}
              {timeframe === "daily"
                ? `${chartData.length} days`
                : timeframe === "weekly"
                ? `${chartData.length} weeks`
                : `${chartData.length} months`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, subValue }) {
  return (
    <div className="bg-white/60 rounded-2xl p-4 border border-neutral-100">
      <div className="flex items-center gap-2 mb-2">
        <div className="text-primary">{icon}</div>
        <p className="text-xs font-medium text-gray-500">{label}</p>
      </div>
      <p className="text-xl font-bold text-gray-900 mb-0.5">{value}</p>
      <p className="text-xs text-gray-500">{subValue}</p>
    </div>
  );
}

function CustomTooltip({ active, payload, timeframe }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const dateKey = timeframe === "daily" ? "date" : timeframe === "weekly" ? "week" : "month";
    const date = data[dateKey];

    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-4 max-w-xl flex flex-col items-start shadow-xl backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-400"></div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            {timeframe === "daily"
              ? dayjs(date).format("MMM DD, YYYY")
              : timeframe === "weekly"
              ? `Week ${date.split("-W")[1]}`
              : dayjs(date + "-01").format("MMM YYYY")}
          </p>
        </div>
        <div className="flex items-baseline gap-2 mt-1">
          <p className="text-2xl font-bold text-gray-900">
            {formatMNTAmount(data.total.toString(), false, 4)}
          </p>
          <p className="text-sm font-semibold text-indigo-600">MNT</p>
        </div>
        <p className="text-xs text-gray-500 mt-1">{data.count} payment{data.count !== 1 ? "s" : ""}</p>
      </div>
    );
  }
  return null;
}

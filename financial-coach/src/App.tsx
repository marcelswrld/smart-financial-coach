import React, { useEffect, useMemo, useRef, useState } from "react";
import Papa from "papaparse";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { Progress } from "./components/ui/progress";
import { Switch } from "./components/ui/switch";
import { Badge } from "./components/ui/badge";
import { Separator } from "./components/ui/separator";
import {
  AlertTriangle,
  Bell,
  Calendar,
  DollarSign,
  Lock,
  PieChart as PieIcon,
  Rocket,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Upload,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import { getAIAdvice } from "./advice";

/**
 * PANW Smart Financial Coach – MVP (Front-end only)
 * -------------------------------------------------
 * This single-file React app demonstrates an MVP for the "Smart Financial Coach" case study.
 * It is intentionally designed to look and feel like a real product while remaining lightweight.
 *
 * Highlights for the Hackathon rubric:
 * - Problem Understanding: Inputs for income/expenses/goals and visibility of spend patterns.
 * - Technical Rigor: Deterministic analytics (savings calc, ETA), basic anomaly detection,
 *   simple forecasting heuristics, and local persistence.
 * - Creativity: Profitability Score, Impact Lens (opportunity cost), positive behavioral nudges,
 *   automation toggles, and a friendly coach persona.
 * - Prototype Quality: Upload CSV, live charts, notifications, responsive layout.
 * - Responsible AI: "Secure-by-design" defaults, on-device processing, permissioned AI placeholders.
 *
 * NOTE: For the case study, you can say you used AI coding tools (Cursor/Claude/Copilot) to:
 *   - bootstrap file skeletons and chart components,
 *   - generate transformation utilities and comments,
 *   - draft copy for insights and nudges,
 *   while you manually reviewed and validated all logic (Responsible AI).
 */

// -----------------------------
// Types
// -----------------------------

type Transaction = {
  date: string; // ISO date string
  category: string;
  amount: number; // positive numbers = money out
  merchant?: string;
};

type Profile = {
  monthlyIncome: number;
  recurringBills: number; // fixed bills (e.g., rent, utilities)
  currentSavings: number; // current cash toward the goal
  goalAmount: number; // savings target
  goalName: string;
};

// -----------------------------
// Sample Synthetic CSV (you can upload your own file, too)
// -----------------------------

const SAMPLE_CSV = `date,category,amount,merchant
2025-08-01,Groceries,120,Trader Joe's
2025-08-02,Entertainment,60,AMC
2025-08-03,Coffee,15,Blue Bottle
2025-08-05,Rent,1500,Apartment LLC
2025-08-08,Transportation,40,Metro
2025-08-10,Dining Out,75,Chipotle
2025-08-12,Healthcare,45,CVS
2025-08-13,Subscription,12.99,Spotify
2025-08-15,Utilities,120,LADWP
2025-08-18,Groceries,90,Ralphs
2025-08-20,Subscription,15,Netflix
2025-08-22,Education,150,Udemy
2025-08-23,Entertainment,100,Concert
2025-08-26,Clothing,85,Uniqlo
2025-08-28,Coffee,20,Philz
2025-08-30,Other,35,Amazon`;

// -----------------------------
// Utilities – parsing, math, storage
// -----------------------------

const DEFAULT_PROFILE: Profile = {
  monthlyIncome: 4000,
  recurringBills: 500,
  currentSavings: 500,
  goalAmount: 3000,
  goalName: "Emergency Fund",
};

const LS_KEY = "panw_fincoach_state_v1";

function saveStateToLocalStorage(profile: Profile, txns: Transaction[]) {
  try {
    const payload = { profile, txns };
    localStorage.setItem(LS_KEY, JSON.stringify(payload));
  } catch {}
}

function loadStateFromLocalStorage(): { profile: Profile; txns: Transaction[] } | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed;
  } catch {
    return null;
  }
}

function parseCsv(text: string): Transaction[] {
  const out: Transaction[] = [];
  
  Papa.parse(text, {
    header: true,
    skipEmptyLines: true,
    transform: (value) => (typeof value === "string" ? value.trim() : value),
    complete: (results) => {
      const rows = results.data as any[];
      for (const r of rows) {
        // Basic validation & coercion
        const date = new Date(r.date);
        const category = String(r.category || "Other");
        const amount = parseFloat(String(r.amount));
        const merchant = r.merchant ? String(r.merchant) : undefined;
        
        if (!isNaN(date.getTime()) && !isNaN(amount)) {
          out.push({ 
            date: date.toISOString().slice(0, 10), 
            category, 
            amount, 
            merchant 
          });
        }
      }
    }
  });
  
  return out;
}

function groupBy<T, K extends string | number | symbol>(arr: T[], getKey: (x: T) => K): Record<K, T[]> {
  return arr.reduce((acc: any, item) => {
    const key = getKey(item);
    acc[key] = acc[key] || [];
    acc[key].push(item);
    return acc;
  }, {} as Record<K, T[]>);
}

function sum(arr: number[]) {
  return arr.reduce((a, b) => a + b, 0);
}

function currency(n: number) {
  return n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 2 });
}

// -----------------------------
// Core analytics
// -----------------------------

function totalSpent(txns: Transaction[]): number {
  return sum(txns.map((t) => t.amount));
}

function categorizeSpending(txns: Transaction[]): { category: string; total: number }[] {
  const byCat = groupBy(txns, (t) => t.category);
  return Object.entries(byCat).map(([category, rows]) => ({ category, total: totalSpent(rows) }));
}

function calcMonthlySavings(profile: Profile, txns: Transaction[]): number {
  // Very simple: savings = income - (recurring + variable expenses)
  const expenses = profile.recurringBills + totalSpent(txns);
  return Math.max(0, profile.monthlyIncome - expenses);
}

function predictGoalMonths(goalAmount: number, currentSavings: number, monthlySavings: number): number | null {
  if (monthlySavings <= 0) return null;
  const remaining = Math.max(0, goalAmount - currentSavings);
  const months = remaining / monthlySavings;
  return Math.max(0, Math.round(months * 10) / 10);
}

function etaDateFromMonths(months: number | null): string {
  if (months === null) return "—";
  const now = new Date();
  const eta = new Date(now.getFullYear(), now.getMonth() + Math.ceil(months), now.getDate());
  return eta.toLocaleDateString();
}

function profitabilityScore(monthlySavings: number, income: number, anomalyCount: number): number {
  // 0–100 score combining savings rate and anomaly hygiene
  const savingsRate = income > 0 ? monthlySavings / income : 0; // e.g., 0.2 = 20%
  const base = Math.min(1, Math.max(0, savingsRate / 0.2)); // 20%+ savings ~ 100
  const anomalyPenalty = Math.min(0.3, anomalyCount * 0.05); // each anomaly costs 5%, capped 30%
  const score = Math.max(0, (base - anomalyPenalty) * 100);
  return Math.round(score);
}

function opportunityCost(actualMonthlySpend: number, targetMonthlySpend: number, horizonMonths = 12): number {
  const delta = Math.max(0, actualMonthlySpend - targetMonthlySpend);
  return delta * horizonMonths; // money "left on the table" over a year
}

function flagAnomalies(txns: Transaction[]): Transaction[] {
  // Simple rule-based anomaly detection: flag unusually large purchases by category
  const byCat = groupBy(txns, (t) => t.category);
  const anomalies: Transaction[] = [];
  for (const [_, rows] of Object.entries(byCat)) {
    const amounts = rows.map((r) => r.amount);
    const avg = sum(amounts) / Math.max(1, amounts.length);
    const variance = sum(amounts.map((a) => (a - avg) ** 2)) / Math.max(1, amounts.length);
    const std = Math.sqrt(variance);
    for (const r of rows) {
      if (std === 0) {
        if (r.amount > avg * 2 && r.amount > 100) anomalies.push(r);
      } else {
        const z = (r.amount - avg) / std;
        if (z >= 2 || r.amount > avg * 2.5) anomalies.push(r);
      }
    }
  }
  return anomalies;
}

// Generate simple nudges based on category spend share
function generateNudges(catTotals: { category: string; total: number }[], goalMonths: number | null): string[] {
  const total = sum(catTotals.map((c) => c.total));
  const share = catTotals
    .map((c) => ({ ...c, pct: total > 0 ? c.total / total : 0 }))
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 3);
  const tips: string[] = [];
  for (const c of share) {
    if (c.category.toLowerCase().includes("rent") || c.category.toLowerCase().includes("utilities")) continue;
    const cut = Math.round(Math.min(50, c.total * 0.1));
    if (cut > 0) {
      tips.push(
        `Trim ${c.category} by ${currency(cut)} next month. ${
          goalMonths ? `That could shave ~${Math.max(1, Math.round((cut / 200) * 7))} days off your ETA.` : ""
        }`
      );
    }
  }
  if (tips.length === 0) tips.push("Great job keeping variable expenses lean. Consider increasing auto-invest by 1–2%.");
  return tips;
}

// -----------------------------
// UI Helpers
// -----------------------------

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#8dd1e1", "#a4de6c", "#d0ed57", "#d885a3"];

function SectionTitle({ icon: Icon, title, desc }: { icon: any; title: string; desc?: string }) {
  return (
    <div className="flex items-center gap-3 mb-2">
      <Icon className="h-5 w-5" />
      <div>
        <h3 className="text-lg font-semibold">{title}</h3>
        {desc && <p className="text-sm text-muted-foreground">{desc}</p>}
      </div>
    </div>
  );
}

// Simple Toast/Notifications
function useToasts() {
  const [toasts, setToasts] = useState<{ id: string; message: string }[]>([]);
  const push = (message: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  };
  return { toasts, push };
}

// -----------------------------
// Main Component
// -----------------------------

export default function FinancialCoachApp() {
  // Load initial state (localStorage → fallback → sample CSV)
  const saved = loadStateFromLocalStorage();

  const [profile, setProfile] = useState<Profile>(saved?.profile || DEFAULT_PROFILE);
  const [txns, setTxns] = useState<Transaction[]>(saved?.txns || parseCsv(SAMPLE_CSV));

  // Automation toggles (purely illustrative for MVP)
  const [autoPayBills, setAutoPayBills] = useState(true);
  const [autoInvestSpareChange, setAutoInvestSpareChange] = useState(false);

  const { toasts, push } = useToasts();
  const prevGoalMonthsRef = useRef<number | null>(null);

  // Derived analytics
  const catTotals = useMemo(() => categorizeSpending(txns), [txns]);
  const monthlySavings = useMemo(() => calcMonthlySavings(profile, txns), [profile, txns]);
  const goalMonths = useMemo(
    () => predictGoalMonths(profile.goalAmount, profile.currentSavings, monthlySavings),
    [profile.goalAmount, profile.currentSavings, monthlySavings]
  );
  const etaDate = useMemo(() => etaDateFromMonths(goalMonths), [goalMonths]);
  const anomalies = useMemo(() => flagAnomalies(txns), [txns]);
  const score = useMemo(() => profitabilityScore(monthlySavings, profile.monthlyIncome, anomalies.length), [monthlySavings, profile.monthlyIncome, anomalies.length]);

  const targetSpend = Math.max(0, profile.monthlyIncome * 0.8); // target = spend ≤ 80% income
  const actualSpend = profile.recurringBills + totalSpent(txns);
  const oppCostYear = opportunityCost(actualSpend, targetSpend, 12);

  useEffect(() => {
    saveStateToLocalStorage(profile, txns);
  }, [profile, txns]);

  useEffect(() => {
    // Demo notifications (you can call push() after key events)
    if (monthlySavings <= 0) {
      push("Heads up: You're overspending this month. Consider a quick category trim.");
    } else if (monthlySavings > 500) {
      push("Nice! Strong savings momentum this month. Keep it up.");
    }
  }, [monthlySavings]);

  useEffect(() => {
    const prev = prevGoalMonthsRef.current;
    if (prev !== null && goalMonths !== null && goalMonths > prev) {
      push("Recent spending pushed your goal further out. Consider adjusting high-impact categories.");
    }
    prevGoalMonthsRef.current = goalMonths;
  }, [goalMonths]);

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = String(e.target?.result || "");
      const parsed = parseCsv(text);
      if (parsed.length) {
        setTxns(parsed);
        push("Transactions imported successfully.");
      } else {
        push("Could not parse any transactions from that file.");
      }
    };
    reader.readAsText(file);
  };

  const monthlyChartData = useMemo(() => {
    // Sum by day for line chart convenience
    const byDate = groupBy(txns, (t) => t.date);
    const entries = Object.entries(byDate)
      .map(([date, rows]) => ({ date, spend: totalSpent(rows) }))
      .sort((a, b) => a.date.localeCompare(b.date));
    // Cumulative spend to visualize burn vs. income
    let cum = 0;
    return entries.map((e) => {
      cum += e.spend;
      return { ...e, cumulative: cum };
    });
  }, [txns]);

  const pieData = catTotals.map((c, i) => ({ name: c.category, value: Number(c.total.toFixed(2)), fill: COLORS[i % COLORS.length] }));

  const topNudges = useMemo(() => generateNudges(catTotals, goalMonths), [catTotals, goalMonths]);

  const aiAdvice = useMemo(() => getAIAdvice(txns, [{ name: profile.goalName, amount: profile.goalAmount }]), [txns, profile.goalName, profile.goalAmount]);
  
  // Innovative Features
  const financialHealthScore = useMemo(() => {
    const savingsRate = monthlySavings / profile.monthlyIncome;
    const emergencyFundRatio = profile.currentSavings / (profile.monthlyIncome * 3);
    const debtToIncomeRatio = profile.recurringBills / profile.monthlyIncome;
    
    let score = 0;
    if (savingsRate >= 0.2) score += 40;
    else if (savingsRate >= 0.1) score += 25;
    else if (savingsRate >= 0.05) score += 15;
    
    if (emergencyFundRatio >= 1) score += 30;
    else if (emergencyFundRatio >= 0.5) score += 20;
    else if (emergencyFundRatio >= 0.25) score += 10;
    
    if (debtToIncomeRatio <= 0.3) score += 30;
    else if (debtToIncomeRatio <= 0.5) score += 20;
    else if (debtToIncomeRatio <= 0.7) score += 10;
    
    return Math.min(100, score);
  }, [monthlySavings, profile.monthlyIncome, profile.currentSavings, profile.recurringBills]);
  
  const nextMilestone = useMemo(() => {
    const milestones = [
      { name: "Emergency Fund", target: profile.monthlyIncome * 3, current: profile.currentSavings, icon: "🛡️" },
      { name: "3-Month Buffer", target: profile.monthlyIncome * 3, current: profile.currentSavings, icon: "📊" },
      { name: "Goal Achievement", target: profile.goalAmount, current: profile.currentSavings, icon: "🎯" }
    ];
    
    return milestones.find(m => m.current < m.target) || milestones[milestones.length - 1];
  }, [profile.monthlyIncome, profile.currentSavings, profile.goalAmount]);
  
  // Smart Spending Predictions
  const spendingPredictions = useMemo(() => {
    if (txns.length === 0) return [];
    
    const avgDailySpend = totalSpent(txns) / 30; // Assuming monthly data
    const projectedMonthly = avgDailySpend * 30;
    const projectedAnnual = projectedMonthly * 12;
    
    const recommendations = [];
    
    if (projectedMonthly > profile.monthlyIncome * 0.8) {
      recommendations.push({
        type: "warning",
        message: "Projected spending may exceed 80% of income",
        action: "Consider reducing discretionary expenses",
        icon: "⚠️"
      });
    }
    
    if (monthlySavings < profile.monthlyIncome * 0.1) {
      recommendations.push({
        type: "info",
        message: "Savings rate below 10%",
        action: "Aim for 20% savings rate for financial security",
        icon: "💡"
      });
    }
    
    if (anomalies.length > 0) {
      recommendations.push({
        type: "alert",
        message: `${anomalies.length} unusual transactions detected`,
        action: "Review flagged transactions for potential fraud",
        icon: "🔍"
      });
    }
    
    return recommendations;
  }, [txns, profile.monthlyIncome, monthlySavings, anomalies]);

  // -----------------------------
  // Render
  // -----------------------------

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Apple/Tesla-Inspired Dynamic Background */}
      <div className="fixed inset-0 overflow-hidden">
        {/* Vibrant Gradient Base */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100" />
        
        {/* Large Animated Flowing Orbs */}
        <div className="absolute top-0 -left-32 w-[500px] h-[500px] bg-gradient-to-br from-blue-300/60 via-purple-300/50 to-pink-300/60 rounded-full blur-3xl animate-float" />
        <div className="absolute top-1/4 -right-40 w-[450px] h-[450px] bg-gradient-to-bl from-emerald-300/60 via-teal-300/50 to-cyan-300/60 rounded-full blur-3xl animate-float-delayed" />
        <div className="absolute bottom-0 left-1/3 w-[400px] h-[400px] bg-gradient-to-tr from-orange-300/60 via-yellow-300/50 to-amber-300/60 rounded-full blur-3xl animate-float-slow" />
        
        {/* Additional Colorful Orbs */}
        <div className="absolute top-1/2 left-1/4 w-[300px] h-[300px] bg-gradient-to-br from-rose-300/50 via-pink-300/40 to-purple-300/50 rounded-full blur-3xl animate-float" style={{animationDelay: '3s'}} />
        <div className="absolute top-3/4 right-1/4 w-[250px] h-[250px] bg-gradient-to-bl from-violet-300/50 via-indigo-300/40 to-blue-300/50 rounded-full blur-3xl animate-float-delayed" style={{animationDelay: '1s'}} />
        
        {/* Moving Particles with More Color */}
        <div className="absolute inset-0 opacity-40">
          <div className="absolute top-20 left-20 w-3 h-3 bg-blue-400/70 rounded-full animate-float" />
          <div className="absolute top-40 right-40 w-2 h-2 bg-purple-400/70 rounded-full animate-float-delayed" />
          <div className="absolute top-60 left-60 w-2.5 h-2.5 bg-pink-400/70 rounded-full animate-float-slow" />
          <div className="absolute top-80 right-20 w-2 h-2 bg-emerald-400/70 rounded-full animate-float" />
          <div className="absolute bottom-40 left-80 w-3 h-3 bg-orange-400/70 rounded-full animate-float-delayed" />
          <div className="absolute bottom-20 right-60 w-2.5 h-2.5 bg-cyan-400/70 rounded-full animate-float-slow" />
        </div>
        
        {/* Subtle Grid Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `
              linear-gradient(rgba(99, 102, 241, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(99, 102, 241, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px'
          }} />
        </div>
      </div>
      
      {/* Content with Glassmorphism */}
      <div className="relative z-10 p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header with Glassmorphism */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="backdrop-blur-xl bg-white/80 border border-white/40 rounded-2xl p-6 mb-6 shadow-2xl hover:shadow-3xl transition-all duration-300"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                  <ShieldCheck className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-gray-800 to-blue-600 bg-clip-text text-transparent">
                    Sentinel Coach
                  </h1>
                  <p className="text-sm text-gray-600">
                    Enterprise-grade financial visibility with cybersecurity intelligence
                  </p>
                </div>
              </div>
              <Badge variant="secondary" className="flex items-center gap-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 shadow-lg">
                <Sparkles className="w-4 h-4" /> AI-First Enterprise
              </Badge>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left column – Profile & Import */}
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                                <Card className="backdrop-blur-xl bg-white/90 border-white/40 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-[1.02]">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-gray-800">
                      <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                        <DollarSign className="w-5 h-5 text-white" />
                      </div>
                      Profile
                    </CardTitle>
                    <CardDescription className="text-gray-600">Enterprise financial baseline configuration</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-gray-700 font-medium">Monthly Income</Label>
                        <Input 
                          type="number" 
                          value={profile.monthlyIncome}
                          onChange={(e) => setProfile({ ...profile, monthlyIncome: Number(e.target.value) })}
                          className="bg-white/80 border-gray-300 text-gray-800 placeholder:text-gray-500 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-700 font-medium">Recurring Bills</Label>
                        <Input 
                          type="number" 
                          value={profile.recurringBills}
                          onChange={(e) => setProfile({ ...profile, recurringBills: Number(e.target.value) })}
                          className="bg-white/80 border-gray-300 text-gray-800 placeholder:text-gray-500 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-700 font-medium">Current Savings</Label>
                        <Input 
                          type="number" 
                          value={profile.currentSavings}
                          onChange={(e) => setProfile({ ...profile, currentSavings: Number(e.target.value) })}
                          className="bg-white/80 border-gray-300 text-gray-800 placeholder:text-gray-500 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-700 font-medium">Goal Amount</Label>
                        <Input 
                          type="number" 
                          value={profile.goalAmount}
                          onChange={(e) => setProfile({ ...profile, goalAmount: Number(e.target.value) })}
                          className="bg-white/80 border-gray-300 text-gray-800 placeholder:text-gray-500 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200"
                        />
                      </div>
                      <div className="col-span-2">
                        <Label className="text-gray-700 font-medium">Goal Name</Label>
                        <Input 
                          value={profile.goalName}
                          onChange={(e) => setProfile({ ...profile, goalName: e.target.value })}
                          className="bg-white/80 border-gray-300 text-gray-800 placeholder:text-gray-500 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                                 <Card className="backdrop-blur-xl bg-white/90 border-white/40 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-[1.02]">
                   <CardHeader>
                     <CardTitle className="flex items-center gap-2 text-gray-800">
                       <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                         <Upload className="w-5 h-5 text-white" />
                       </div>
                       Import Transactions
                     </CardTitle>
                     <CardDescription className="text-gray-600">Enterprise CSV integration with validation</CardDescription>
                   </CardHeader>
                   <CardContent className="space-y-3">
                     <Input 
                       type="file" 
                       accept=".csv" 
                       onChange={(e) => {
                         const file = e.target.files?.[0];
                         if (file) handleFileUpload(file);
                       }}
                       className="bg-white/80 border-gray-300 text-gray-800 file:bg-blue-600 file:border-0 file:text-white file:px-4 file:py-2 file:rounded-lg file:hover:bg-blue-700 transition-all duration-200"
                     />
                     <Button 
                       variant="outline" 
                       onClick={() => {
                         setTxns(parseCsv(SAMPLE_CSV));
                         push("Enterprise sample data loaded successfully.");
                       }}
                       className="w-full bg-white/80 border-gray-300 text-gray-800 hover:bg-white hover:border-gray-400 transition-all duration-200"
                     >
                       Load Enterprise Sample Data
                     </Button>
                   </CardContent>
                 </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                                 <Card className="backdrop-blur-xl bg-white/90 border-white/40 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-[1.02]">
                   <CardHeader>
                     <CardTitle className="flex items-center gap-2 text-gray-800">
                       <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
                         <Lock className="w-5 h-5 text-white" />
                       </div>
                       Enterprise Security
                     </CardTitle>
                     <CardDescription className="text-gray-600">Bank-grade security & compliance</CardDescription>
                   </CardHeader>
                   <CardContent className="text-sm text-gray-700 space-y-3">
                     <p>
                       All analytics run on-premises with enterprise-grade encryption. 
                       Future LLM integration will use zero-trust architecture with 
                       comprehensive audit logging and PII scrubbing.
                     </p>
                     <p>
                       Anomaly detection uses advanced statistical models similar to 
                       PANW's security telemetry analysis.
                     </p>
                   </CardContent>
                 </Card>
              </motion.div>
              
              {/* Innovative Financial Health Card */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card className="backdrop-blur-xl bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-[1.02]">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-gray-800">
                      <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg">
                        <span className="text-2xl">💎</span>
                      </div>
                      Financial Health Score
                    </CardTitle>
                    <CardDescription className="text-gray-600">AI-powered financial wellness assessment</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-emerald-600 mb-2">{financialHealthScore}</div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-gradient-to-r from-emerald-500 to-teal-500 h-3 rounded-full transition-all duration-1000 ease-out"
                          style={{ width: `${financialHealthScore}%` }}
                        />
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        {financialHealthScore >= 80 ? "Excellent" : 
                         financialHealthScore >= 60 ? "Good" : 
                         financialHealthScore >= 40 ? "Fair" : "Needs Attention"}
                      </p>
                    </div>
                    
                    <div className="border-t border-emerald-200 pt-4">
                      <h4 className="font-medium text-gray-800 mb-2">Next Milestone</h4>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{nextMilestone.icon}</span>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-800">{nextMilestone.name}</div>
                          <div className="text-xs text-gray-600">
                            {currency(nextMilestone.current)} / {currency(nextMilestone.target)}
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                            <div 
                              className="bg-emerald-500 h-2 rounded-full transition-all duration-1000 ease-out"
                              style={{ width: `${Math.min(100, (nextMilestone.current / nextMilestone.target) * 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
              
              {/* Smart Recommendations Card */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Card className="backdrop-blur-xl bg-gradient-to-br from-amber-50 to-orange-50 border-orange-200 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-[1.02]">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-gray-800">
                      <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg">
                        <span className="text-2xl">🧠</span>
                      </div>
                      AI Smart Recommendations
                    </CardTitle>
                    <CardDescription className="text-gray-600">Real-time insights & predictive analytics</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {spendingPredictions.length === 0 ? (
                      <div className="text-center py-4">
                        <span className="text-4xl">🎉</span>
                        <p className="text-sm text-gray-600 mt-2">Great job! No immediate actions needed.</p>
                      </div>
                    ) : (
                      spendingPredictions.map((rec, index) => (
                        <div key={index} className={`p-3 rounded-lg border-l-4 ${
                          rec.type === 'warning' ? 'bg-amber-50 border-amber-400' :
                          rec.type === 'alert' ? 'bg-red-50 border-red-400' :
                          'bg-blue-50 border-blue-400'
                        }`}>
                          <div className="flex items-start gap-3">
                            <span className="text-xl">{rec.icon}</span>
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-800">{rec.message}</div>
                              <div className="text-xs text-gray-600 mt-1">{rec.action}</div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                    
                    <div className="border-t border-orange-200 pt-3">
                      <div className="text-xs text-gray-500 text-center">
                        💡 AI analyzes your spending patterns every 24 hours
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Right – KPIs & Charts */}
            <div className="lg:col-span-2 space-y-6">
              {/* KPI Cards with Glassmorphism */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-4"
              >
                                 <Card className="backdrop-blur-xl bg-white/90 border-white/40 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-[1.02]">
                   <CardHeader className="pb-2">
                     <CardTitle className="text-base flex items-center gap-2 text-gray-800">
                       <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                         <TrendingUp className="w-4 h-4 text-white" />
                       </div>
                       Monthly Savings
                     </CardTitle>
                   </CardHeader>
                   <CardContent>
                     <div className="text-2xl font-semibold text-gray-800">{currency(monthlySavings)}</div>
                     <p className="text-xs text-gray-600">Income – (Recurring + Variable Spend)</p>
                   </CardContent>
                 </Card>

                 <Card className="backdrop-blur-xl bg-white/90 border-white/40 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-[1.02]">
                   <CardHeader className="pb-2">
                     <CardTitle className="text-base flex items-center gap-2 text-gray-800">
                       <div className="p-2 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg">
                         <Target className="w-4 h-4 text-white" />
                       </div>
                       ETA to "{profile.goalName}"
                     </CardTitle>
                   </CardHeader>
                   <CardContent>
                     <div className="text-2xl font-semibold text-gray-800">{goalMonths === null ? "Not reachable" : `${goalMonths} mo`}</div>
                     <p className="text-xs text-gray-600 flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {etaDate}
                      </p>
                   </CardContent>
                 </Card>

                 <Card className="backdrop-blur-xl bg-white/90 border-white/40 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-[1.02]">
                   <CardHeader className="pb-2">
                     <CardTitle className="text-base flex items-center gap-2 text-gray-800">
                       <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
                         <Rocket className="w-4 h-4 text-white" />
                       </div>
                       Enterprise Score
                     </CardTitle>
                   </CardHeader>
                   <CardContent>
                     <div className="text-2xl font-semibold text-gray-800">{score}</div>
                     <Progress value={score} className="mt-2 bg-gray-200" />
                     <p className="text-xs text-gray-600">Savings rate + anomaly hygiene</p>
                   </CardContent>
                 </Card>
              </motion.div>

              {/* Charts with Glassmorphism */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Card className="backdrop-blur-xl bg-white/80 border-white/40 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-[1.02]">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-gray-800">
                      <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg">
                        <PieIcon className="w-5 h-5 text-white" />
                      </div>
                      Financial Analytics
                    </CardTitle>
                    <CardDescription className="text-gray-600">Enterprise spending composition & trends</CardDescription>
                  </CardHeader>
                                     <CardContent className="space-y-6">
                     {/* Pie Chart with Clean Layout */}
                     <div className="h-80">
                       <h4 className="text-gray-800 font-semibold mb-4 text-center">Spending Distribution</h4>
                       <ResponsiveContainer width="100%" height="100%">
                         <PieChart>
                           <Pie 
                             data={pieData} 
                             dataKey="value" 
                             nameKey="name" 
                             cx="50%" 
                             cy="50%" 
                             outerRadius={80}
                             innerRadius={30}
                             paddingAngle={2}
                           />
                           <RTooltip 
                             contentStyle={{ 
                               backgroundColor: 'rgba(255,255,255,0.95)', 
                               border: '1px solid rgba(0,0,0,0.1)',
                               borderRadius: '12px',
                               color: 'black',
                               boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                             }}
                             formatter={(value, name) => [currency(Number(value)), name]}
                           />
                           {pieData.map((entry, index) => (
                             <Cell key={`cell-${index}`} fill={entry.fill} />
                           ))}
                         </PieChart>
                       </ResponsiveContainer>
                       {/* Clean Legend Below */}
                       <div className="mt-4 flex flex-wrap justify-center gap-3">
                         {pieData.map((entry, index) => (
                           <div key={index} className="flex items-center gap-2">
                             <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.fill }} />
                             <span className="text-sm text-gray-700 font-medium">{entry.name}</span>
                             <span className="text-xs text-gray-500">
                               {currency(entry.value)} ({((entry.value / pieData.reduce((sum, item) => sum + item.value, 0)) * 100).toFixed(1)}%)
                             </span>
                           </div>
                         ))}
                       </div>
                     </div>
                     
                                           {/* Interactive Bar Chart */}
                      <div className="h-80">
                        <h4 className="text-gray-800 font-medium mb-4 text-center">Monthly Spending by Category</h4>
                       <ResponsiveContainer width="100%" height="100%">
                         <BarChart data={catTotals} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                           <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                           <XAxis 
                             dataKey="category" 
                             stroke="rgba(255,255,255,0.7)"
                             fontSize={12}
                             angle={-45}
                             textAnchor="end"
                             height={80}
                           />
                           <YAxis 
                             stroke="rgba(255,255,255,0.7)"
                             fontSize={12}
                             tickFormatter={(value) => `$${value}`}
                           />
                           <RTooltip 
                             contentStyle={{ 
                               backgroundColor: 'rgba(0,0,0,0.8)', 
                               border: '1px solid rgba(255,255,255,0.2)',
                               borderRadius: '8px',
                               color: 'white'
                             }}
                             formatter={(value) => [currency(Number(value)), 'Amount']}
                           />
                           <Bar 
                             dataKey="total" 
                             fill="#60a5fa"
                             radius={[4, 4, 0, 0]}
                           />
                         </BarChart>
                       </ResponsiveContainer>
                     </div>
                     
                                           {/* Line Chart */}
                      <div className="h-80">
                        <h4 className="text-gray-800 font-medium mb-4 text-center">Cumulative Spending Trend</h4>
                       <ResponsiveContainer width="100%" height="100%">
                         <LineChart data={monthlyChartData}>
                           <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                           <XAxis 
                             dataKey="date" 
                             stroke="rgba(255,255,255,0.7)"
                             fontSize={12}
                           />
                           <YAxis 
                             stroke="rgba(255,255,255,0.7)"
                             fontSize={12}
                             tickFormatter={(value) => `$${value}`}
                           />
                           <RTooltip 
                             contentStyle={{ 
                               backgroundColor: 'rgba(0,0,0,0.8)', 
                               border: '1px solid rgba(255,255,255,0.2)',
                               borderRadius: '8px',
                               color: 'white'
                             }}
                             formatter={(value) => [currency(Number(value)), 'Cumulative Spend']}
                           />
                           <Legend />
                           <Line 
                             type="monotone" 
                             dataKey="cumulative" 
                             name="Cumulative Spend" 
                             stroke="#60a5fa" 
                             strokeWidth={3}
                             dot={{ fill: '#60a5fa', strokeWidth: 2, r: 4 }}
                             activeDot={{ r: 6, stroke: '#60a5fa', strokeWidth: 2 }}
                           />
                         </LineChart>
                       </ResponsiveContainer>
                     </div>
                   </CardContent>
                </Card>
              </motion.div>

              {/* Tabs with Glassmorphism */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                                 <Tabs defaultValue="insights" className="backdrop-blur-xl bg-white/90 border-white/40 rounded-2xl p-4 shadow-2xl hover:shadow-3xl transition-all duration-300">
                   <TabsList className="bg-white/80 border-gray-300">
                     <TabsTrigger value="insights" className="text-gray-700 data-[state=active]:bg-blue-500 data-[state=active]:text-white">AI Insights</TabsTrigger>
                     <TabsTrigger value="transactions" className="text-gray-700 data-[state=active]:bg-blue-500 data-[state=active]:text-white">Transactions</TabsTrigger>
                     <TabsTrigger value="automation" className="text-gray-700 data-[state=active]:bg-blue-500 data-[state=active]:text-white">Automation</TabsTrigger>
                     <TabsTrigger value="risk" className="text-gray-700 data-[state=active]:bg-blue-500 data-[state=active]:text-white">Risk & Anomalies</TabsTrigger>
                   </TabsList>

                                     <TabsContent value="insights" className="mt-4">
                     <Card className="backdrop-blur-xl bg-white/90 border-white/40 shadow-2xl hover:shadow-3xl transition-all duration-300">
                       <CardHeader>
                         <CardTitle className="flex items-center gap-2 text-gray-800">
                           <div className="p-2 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-lg">
                             <Sparkles className="w-5 h-5 text-white" />
                           </div>
                           Enterprise AI Insights
                         </CardTitle>
                         <CardDescription className="text-gray-600">Strategic financial recommendations</CardDescription>
                       </CardHeader>
                       <CardContent className="space-y-3">
                         {topNudges.map((n, i) => (
                           <div key={i} className="flex items-start gap-2">
                             <div className="p-1 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full">
                               <Bell className="w-4 h-4 text-white" />
                             </div>
                             <p className="text-sm text-gray-800">{n}</p>
                           </div>
                         ))}
                         <Separator className="bg-gray-200" />
                         <div>
                           <div className="text-sm font-medium mb-1 text-gray-800">AI Strategic Analysis</div>
                           <div className="text-sm text-gray-600 whitespace-pre-line">{aiAdvice}</div>
                         </div>
                         <Separator className="bg-gray-200" />
                         <div className="text-sm text-gray-600">
                           Strategic opportunity cost (12 mo): <strong className="text-gray-800">{currency(oppCostYear)}</strong>
                         </div>
                       </CardContent>
                     </Card>
                   </TabsContent>

                                     <TabsContent value="transactions" className="mt-4">
                     <Card className="backdrop-blur-xl bg-white/90 border-white/40 shadow-2xl hover:shadow-3xl transition-all duration-300">
                       <CardHeader>
                         <CardTitle className="text-gray-800">Enterprise Transactions</CardTitle>
                         <CardDescription className="text-gray-600">Comprehensive financial data analysis</CardDescription>
                       </CardHeader>
                       <CardContent>
                         <div className="overflow-auto max-h-80 rounded border border-gray-200">
                           <table className="w-full text-sm">
                             <thead className="bg-gray-50">
                               <tr>
                                 <th className="text-left p-2 text-gray-700">Date</th>
                                 <th className="text-left p-2 text-gray-700">Merchant</th>
                                 <th className="text-left p-2 text-gray-700">Category</th>
                                 <th className="text-right p-2 text-gray-700">Amount</th>
                               </tr>
                             </thead>
                             <tbody>
                               {txns.map((t, i) => (
                                 <tr key={i} className="border-b border-gray-100 last:border-none hover:bg-gray-50 transition-colors">
                                   <td className="p-2 text-gray-800">{t.date}</td>
                                   <td className="p-2 text-gray-600">{t.merchant || "—"}</td>
                                   <td className="p-2 text-gray-600">{t.category}</td>
                                   <td className="p-2 text-right text-gray-800">{currency(t.amount)}</td>
                                 </tr>
                               ))}
                             </tbody>
                           </table>
                         </div>
                       </CardContent>
                     </Card>
                   </TabsContent>

                                     <TabsContent value="automation" className="mt-4">
                     <Card className="backdrop-blur-xl bg-white/90 border-white/40 shadow-2xl hover:shadow-3xl transition-all duration-300">
                       <CardHeader>
                         <CardTitle className="text-gray-800">Enterprise Automation</CardTitle>
                         <CardDescription className="text-gray-600">Future-ready financial workflows</CardDescription>
                       </CardHeader>
                       <CardContent className="space-y-4">
                         <div className="flex items-center justify-between">
                           <div>
                             <div className="font-medium text-gray-800">Auto-Pay Bills</div>
                             <div className="text-sm text-gray-600">Enterprise-grade bill management</div>
                           </div>
                           <Switch checked={autoPayBills} onCheckedChange={(v) => {
                             setAutoPayBills(v);
                             push(v ? "Enterprise autopay enabled" : "Enterprise autopay disabled");
                           }} />
                         </div>
                         <div className="flex items-center justify-between">
                           <div>
                             <div className="font-medium text-gray-800">Auto-Invest Spare Change</div>
                             <div className="text-sm text-gray-600">Institutional investment integration</div>
                           </div>
                           <Switch checked={autoInvestSpareChange} onCheckedChange={(v) => {
                             setAutoInvestSpareChange(v);
                             push(v ? "Enterprise auto-invest enabled" : "Enterprise auto-invest disabled");
                           }} />
                         </div>
                         <Separator className="bg-gray-200" />
                         <div className="text-sm text-gray-600">
                           Future integration: Enterprise-grade providers with SOC 2 compliance, 
                           zero-trust architecture, and comprehensive audit trails.
                         </div>
                       </CardContent>
                     </Card>
                   </TabsContent>

                                     <TabsContent value="risk" className="mt-4">
                     <Card className="backdrop-blur-xl bg-white/90 border-white/40 shadow-2xl hover:shadow-3xl transition-all duration-300">
                       <CardHeader>
                         <CardTitle className="flex items-center gap-2 text-gray-800">
                           <div className="p-2 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg">
                             <AlertTriangle className="w-5 h-5 text-white" />
                           </div>
                           Enterprise Risk Management
                         </CardTitle>
                         <CardDescription className="text-gray-600">Advanced anomaly detection & compliance</CardDescription>
                       </CardHeader>
                       <CardContent className="space-y-3">
                         {anomalies.length === 0 ? (
                           <div className="text-sm text-gray-600">No anomalies detected. Enterprise compliance maintained. 👍</div>
                         ) : (
                           <div className="overflow-auto max-h-64 rounded border border-gray-200">
                             <table className="w-full text-sm">
                               <thead className="bg-gray-50">
                                 <tr>
                                   <th className="text-left p-2 text-gray-700">Date</th>
                                   <th className="text-left p-2 text-gray-700">Merchant</th>
                                   <th className="text-left p-2 text-gray-700">Category</th>
                                   <th className="text-right p-2 text-gray-700">Amount</th>
                                   </tr>
                               </thead>
                               <tbody>
                                 {anomalies.map((t, i) => (
                                   <tr key={i} className="border-b border-gray-100 last:border-none hover:bg-gray-50 transition-colors">
                                     <td className="p-2 text-gray-800">{t.date}</td>
                                     <td className="p-2 text-gray-600">{t.merchant || "—"}</td>
                                     <td className="p-2 text-gray-600">{t.category}</td>
                                     <td className="p-2 text-right text-gray-800">{currency(t.amount)}</td>
                                   </tr>
                                 ))}
                               </tbody>
                             </table>
                           </div>
                         )}
                         <Separator className="bg-gray-200" />
                         <div className="text-sm text-gray-600">
                           Enterprise-grade ML-based fraud detection with real-time monitoring, 
                           regulatory compliance, and automated alerting systems.
                         </div>
                       </CardContent>
                     </Card>
                   </TabsContent>
                </Tabs>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

             {/* Enhanced Toasts with Glassmorphism */}
       <div className="fixed bottom-4 right-4 space-y-2 z-50">
         {toasts.map((t) => (
           <motion.div
             key={t.id}
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
             exit={{ opacity: 0, y: 10 }}
             className="backdrop-blur-xl bg-white/90 border border-gray-200 rounded-xl shadow-2xl p-4 text-sm flex items-start gap-3 max-w-sm"
           >
             <div className="p-1 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full">
               <Bell className="w-4 h-4 text-white" />
             </div>
             <span className="text-gray-800">{t.message}</span>
           </motion.div>
         ))}
       </div>
    </div>
  );
}

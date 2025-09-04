export type AdviceInputTxn = { date: string; category: string; amount: number; merchant?: string };
export type AdviceGoal = { name: string; amount: number };

export function mockAIAdvice(transactions: AdviceInputTxn[], goals: AdviceGoal[]): string {
  const total = transactions.reduce((s, t) => s + t.amount, 0);
  const topCategory = Object.entries(
    transactions.reduce<Record<string, number>>((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1])[0]?.[0];
  const goal = goals[0]?.name || "your goal";
  const suggestion = topCategory ? `Consider trimming ${topCategory} a bit next month.` : "Nice balance across categories.";
  return `Based on ${transactions.length} recent transactions (~$${total.toFixed(0)}), you're trending steadily toward ${goal}.
${suggestion} Try a weekly check-in to stay on track.`;
}

export function getAIAdvice(transactions: AdviceInputTxn[], goals: AdviceGoal[]): string {
  // Placeholder for future external AI integration
  return mockAIAdvice(transactions, goals);
}



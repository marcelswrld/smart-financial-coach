def generate_insights(goal_amount, savings, monthly_savings, months_eta):
    insights = []
    
    if savings <= 0:
        insights.append("You're currently overspending. Consider cutting back in one category.")
    else:
        insights.append(f"You saved ${savings:.2f} this month.")

    if months_eta is None:
        insights.append("At your current spending rate, you won’t reach your goal.")
    else:
        insights.append(
            f"At this rate, you'll reach your ${goal_amount} goal in about {months_eta} months."
        )
    
    # Example nudges
    insights.append("Cutting $50 from dining out saves ~1 week toward your goal.")
    return insights

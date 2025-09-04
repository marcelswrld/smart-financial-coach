def predict_goal_eta(goal_amount, current_savings, monthly_savings):
    if monthly_savings <= 0:
        return None  # cannot reach goal with current trend
    months_needed = (goal_amount - current_savings) / monthly_savings
    return round(months_needed, 1)

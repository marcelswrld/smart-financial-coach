from analysis import load_transactions, categorize_spending, calc_savings
from forecasting import predict_goal_eta
from insights import generate_insights

def main():
    # Mock user profile
    income = 4000  # monthly income
    recurring_bills = 500  # fixed monthly bills
    goal_amount = 3000
    current_savings = 500  # starting savings
    
    # Load data
    transactions = load_transactions()
    
    # Analysis
    category_totals = categorize_spending(transactions)
    savings = calc_savings(income, recurring_bills, transactions)
    months_eta = predict_goal_eta(goal_amount, current_savings, savings)
    
    # Insights
    insights = generate_insights(goal_amount, savings, savings, months_eta)
    
    # Demo output
    print("\n📊 Spending by Category:")
    for cat, amt in category_totals.items():
        print(f"  {cat}: ${amt:.2f}")
    
    print("\n💡 Insights:")
    for tip in insights:
        print(f" - {tip}")

if __name__ == "__main__":
    main()

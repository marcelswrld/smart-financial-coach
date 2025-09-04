import pandas as pd

def load_transactions(csv_path="data/transactions.csv"):
    return pd.read_csv(csv_path, parse_dates=["date"])

def categorize_spending(transactions):
    category_totals = transactions.groupby("category")["amount"].sum().to_dict()
    return category_totals

def total_spent(transactions):
    return transactions["amount"].sum()

def calc_savings(income, recurring_bills, transactions):
    expenses = total_spent(transactions) + recurring_bills
    savings = income - expenses
    return savings if savings > 0 else 0

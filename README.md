# 🛡️ Smart Financial Coach

**Smart Financial Coach** is a React + TypeScript web application that helps users gain visibility into their spending, track financial goals, and receive personalized financial insights.  
This MVP was built for the Palo Alto Networks Case Challenge to showcase **AI-readiness** and **cybersecurity-conscious design**.

---

## 🎥 Demo Video
[![Demo Video](https://img.youtube.com/vi/TKgCQ5RXO0k/0.jpg)](https://youtu.be/TKgCQ5RXO0k)  
Click the thumbnail above to watch the full demo on YouTube.  

## 🚀 Features

- **CSV Upload & Parsing**
  - Upload your own transactions (Date, Merchant, Amount, Category).
  - Built with [PapaParse](https://www.papaparse.com/) for CSV handling.

- **Financial Goals Tracking**
  - Define savings goals (e.g., *Emergency Fund: $3,000*).
  - Real-time progress bars and estimated time to completion.

- **AI Insights (Rule-Based MVP)**
  - Mock AI logic generates financial coaching advice.
  - Future-ready: easily swappable with Claude/OpenAI API.

- **Interactive Dashboard**
  - KPI cards for savings, ETA, and profitability score.
  - Pie chart for spending breakdown.
  - Line chart for cumulative spending vs. income.

- **Notifications & Alerts**
  - Real-time feedback when purchases impact goal timelines.

- **Demo Dataset**
  - Preloaded synthetic transactions ensure the demo always works live.

---

## 📊 Demo Dataset

We provide a **realistic synthetic CSV** (`transactions_demo.csv`) for testing:

- Covers **June–August 2025**  
- Recurring fixed expenses (*Rent, Utilities, Healthcare*)  
- Variable spending (*Groceries, Dining, Entertainment*)  
- Large anomaly purchases (*Shopping $1,200, Electronics $1,500*) to trigger insights  

### Example Rows:
```csv
2025-06-01,Rent,1500,Housing
2025-06-02,Chipotle,25,Dining
2025-06-03,Spotify,10,Subscription
2025-07-10,Amazon,1200,Shopping
2025-08-15,Best Buy,1500,Electronics
🖥️ How to Run
Clone the repo:

bash
Copy code
git clone https://github.com/marcelswrld/smart-financial-coach.git
cd smart-financial-coach
Install dependencies:

bash
Copy code
npm install
Start the app:

bash
Copy code
npm start
Load data:

Click “Load Sample Data” to see instant results.

Or upload transactions_demo.csv for custom demo data.

🛠️ Tech Stack
Frontend: React + TypeScript

Styling: TailwindCSS + shadcn/ui

Charts: Recharts

CSV Parsing: PapaParse

AI Mock Module: getMockAIAdvice() (ready to be swapped with Claude/OpenAI API)

🔒 Security & Future Enhancements
This MVP runs entirely in-browser (no external API calls).
Planned improvements:

🔐 Backend (FastAPI) for secure data handling & AI API integration

📱 Mobile app (React Native)

💳 Bank API integration (Plaid) to replace CSV uploads

📈 Credit score impact estimation

🔎 Subscription & hidden charge detection

🤖 Real AI-powered advice via Claude/OpenAI

🎥 Demo Video
A full walkthrough of the app is available here:
👉 YouTube Demo Link (to be added after recording with OBS)

👤 Author
Developed by Marcel Martin

LinkedIn: linkedin.com/in/marcel-martin-link

GitHub: @marcelswrld

⚠️ Disclaimer
This is a demo project created for the Palo Alto Networks Case Challenge.
The financial insights and credit estimations are not official financial advice and should not be relied upon for personal financial decisions.


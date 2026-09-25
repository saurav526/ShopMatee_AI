# ShopMate AI — Agentic E-Commerce Platform

A  e-commerce demo combining a React storefront with a multi-tool AI shopping agent.

## Stack
- React + Vite
- FastAPI
- PostgreSQL + pgvector
- Groq `openai/gpt-oss-120b` for the main agent
- Sentence Transformers `all-MiniLM-L6-v2` for product embeddings
- JWT authentication
- scikit-learn ranking/recommendation layer
- Analytics dashboard

Groq currently recommends GPT-OSS 120B/20B for modern tool-use workflows; this project defaults to `openai/gpt-oss-120b`. The agent uses local function/tool calling: the model requests tools, FastAPI executes them, then the results are returned to the model for the final answer.

## Features
1. AI Shopping Agent
2. Product Search Agent/tool
3. Recommendation & ranking model
4. Product comparison
5. Cart tool
6. Checkout/order tool
7. PostgreSQL product/order/user database
8. pgvector semantic product search
9. JWT login/register
10. Order analytics dashboard
11. Deterministic fallback if Groq is not configured
12. Demo product catalog
13. AI assistent for helping user query

### A. Install prerequisites
- Python 3.11+
- Node.js 18+
- Docker Desktop
- postgresSQL (pgadmin14)

### B. Start PostgreSQL + pgvector
From the project root:

```bash
docker compose up -d db
```

### C. Backend

```bash
cd backend
python -m venv venv
venv\\Scripts\\activate
pip install -r requirements.txt
copy .env.example .env
```

Edit `.env` and put your Groq key:

```env
GROQ_API_KEY=your_key_here
GROQ_MODEL=openai/gpt-oss-120b
```

Start API:

```bash
uvicorn app.main:app --reload --port 8000
```

The first startup downloads the `all-MiniLM-L6-v2` embedding model and seeds the database.

### D. Frontend
Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

## Demo account
You can register from the UI. For quick testing, the seeded database also creates:
- Email: `demo@shopmate.local`
- Password: `Demo@12345`

## Try these prompts
- Show me waterproof jackets under $100 for hiking
- Find running shoes under $120 with rating above 4.5
- What are the best hiking products for a beginner?
- Compare Alpine Waterproof Jacket and StormShield Hiking Shell
- Add Alpine Waterproof Jacket to my cart
- What is in my cart?
- Place my order

## Architecture

Browser → React → FastAPI → Agent Orchestrator → Groq GPT-OSS 120B
                                  │
                                  ├── Search tool → PostgreSQL + pgvector
                                  ├── Recommendation tool → ranking model
                                  ├── Comparison tool → PostgreSQL
                                  ├── Cart tool → PostgreSQL
                                  ├── Checkout tool → PostgreSQL
                                  └── Analytics tool → PostgreSQL

## Notes
- Checkout is simulated. No real payment is processed.
- This is a demo catalog with synthetic data.
- The AI never invents prices, stock, or order IDs when tools are available.
- If no Groq key is configured, a deterministic fallback keeps the store usable.

## Production upgrades
- Stripe/Razorpay payment integration
- Redis session/cache
- object storage for product images
- event streaming for click/order analytics
- collaborative filtering from real user events
- LangGraph orchestration/tracing
- admin RBAC
- rate limiting and audit logs

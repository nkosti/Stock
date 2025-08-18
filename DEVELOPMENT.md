# Development Notes

## Port Management

**IMPORTANT: Always check ports before starting servers**

### Backend Port Check
```bash
# Check if port 8000 is in use
lsof -ti:8000

# If process found, kill it:
kill $(lsof -ti:8000)

# Then start backend
source .venv/bin/activate && cd backend && python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

### Frontend Port Check  
```bash
# Check if port 3000 is in use
lsof -ti:3000

# If process found, kill it:
kill $(lsof -ti:3000)

# Then start frontend
cd frontend && npm run dev
```

## Standard Development Setup

1. **Check and free ports:**
   ```bash
   kill $(lsof -ti:8000) 2>/dev/null || true
   kill $(lsof -ti:3000) 2>/dev/null || true
   ```

2. **Start backend (port 8000):**
   ```bash
   source .venv/bin/activate
   cd backend
   python -m uvicorn main:app --host 0.0.0.0 --port 8000
   ```

3. **Start frontend (port 3000/3002):**
   ```bash
   cd frontend
   npm run dev
   ```

## API Configuration

- **Backend:** http://localhost:8000
- **Frontend:** http://localhost:3000 (or 3002 if 3000 is busy)
- **All API calls should use:** `http://localhost:8000`

## Common Issues

### Port Conflicts
- If backend fails to start on 8000, another Python process is running
- Use `ps aux | grep python` to find conflicting processes
- **NEVER change API URLs** - always fix the port conflict instead

### CORS Issues
- Backend allows origins: 3000, 3001, 3002
- If frontend runs on different port, update `main.py` CORS config

## Project Structure

```
Stock/
├── backend/                 # FastAPI backend (port 8000)
│   ├── main.py             # Main app with CORS config
│   ├── routers/            # API routes
│   └── requirements.txt
├── frontend/               # Next.js frontend (port 3000)
│   ├── src/
│   │   ├── app/           # App router pages
│   │   └── components/    # Reusable components
│   └── package.json
└── .github/workflows/     # CI/CD pipelines
```

## Development Commands

### Linting & Formatting
```bash
# Frontend
cd frontend && npm run lint

# Backend  
cd backend && black . && isort . && flake8 .
```

### Testing API
```bash
# Test backend health
curl http://localhost:8000/health

# Test stock API
curl "http://localhost:8000/api/stocks/AAPL/info"
```

## Deployment Notes

- Backend serves on 0.0.0.0:8000 for external access
- Frontend connects to localhost:8000 in development
- CORS configured for localhost:3000, 3001, 3002
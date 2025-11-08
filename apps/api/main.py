from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import firebase_admin
from firebase_admin import credentials, auth
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Firebase Admin SDK - com fallback para desenvolvimento
FIREBASE_CONFIGURED = os.getenv("FIREBASE_PROJECT_ID") and os.getenv("FIREBASE_PRIVATE_KEY")

if not firebase_admin._apps and FIREBASE_CONFIGURED:
    try:
        cred_dict = {
            "type": "service_account",
            "project_id": os.getenv("FIREBASE_PROJECT_ID"),
            "private_key_id": os.getenv("FIREBASE_PRIVATE_KEY_ID"),
            "private_key": os.getenv("FIREBASE_PRIVATE_KEY", "").replace('\\n', '\n'),
            "client_email": os.getenv("FIREBASE_CLIENT_EMAIL"),
            "client_id": os.getenv("FIREBASE_CLIENT_ID"),
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
        }
        cred = credentials.Certificate(cred_dict)
        firebase_admin.initialize_app(cred)
        print("✅ Firebase Admin SDK inicializado com sucesso")
    except Exception as e:
        print(f"⚠️  Erro ao inicializar Firebase: {e}")
        print("⚠️  Executando em modo desenvolvimento sem autenticação")
        FIREBASE_CONFIGURED = False
else:
    if not FIREBASE_CONFIGURED:
        print("⚠️  Firebase não configurado - executando em modo desenvolvimento")
        print("📝 Configure as variáveis de ambiente no arquivo .env para habilitar autenticação")

# Create FastAPI app
app = FastAPI(
    title="Finance System API",
    description="API Backend para Sistema de Finanças Premium",
    version="1.0.0",
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:3000").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Authentication Middleware
@app.middleware("http")
async def auth_middleware(request: Request, call_next):
    # Skip auth for root and health check
    if request.url.path in ["/", "/health", "/docs", "/redoc", "/openapi.json"]:
        return await call_next(request)
    
    # Em modo desenvolvimento sem Firebase, pular autenticação
    if not FIREBASE_CONFIGURED:
        request.state.user_id = "dev-user"  # User ID fake para desenvolvimento
        return await call_next(request)
    
    # Get token from Authorization header
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")
    
    token = auth_header.replace("Bearer ", "")
    
    try:
        # Verify Firebase token
        decoded_token = auth.verify_id_token(token)
        request.state.user_id = decoded_token["uid"]
        request.state.user_email = decoded_token.get("email")
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")
    
    return await call_next(request)

# Exception handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "error": str(exc)},
    )

# Import routers
from routers import overview, transactions, budgets, goals, forecasts

# Register routers
app.include_router(overview.router, prefix="/api", tags=["Overview"])
app.include_router(transactions.router, prefix="/api", tags=["Transactions"])
app.include_router(budgets.router, prefix="/api", tags=["Budgets"])
app.include_router(goals.router, prefix="/api", tags=["Goals"])
app.include_router(forecasts.router, prefix="/api", tags=["Forecasts"])

# Health check
@app.get("/")
async def root():
    return {"message": "Finance System API", "version": "1.0.0", "status": "running"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=os.getenv("API_HOST", "0.0.0.0"),
        port=int(os.getenv("API_PORT", 8000)),
        reload=True,
    )

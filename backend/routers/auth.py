from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
import random
import string
import os
from typing import Dict

router = APIRouter(prefix="/auth", tags=["authentication"])

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")

# JWT settings
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Email configuration
conf = ConnectionConfig(
    MAIL_USERNAME=os.getenv("MAIL_USERNAME", ""),
    MAIL_PASSWORD=os.getenv("MAIL_PASSWORD", ""),
    MAIL_FROM=os.getenv("MAIL_FROM", "noreply@stockvaluer.com"),
    MAIL_PORT=587,
    MAIL_SERVER=os.getenv("MAIL_SERVER", "smtp.gmail.com"),
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True
)

# In-memory storage (replace with database in production)
users_db: Dict[str, dict] = {}
verification_codes: Dict[str, str] = {}

# Pydantic models
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class EmailVerify(BaseModel):
    email: EmailStr
    code: str

class ResendVerification(BaseModel):
    email: EmailStr

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def generate_verification_code():
    return ''.join(random.choices(string.digits, k=6))

async def send_verification_email(email: str, code: str):
    try:
        message = MessageSchema(
            subject="StockValuer - Email Verification",
            recipients=[email],
            body=f"""
            <html>
                <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background-color: #0f172a; padding: 20px; text-align: center;">
                        <h1 style="color: #10b981; margin: 0;">StockValuer</h1>
                    </div>
                    <div style="padding: 30px; background-color: #f8fafc;">
                        <h2 style="color: #1e293b;">Verify Your Email Address</h2>
                        <p style="color: #475569; font-size: 16px;">
                            Thank you for creating your StockValuer account! Please use the verification code below to complete your registration:
                        </p>
                        <div style="background-color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
                            <h1 style="color: #10b981; font-size: 32px; letter-spacing: 8px; margin: 0;">{code}</h1>
                        </div>
                        <p style="color: #64748b; font-size: 14px;">
                            This code will expire in 10 minutes. If you didn't create this account, please ignore this email.
                        </p>
                    </div>
                </body>
            </html>
            """,
            subtype="html"
        )
        
        fm = FastMail(conf)
        await fm.send_message(message)
        return True
    except Exception as e:
        print(f"Failed to send email: {e}")
        return False

@router.post("/register")
async def register(user: UserCreate):
    # Check if user already exists
    if user.email in users_db:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash password
    hashed_password = get_password_hash(user.password)
    
    # Store user (unverified)
    users_db[user.email] = {
        "name": user.name,
        "email": user.email,
        "hashed_password": hashed_password,
        "is_verified": False,
        "created_at": datetime.utcnow()
    }
    
    # Generate and store verification code
    verification_code = generate_verification_code()
    verification_codes[user.email] = verification_code
    
    # Send verification email
    email_sent = await send_verification_email(user.email, verification_code)
    
    if not email_sent:
        # For development: proceed without email, just log the code
        print(f"Verification code for {user.email}: {verification_code}")
        return {"message": f"Registration successful. Verification code (DEV MODE): {verification_code}"}
    
    return {"message": "Registration successful. Please check your email for verification code."}

@router.post("/verify-email")
async def verify_email(verification: EmailVerify):
    if verification.email not in users_db:
        raise HTTPException(status_code=404, detail="User not found")
    
    if verification.email not in verification_codes:
        raise HTTPException(status_code=400, detail="No verification code found")
    
    if verification_codes[verification.email] != verification.code:
        raise HTTPException(status_code=400, detail="Invalid verification code")
    
    # Mark user as verified
    users_db[verification.email]["is_verified"] = True
    
    # Remove verification code
    del verification_codes[verification.email]
    
    return {"message": "Email verified successfully"}

@router.post("/resend-verification")
async def resend_verification(resend: ResendVerification):
    if resend.email not in users_db:
        raise HTTPException(status_code=404, detail="User not found")
    
    if users_db[resend.email]["is_verified"]:
        raise HTTPException(status_code=400, detail="Email already verified")
    
    # Generate new verification code
    verification_code = generate_verification_code()
    verification_codes[resend.email] = verification_code
    
    # Send verification email
    email_sent = await send_verification_email(resend.email, verification_code)
    
    if not email_sent:
        raise HTTPException(status_code=500, detail="Failed to send verification email")
    
    return {"message": "Verification code resent successfully"}

@router.post("/login")
async def login(user: UserLogin):
    if user.email not in users_db:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    stored_user = users_db[user.email]
    
    if not stored_user["is_verified"]:
        raise HTTPException(status_code=401, detail="Email not verified")
    
    if not verify_password(user.password, stored_user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt
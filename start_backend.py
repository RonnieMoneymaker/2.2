#!/usr/bin/env python3
"""
VoltMover CRM Backend Startup Script
"""
import os
import sys
import subprocess
from pathlib import Path

def check_python_version():
    """Check if Python version is 3.8 or higher"""
    if sys.version_info < (3, 8):
        print("❌ Python 3.8 or higher is required")
        sys.exit(1)
    print(f"✅ Python {sys.version_info.major}.{sys.version_info.minor} detected")

def install_dependencies():
    """Install Python dependencies"""
    print("📦 Installing Python dependencies...")
    try:
        subprocess.run([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"], check=True)
        print("✅ Dependencies installed successfully")
    except subprocess.CalledProcessError:
        print("❌ Failed to install dependencies")
        sys.exit(1)

def setup_environment():
    """Setup environment variables"""
    env_file = Path(".env")
    env_example = Path("env.example")
    
    if not env_file.exists() and env_example.exists():
        print("📝 Creating .env file from example...")
        env_file.write_text(env_example.read_text())
        print("✅ .env file created. Please update it with your settings.")
    elif not env_file.exists():
        print("⚠️  No .env file found. Creating basic configuration...")
        env_content = """# Database
DATABASE_URL=sqlite:///./voltmover_crm.db

# Security
SECRET_KEY=your-secret-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Application
DEBUG=True
CORS_ORIGINS=["http://localhost:2000"]
"""
        env_file.write_text(env_content)
        print("✅ Basic .env file created")

def create_admin_user():
    """Create default admin user"""
    print("👤 Creating default admin user...")
    
    create_user_script = """
import sys
sys.path.append('backend')

from sqlalchemy.orm import sessionmaker
from database import engine
from models import User, UserRole
from auth import get_password_hash

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

# Check if admin user exists
admin_user = db.query(User).filter(User.username == "admin").first()
if not admin_user:
    admin_user = User(
        email="admin@voltmover.com",
        username="admin",
        full_name="Administrator",
        hashed_password=get_password_hash("admin123"),
        role=UserRole.ADMIN,
        is_active=True
    )
    db.add(admin_user)
    db.commit()
    print("✅ Admin user created (username: admin, password: admin123)")
else:
    print("ℹ️  Admin user already exists")

db.close()
"""
    
    try:
        exec(create_user_script)
    except Exception as e:
        print(f"⚠️  Could not create admin user: {e}")

def start_server():
    """Start the FastAPI server"""
    print("🚀 Starting VoltMover CRM Backend...")
    print("📍 Server will be available at: http://localhost:8000")
    print("📖 API documentation: http://localhost:8000/docs")
    print("🛑 Press Ctrl+C to stop the server")
    
    os.chdir("backend")
    try:
        subprocess.run([sys.executable, "-m", "uvicorn", "main:app", "--reload", "--host", "0.0.0.0", "--port", "8000"])
    except KeyboardInterrupt:
        print("\n👋 Server stopped")

def main():
    print("🔧 VoltMover CRM Backend Setup")
    print("=" * 40)
    
    check_python_version()
    install_dependencies()
    setup_environment()
    create_admin_user()
    start_server()

if __name__ == "__main__":
    main()

from pydantic import BaseModel, EmailStr, Field


class LoginRequest(BaseModel):
    """Schema for admin login request."""

    username: str = Field(..., description="Admin username")
    password: str = Field(..., description="Admin password")


class Token(BaseModel):
    """Schema for the access token response."""

    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Schema for data encoded within the JWT token."""

    username: str | None = None
    # Add other fields like user ID, roles if needed


class UserInfo(BaseModel):
    """Schema for returning basic user info after login or for /me endpoint."""

    username: str
    email: EmailStr
    role: str
    is_active: bool

    class Config:
        from_attributes = True

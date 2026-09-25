from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from .db import (
    init_db,
    get_products,
    get_product,
    cart,
    add_cart,
    order,
    list_orders,
    analytics,
    create_user,
    user_by_email
)
from .auth import hash_pw, verify, token, current_user
from .agent import chat

app = FastAPI(title="ShopMate AI API", version="2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


class Auth(BaseModel):
    email: str
    password: str


class Chat(BaseModel):
    message: str
    history: list = []


class CartAdd(BaseModel):
    product_id: int
    quantity: int = 1


class Billing(BaseModel):
    full_name: str
    phone: str
    address: str
    city: str
    state: str
    pincode: str
    payment_method: str = "card"


DEMO_EMAIL = "demo@shopmate.local"
DEMO_PASSWORD = "Demo@12345"


@app.on_event("startup")
def startup():
    init_db()

    try:
        user = user_by_email(DEMO_EMAIL)

        if not user:
            create_user(
                DEMO_EMAIL,
                hash_pw(DEMO_PASSWORD)
            )

    except Exception as e:
        print("Demo user setup error:", e)


@app.get("/")
def root():
    return {
        "name": "ShopMate AI",
        "status": "running"
    }


@app.post("/api/auth/register")
def register(x: Auth):

    email = x.email.strip().lower()

    if user_by_email(email):
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    u = create_user(
        email,
        hash_pw(x.password)
    )

    return {
        "token": token(u["id"], u["email"]),
        "email": u["email"]
    }


@app.post("/api/auth/login")
def login(x: Auth):

    email = x.email.strip().lower()

    u = user_by_email(email)

    if not u:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    if not verify(x.password, u["password_hash"]):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    return {
        "token": token(u["id"], u["email"]),
        "email": u["email"]
    }


@app.get("/api/products")
def products():
    return get_products()


@app.get("/api/products/{pid}")
def product_detail(pid: int):
    p = get_product(pid)

    if not p:
        raise HTTPException(status_code=404, detail="Product not found")

    return p


@app.post("/api/chat")
def chat_api(
    x: Chat,
    u=Depends(current_user)
):
    return chat(
        x.message,
        x.history,
        u["id"]
    )


@app.get("/api/cart")
def getcart(
    u=Depends(current_user)
):
    return cart(u["id"])


@app.post("/api/cart/items")
def additem(
    x: CartAdd,
    u=Depends(current_user)
):
    return add_cart(
        u["id"],
        x.product_id,
        x.quantity
    )

@app.delete("/api/cart/items/{pid}")
def delitem(
    pid: int,
    u=Depends(current_user)
):
    from .db import conn

    with conn() as c:
        c.execute(
            "DELETE FROM cart_items WHERE user_id=%s AND product_id=%s",
            (u["id"], pid)
        )

    return cart(u["id"])


@app.post("/api/orders")
def checkout(
    billing: Billing | None = None,
    u=Depends(current_user)
):
    try:
        return order(u["id"], billing.dict() if billing else None)
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )


@app.get("/api/orders")
def my_orders(
    u=Depends(current_user)
):
    return list_orders(u["id"])


@app.get("/api/analytics")
def stats(
    u=Depends(current_user)
):
    return analytics()
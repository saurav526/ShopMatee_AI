import React, { useEffect, useMemo, useState } from "react";
import ReactDOM from "react-dom/client";
import "./styles.css";

const API_URL = "http://127.0.0.1:8000";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));

  if (!token) {
    return <Login onLogin={(newToken) => setToken(newToken)} />;
  }

  return (
    <Dashboard
      token={token}
      onLogout={() => {
        localStorage.removeItem("token");
        localStorage.removeItem("email");
        setToken(null);
      }}
    />
  );
}

/* =========================================================
   LOGIN
 */

function Login({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("demo@shopmate.local");
  const [password, setPassword] = useState("Demo@12345");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isSignup = mode === "signup";

  function switchMode(nextMode) {
    setMode(nextMode);
    setError("");
    setSuccess("");

    if (nextMode === "signup") {
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    } else {
      setEmail("demo@shopmate.local");
      setPassword("Demo@12345");
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (isSignup && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (isSignup && password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      const endpoint = isSignup
        ? "/api/auth/register"
        : "/api/auth/login";

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        let message = isSignup ? "Sign up failed" : "Login failed";

        if (data.detail) {
          message =
            typeof data.detail === "string"
              ? data.detail
              : JSON.stringify(data.detail);
        }

        throw new Error(message);
      }

      if (!data.token) {
        throw new Error("Authentication token was not returned.");
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("email", data.email || email);

      setSuccess(isSignup ? "Account created" : "Login successful");

      setTimeout(() => {
        onLogin(data.token);
      }, 500);
    } catch (error) {
      console.error(error);
      setError(error.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="background-grid"></div>
      <div className="glow glow-one"></div>
      <div className="glow glow-two"></div>

      <header className="topbar">
        <div className="brand">
          <div className="brand-icon">✦</div>

          <div>
            <div className="brand-name">ShopMate</div>
            <div className="brand-tag">AI Commerce</div>
          </div>
        </div>

        <div className="secure-badge">
          <span className="secure-dot"></span>
          Secure Platform
        </div>
      </header>

      <main className="login-wrapper">
        <section className="hero-section">
          <div className="eyebrow">
            <span></span>
            INTELLIGENT COMMERCE
          </div>

          <h1>
            Your shopping.
            <br />
            <span>Reimagined by AI.</span>
          </h1>

          <p className="hero-description">
            ShopMate AI brings intelligent recommendations, personalized
            discovery and agent-powered shopping into one seamless experience.
          </p>

          <div className="feature-list">
            <div className="feature">
              <div className="feature-icon">✦</div>

              <div>
                <strong>AI-Powered Discovery</strong>
                <p>Find products that match your needs.</p>
              </div>
            </div>

            <div className="feature">
              <div className="feature-icon">⌁</div>

              <div>
                <strong>Personalized Recommendations</strong>
                <p>Smarter suggestions for your journey.</p>
              </div>
            </div>

            <div className="feature">
              <div className="feature-icon">↗</div>

              <div>
                <strong>Agentic Shopping</strong>
                <p>AI assistance throughout your purchase.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="login-section">
          <div className="login-card">
            <div className="card-header">
              <div className="login-icon">✦</div>

              <div>
                <h2>{isSignup ? "Create your account" : "Welcome back"}</h2>
                <p>
                  {isSignup
                    ? "Join ShopMate to start shopping with AI"
                    : "Sign in to your ShopMate workspace"}
                </p>
              </div>
            </div>

            <div className="auth-tabs">
              <button
                type="button"
                className={!isSignup ? "active" : ""}
                onClick={() => switchMode("login")}
                disabled={loading}
              >
                Sign in
              </button>

              <button
                type="button"
                className={isSignup ? "active" : ""}
                onClick={() => switchMode("signup")}
                disabled={loading}
              >
                Sign up
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <label>Email address</label>

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  disabled={loading}
                />
              </div>

              <div className="input-group">
                <label>Password</label>

                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={
                    isSignup
                      ? "Create a password (min 6 characters)"
                      : "Enter your password"
                  }
                  required
                  disabled={loading}
                />
              </div>

              {isSignup && (
                <div className="input-group">
                  <label>Confirm password</label>

                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    required
                    disabled={loading}
                  />
                </div>
              )}

              <button
                className="login-button"
                type="submit"
                disabled={loading}
              >
                {loading
                  ? isSignup
                    ? "Creating account..."
                    : "Authenticating..."
                  : isSignup
                  ? "Create account"
                  : "Sign in to ShopMate"}
                {!loading && <span>→</span>}
              </button>
            </form>

            {error && (
              <div className="message error-message">
                <strong>{isSignup ? "Sign up failed" : "Login failed"}</strong>
                <p>{error}</p>
              </div>
            )}

            {success && (
              <div className="message success-message">
                <strong>✓ {success}</strong>
                <p>Opening your ShopMate workspace...</p>
              </div>
            )}

            {!isSignup && (
              <>
                <div className="divider">
                  <span>DEMO ACCESS</span>
                </div>

                <div className="demo-box">
                  <div>
                    <span>Demo account</span>
                    <strong>demo@shopmate.local</strong>
                    <small>Demo@12345</small>
                  </div>

                  <button
                    type="button"
                    className="use-demo"
                    onClick={() => {
                      setEmail("demo@shopmate.local");
                      setPassword("Demo@12345");
                    }}
                  >
                    Use
                  </button>
                </div>
              </>
            )}

            <p className="switch-mode-hint">
              {isSignup ? (
                <>
                  Already have an account?{" "}
                  <button type="button" onClick={() => switchMode("login")}>
                    Sign in
                  </button>
                </>
              ) : (
                <>
                  New to ShopMate?{" "}
                  <button type="button" onClick={() => switchMode("signup")}>
                    Create an account
                  </button>
                </>
              )}
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

/* =========================================================
   DASHBOARD
========================================================= */

function Dashboard({ token, onLogout }) {
  const [activePage, setActivePage] = useState("overview");

  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [compareIds, setCompareIds] = useState([]);
  const [showBilling, setShowBilling] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");

  const [chatMessages, setChatMessages] = useState([
    {
      role: "assistant",
      content:
        "Hello! I'm your ShopMate AI shopping assistant. Tell me what you're looking for and I'll help you discover suitable products.",
    },
  ]);

  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  const email = localStorage.getItem("email") || "demo@shopmate.local";

  useEffect(() => {
    loadDashboard();
  }, []);

  const authHeaders = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  async function apiRequest(url, options = {}) {
    const response = await fetch(`${API_URL}${url}`, {
      ...options,
      headers: {
        ...authHeaders,
        ...(options.headers || {}),
      },
    });

    if (response.status === 401) {
      onLogout();
      throw new Error("Session expired.");
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        typeof data.detail === "string"
          ? data.detail
          : "Request failed"
      );
    }

    return data;
  }

  async function loadDashboard() {
    setLoading(true);

    try {
      const [productData, cartData, analyticsData, orderData] =
        await Promise.all([
          apiRequest("/api/products"),
          apiRequest("/api/cart"),
          apiRequest("/api/analytics"),
          apiRequest("/api/orders"),
        ]);

      setProducts(normalizeArray(productData));
      setCart(normalizeCart(cartData));
      setAnalytics(
        analyticsData && typeof analyticsData === "object"
          ? analyticsData
          : {}
      );
      setOrders(normalizeArray(orderData));
    } catch (error) {
      console.error("Dashboard error:", error);
    } finally {
      setLoading(false);
    }
  }

  function normalizeArray(data) {
    if (Array.isArray(data)) return data;

    if (Array.isArray(data?.products)) return data.products;

    if (Array.isArray(data?.items)) return data.items;

    if (Array.isArray(data?.data)) return data.data;

    return [];
  }

  function normalizeCart(data) {
    if (Array.isArray(data)) return data;

    if (Array.isArray(data?.items)) return data.items;

    if (Array.isArray(data?.cart)) return data.cart;

    return [];
  }

  async function addToCart(productId) {
    try {
      const data = await apiRequest("/api/cart/items", {
        method: "POST",
        body: JSON.stringify({
          product_id: Number(productId),
          quantity: 1,
        }),
      });

      setCart(normalizeCart(data));

      setActivePage("cart");
    } catch (error) {
      alert(error.message);
    }
  }

  async function removeFromCart(productId) {
    try {
      const data = await apiRequest(
        `/api/cart/items/${productId}`,
        {
          method: "DELETE",
        }
      );

      setCart(normalizeCart(data));
    } catch (error) {
      alert(error.message);
    }
  }

  async function placeOrder(billing) {
    setCheckoutError("");

    try {
      const result = await apiRequest("/api/orders", {
        method: "POST",
        body: JSON.stringify(billing || {}),
      });

      setShowBilling(false);

      await loadDashboard();

      setActivePage("orders");

      return result;
    } catch (error) {
      setCheckoutError(error.message || "Checkout failed.");
      throw error;
    }
  }

  function toggleCompare(productId) {
    setCompareIds((prev) => {
      if (prev.includes(productId)) {
        return prev.filter((id) => id !== productId);
      }

      if (prev.length >= 4) return prev;

      return [...prev, productId];
    });
  }

  async function sendChat() {
    if (!chatInput.trim() || chatLoading) return;

    const message = chatInput.trim();

    const newMessages = [
      ...chatMessages,
      {
        role: "user",
        content: message,
      },
    ];

    setChatMessages(newMessages);
    setChatInput("");
    setChatLoading(true);

    try {
      const history = newMessages.slice(-10);

      const data = await apiRequest("/api/chat", {
        method: "POST",
        body: JSON.stringify({
          message,
          history,
        }),
      });

      const answer =
        data?.response ||
        data?.message ||
        data?.answer ||
        data?.content ||
        "I couldn't generate a response.";

      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: answer,
        },
      ]);
    } catch (error) {
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I couldn't connect to the AI service right now. Please check your backend and Groq configuration.",
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  }

  const filteredProducts = useMemo(() => {
    const query = search.toLowerCase().trim();

    if (!query) return products;

    return products.filter((product) =>
      JSON.stringify(product).toLowerCase().includes(query)
    );
  }, [products, search]);

  const cartCount = cart.reduce(
    (total, item) =>
      total + Number(item.quantity || item.qty || 1),
    0
  );

  const cartTotal = cart.reduce((total, item) => {
    const price =
      Number(item.price) ||
      Number(item.product_price) ||
      Number(item.product?.price) ||
      0;

    const quantity =
      Number(item.quantity || item.qty || 1);

    return total + price * quantity;
  }, 0);

  return (
    <div className="dashboard">

      {/* SIDEBAR */}
      <aside className="sidebar">

        <div className="sidebar-brand">
          <div className="sidebar-logo">✦</div>

          <div>
            <strong>ShopMate</strong>
            <span>AI COMMERCE</span>
          </div>
        </div>

        <div className="sidebar-section-title">
          WORKSPACE
        </div>

        <nav className="sidebar-nav">

          <NavItem
            icon="⌂"
            label="Overview"
            active={activePage === "overview"}
            onClick={() => setActivePage("overview")}
          />

          <NavItem
            icon="◈"
            label="Discover Products"
            active={activePage === "products"}
            onClick={() => setActivePage("products")}
          />

          <NavItem
            icon="⇄"
            label="Compare"
            active={activePage === "compare"}
            badge={compareIds.length}
            onClick={() => setActivePage("compare")}
          />

          <NavItem
            icon="✦"
            label="AI Assistant"
            active={activePage === "assistant"}
            onClick={() => setActivePage("assistant")}
          />

          <NavItem
            icon="🛒"
            label="Smart Cart"
            active={activePage === "cart"}
            badge={cartCount}
            onClick={() => setActivePage("cart")}
          />

          <NavItem
            icon="◫"
            label="Orders"
            active={activePage === "orders"}
            onClick={() => setActivePage("orders")}
          />

          <NavItem
            icon="⌁"
            label="Analytics"
            active={activePage === "analytics"}
            onClick={() => setActivePage("analytics")}
          />

        </nav>

        <div className="sidebar-bottom">

          <div className="ai-status">
            <span className="status-pulse"></span>

            <div>
              <strong>AI Engine Online</strong>
              <small>ShopMate intelligence active</small>
            </div>
          </div>

          <button className="logout-button" onClick={onLogout}>
            ⇥
            <span>Sign out</span>
          </button>

        </div>

      </aside>

      {/* MAIN */}
      <main className="dashboard-main">

        {/* TOPBAR */}
        <header className="dashboard-topbar">

          <div>
            <div className="breadcrumb">
              SHOPMATE AI
              <span>/</span>
              {pageTitle(activePage)}
            </div>

            <h1>{pageTitle(activePage)}</h1>
          </div>

          <div className="topbar-actions">

            <div className="system-status">
              <span></span>
              All systems operational
            </div>

            <div className="user-profile">
              <div className="avatar">
                {email.charAt(0).toUpperCase()}
              </div>

              <div>
                <strong>{email.split("@")[0]}</strong>
                <small>Customer</small>
              </div>
            </div>

          </div>

        </header>

        {/* CONTENT */}
        <div className="dashboard-content">

          {loading ? (
            <DashboardLoader />
          ) : (
            <>
              {activePage === "overview" && (
                <Overview
                  products={products}
                  cart={cart}
                  analytics={analytics}
                  cartCount={cartCount}
                  cartTotal={cartTotal}
                  onProducts={() => setActivePage("products")}
                  onAssistant={() => setActivePage("assistant")}
                  onAdd={addToCart}
                />
              )}

              {activePage === "products" && (
                <Products
                  products={filteredProducts}
                  search={search}
                  setSearch={setSearch}
                  onAdd={addToCart}
                  compareIds={compareIds}
                  onToggleCompare={toggleCompare}
                />
              )}

              {activePage === "compare" && (
                <Compare
                  products={products}
                  compareIds={compareIds}
                  onToggleCompare={toggleCompare}
                  onClear={() => setCompareIds([])}
                  onAdd={addToCart}
                  onBrowse={() => setActivePage("products")}
                />
              )}

              {activePage === "assistant" && (
                <Assistant
                  messages={chatMessages}
                  input={chatInput}
                  setInput={setChatInput}
                  loading={chatLoading}
                  onSend={sendChat}
                />
              )}

              {activePage === "cart" && (
                <Cart
                  cart={cart}
                  total={cartTotal}
                  onRemove={removeFromCart}
                  onCheckout={() => setShowBilling(true)}
                />
              )}

              {activePage === "orders" && (
                <Orders orders={orders} />
              )}

              {activePage === "analytics" && (
                <Analytics analytics={analytics} />
              )}
            </>
          )}

        </div>

      </main>

      {showBilling && (
        <BillingModal
          total={cartTotal}
          error={checkoutError}
          onClose={() => {
            setShowBilling(false);
            setCheckoutError("");
          }}
          onSubmit={placeOrder}
        />
      )}
    </div>
  );
}

/* =========================================================
   SIDEBAR ITEM
========================================================= */

function NavItem({
  icon,
  label,
  active,
  badge,
  onClick,
}) {
  return (
    <button
      className={`nav-item ${active ? "active" : ""}`}
      onClick={onClick}
    >
      <span className="nav-icon">{icon}</span>

      <span>{label}</span>

      {badge > 0 && (
        <span className="nav-badge">{badge}</span>
      )}
    </button>
  );
}

/* =========================================================
   OVERVIEW
========================================================= */

function Overview({
  products,
  cart,
  analytics,
  cartCount,
  cartTotal,
  onProducts,
  onAssistant,
  onAdd,
}) {
  return (
    <div className="page-content">

      <div className="welcome-banner">

        <div>
          <div className="banner-label">
            ✦ AI SHOPPING WORKSPACE
          </div>

          <h2>
            Welcome to your
            <span> intelligent shopping hub.</span>
          </h2>

          <p>
            Discover products, ask your AI assistant and manage
            your shopping journey from one workspace.
          </p>

          <div className="banner-buttons">
            <button onClick={onAssistant}>
              <span>✦</span>
              Ask ShopMate AI
            </button>

            <button
              className="secondary-button"
              onClick={onProducts}
            >
              Explore products →
            </button>
          </div>
        </div>

        <div className="banner-orbit">
          <div className="orbit-ring ring-one"></div>
          <div className="orbit-ring ring-two"></div>
          <div className="orbit-core">✦</div>
        </div>

      </div>

      {/* STAT CARDS */}

      <div className="stat-grid">

        <StatCard
          icon="◈"
          title="Products"
          value={products.length}
          subtitle="Available to explore"
        />

        <StatCard
          icon="🛒"
          title="Cart Items"
          value={cartCount}
          subtitle="Currently selected"
        />

        <StatCard
          icon="₹"
          title="Cart Value"
          value={`₹${cartTotal.toLocaleString()}`}
          subtitle="Current cart total"
        />

        <StatCard
          icon="✦"
          title="AI Status"
          value="Online"
          subtitle="Assistant ready"
          green
        />

      </div>

      {/* LOWER GRID */}

      <div className="overview-grid">

        <section className="dashboard-panel products-panel">

          <div className="panel-heading">

            <div>
              <span>CURATED FOR YOU</span>
              <h3>Product Discovery</h3>
            </div>

            <button onClick={onProducts}>
              View all →
            </button>

          </div>

          {products.length === 0 ? (
            <EmptyState text="No products available." />
          ) : (
            <div className="mini-products">

              {products.slice(0, 4).map((product, index) => (
                <ProductCard
                  key={product.id || product.product_id || index}
                  product={product}
                  onAdd={onAdd}
                />
              ))}

            </div>
          )}

        </section>

        <section className="dashboard-panel ai-panel">

          <div className="ai-panel-icon">✦</div>

          <span className="panel-eyebrow">
            SHOPMATE INTELLIGENCE
          </span>

          <h3>Your AI shopping assistant</h3>

          <p>
            Ask questions, compare products, find recommendations
            and get assistance throughout your shopping journey.
          </p>

          <div className="ai-suggestions">

            <button onClick={onAssistant}>
              "Find something for me"
            </button>

            <button onClick={onAssistant}>
              "Recommend popular products"
            </button>

            <button onClick={onAssistant}>
              "Help me choose"
            </button>

          </div>

          <button
            className="ai-start-button"
            onClick={onAssistant}
          >
            Start conversation →
          </button>

        </section>

      </div>

    </div>
  );
}

/* =========================================================
   PRODUCTS
========================================================= */

function Products({
  products,
  search,
  setSearch,
  onAdd,
  compareIds = [],
  onToggleCompare,
}) {
  return (
    <div className="page-content">

      <div className="page-intro">
        <div>
          <span>PRODUCT CATALOG</span>
          <h2>Discover products</h2>
          <p>
            Explore the ShopMate product catalog and add
            anything you like to your smart cart.
          </p>
        </div>

        <div className="search-box">
          <span>⌕</span>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
          />
        </div>
      </div>

      {products.length === 0 ? (
        <EmptyState text="No matching products found." />
      ) : (
        <div className="product-grid">

          {products.map((product, index) => (
            <ProductCard
              key={product.id || product.product_id || index}
              product={product}
              onAdd={onAdd}
              onToggleCompare={onToggleCompare}
              compared={compareIds.includes(
                product.id || product.product_id
              )}
              large
            />
          ))}

        </div>
      )}

    </div>
  );
}

/* =========================================================
   PRODUCT CARD
========================================================= */

function ProductCard({
  product,
  onAdd,
  onToggleCompare,
  compared = false,
  large = false,
}) {
  const name =
    product.name ||
    product.title ||
    product.product_name ||
    `Product ${product.id || ""}`;

  const description =
    product.description ||
    product.category ||
    "Premium product available on ShopMate.";

  const price =
    Number(product.price) ||
    Number(product.product_price) ||
    0;

  const id =
    product.id ||
    product.product_id;

  return (
    <div className={`product-card ${large ? "large" : ""}`}>

      <div className="product-image">
        <div className="product-image-glow"></div>
        <span>◈</span>
      </div>

      <div className="product-info">

        <div className="product-category">
          {product.category || "FEATURED"}
        </div>

        <h4>{name}</h4>

        <p>{description}</p>

        <div className="product-bottom">

          <strong>
            {price > 0
              ? `₹${price.toLocaleString()}`
              : "View price"}
          </strong>

          <div className="product-actions">
            {onToggleCompare && (
              <button
                className={`compare-toggle ${compared ? "active" : ""}`}
                title={compared ? "Remove from compare" : "Add to compare"}
                onClick={() => onToggleCompare(id)}
              >
                ⇄
              </button>
            )}

            <button onClick={() => onAdd(id)}>
              +
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}

/* =========================================================
   COMPARE
========================================================= */

function Compare({
  products,
  compareIds,
  onToggleCompare,
  onClear,
  onAdd,
  onBrowse,
}) {
  const selected = products.filter((product) =>
    compareIds.includes(product.id || product.product_id)
  );

  const rows = [
    { label: "Category", get: (p) => p.category || "—" },
    {
      label: "Price",
      get: (p) => `₹${Number(p.price || 0).toLocaleString()}`,
    },
    { label: "Rating", get: (p) => (p.rating ? `${p.rating} ★` : "—") },
    { label: "Stock", get: (p) => (p.stock ?? "—") },
    { label: "Description", get: (p) => p.description || "—" },
    {
      label: "Features",
      get: (p) =>
        Array.isArray(p.features) && p.features.length
          ? p.features.join(", ")
          : "—",
    },
  ];

  return (
    <div className="page-content">

      <div className="page-intro">
        <div>
          <span>SIDE-BY-SIDE</span>
          <h2>Compare products</h2>
          <p>
            Pick up to 4 products from the catalog to compare price,
            rating and features side by side.
          </p>
        </div>

        {selected.length > 0 && (
          <button className="secondary-button" onClick={onClear}>
            Clear all
          </button>
        )}
      </div>

      {selected.length === 0 ? (
        <div className="empty-large">
          <div>⇄</div>

          <h3>Nothing to compare yet</h3>

          <p>
            Open Discover Products and tap the compare icon on any
            product to add it here.
          </p>

          <button className="ai-start-button" onClick={onBrowse}>
            Browse products →
          </button>
        </div>
      ) : (
        <div className="compare-table-wrapper">
          <table className="compare-table">
            <thead>
              <tr>
                <th>Attribute</th>

                {selected.map((product) => {
                  const id = product.id || product.product_id;
                  const name = product.name || product.title;

                  return (
                    <th key={id}>
                      <div className="compare-col-head">
                        <strong>{name}</strong>

                        <div className="compare-col-actions">
                          <button onClick={() => onAdd(id)}>
                            Add to cart
                          </button>

                          <button
                            className="remove-button"
                            onClick={() => onToggleCompare(id)}
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody>
              {rows.map((row) => (
                <tr key={row.label}>
                  <td className="compare-row-label">{row.label}</td>

                  {selected.map((product) => {
                    const id = product.id || product.product_id;
                    return <td key={id}>{row.get(product)}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}

/* =========================================================
   ASSISTANT
========================================================= */

function Assistant({
  messages,
  input,
  setInput,
  loading,
  onSend,
}) {
  return (
    <div className="assistant-page">

      <div className="assistant-header">

        <div className="assistant-brand-icon">
          ✦
        </div>

        <div>
          <span>SHOPMATE INTELLIGENCE</span>
          <h2>AI Shopping Assistant</h2>
          <p>
            Powered by your ShopMate AI agent
          </p>
        </div>

        <div className="assistant-online">
          <span></span>
          Online
        </div>

      </div>

      <div className="chat-window">

        <div className="chat-messages">

          {messages.map((message, index) => (
            <div
              key={index}
              className={`chat-message ${
                message.role === "user"
                  ? "user-message"
                  : "ai-message"
              }`}
            >

              {message.role !== "user" && (
                <div className="chat-avatar">✦</div>
              )}

              <div className="chat-bubble">
                {message.content}
              </div>

              {message.role === "user" && (
                <div className="chat-avatar user-avatar">
                  U
                </div>
              )}

            </div>
          ))}

          {loading && (
            <div className="chat-message ai-message">
              <div className="chat-avatar">✦</div>

              <div className="chat-bubble typing">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          )}

        </div>

        <div className="chat-input-area">

          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSend();
            }}
            placeholder="Ask ShopMate anything..."
          />

          <button
            onClick={onSend}
            disabled={loading || !input.trim()}
          >
            →
          </button>

        </div>

      </div>

    </div>
  );
}

/* =========================================================
   CART
========================================================= */

function Cart({
  cart,
  total,
  onRemove,
  onCheckout,
}) {
  return (
    <div className="page-content">

      <div className="page-intro">
        <div>
          <span>SHOPPING CART</span>
          <h2>Your smart cart</h2>
          <p>
            Review your selected products before checkout.
          </p>
        </div>
      </div>

      {cart.length === 0 ? (
        <EmptyState text="Your cart is currently empty." />
      ) : (
        <div className="cart-layout">

          <div className="dashboard-panel cart-items">

            {cart.map((item, index) => {
              const name =
                item.name ||
                item.product_name ||
                item.product?.name ||
                `Product ${item.product_id}`;

              const price =
                Number(item.price) ||
                Number(item.product_price) ||
                Number(item.product?.price) ||
                0;

              const quantity =
                Number(item.quantity || item.qty || 1);

              const id =
                item.product_id ||
                item.id ||
                item.product?.id;

              return (
                <div
                  className="cart-item"
                  key={id || index}
                >

                  <div className="cart-product-icon">
                    ◈
                  </div>

                  <div className="cart-product-info">
                    <strong>{name}</strong>
                    <span>
                      Quantity: {quantity}
                    </span>
                  </div>

                  <strong className="cart-price">
                    ₹{(price * quantity).toLocaleString()}
                  </strong>

                  <button
                    className="remove-button"
                    onClick={() => onRemove(id)}
                  >
                    ×
                  </button>

                </div>
              );
            })}

          </div>

          <div className="checkout-card">

            <span>ORDER SUMMARY</span>

            <h3>Ready to checkout?</h3>

            <div className="checkout-line">
              <span>Subtotal</span>
              <strong>₹{total.toLocaleString()}</strong>
            </div>

            <div className="checkout-line">
              <span>AI Shopping Assistance</span>
              <strong>Included</strong>
            </div>

            <div className="checkout-total">
              <span>Total</span>
              <strong>₹{total.toLocaleString()}</strong>
            </div>

            <button
              className="checkout-button"
              onClick={onCheckout}
            >
              Place Order →
            </button>

          </div>

        </div>
      )}

    </div>
  );
}

/* =========================================================
   BILLING MODAL
========================================================= */

function BillingModal({ total, error, onClose, onSubmit }) {
  const [form, setForm] = useState({
    full_name: localStorage.getItem("email")?.split("@")[0] || "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    payment_method: "card",
  });

  const [submitting, setSubmitting] = useState(false);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);

    try {
      await onSubmit(form);
    } catch (err) {
      // error surfaced by parent via `error` prop
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>

        <div className="modal-header">
          <div>
            <span>CHECKOUT</span>
            <h3>Billing details</h3>
          </div>

          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="billing-form">

          <div className="input-group">
            <label>Full name</label>
            <input
              value={form.full_name}
              onChange={(e) => update("full_name", e.target.value)}
              required
              disabled={submitting}
            />
          </div>

          <div className="input-group">
            <label>Phone number</label>
            <input
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              required
              disabled={submitting}
            />
          </div>

          <div className="input-group">
            <label>Address</label>
            <input
              value={form.address}
              onChange={(e) => update("address", e.target.value)}
              required
              disabled={submitting}
            />
          </div>

          <div className="billing-row">
            <div className="input-group">
              <label>City</label>
              <input
                value={form.city}
                onChange={(e) => update("city", e.target.value)}
                required
                disabled={submitting}
              />
            </div>

            <div className="input-group">
              <label>State</label>
              <input
                value={form.state}
                onChange={(e) => update("state", e.target.value)}
                required
                disabled={submitting}
              />
            </div>

            <div className="input-group">
              <label>Pincode</label>
              <input
                value={form.pincode}
                onChange={(e) => update("pincode", e.target.value)}
                required
                disabled={submitting}
              />
            </div>
          </div>

          <div className="input-group">
            <label>Payment method</label>

            <div className="payment-options">
              {[
                { id: "card", label: "Card" },
                { id: "upi", label: "UPI" },
                { id: "cod", label: "Cash on delivery" },
              ].map((option) => (
                <button
                  type="button"
                  key={option.id}
                  className={
                    form.payment_method === option.id ? "active" : ""
                  }
                  onClick={() => update("payment_method", option.id)}
                  disabled={submitting}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="billing-total">
            <span>Order total</span>
            <strong>₹{total.toLocaleString()}</strong>
          </div>

          {error && (
            <div className="message error-message">
              <strong>Checkout failed</strong>
              <p>{error}</p>
            </div>
          )}

          <button
            className="checkout-button"
            type="submit"
            disabled={submitting}
          >
            {submitting
              ? "Placing order..."
              : `Confirm & pay (simulated) →`}
          </button>

          <p className="billing-note">
            This is a demo checkout. No real payment is processed.
          </p>

        </form>

      </div>
    </div>
  );
}

/* =========================================================
   ORDERS
========================================================= */

function Orders({ orders = [] }) {
  return (
    <div className="page-content">

      <div className="page-intro">
        <div>
          <span>ORDER MANAGEMENT</span>
          <h2>Your orders</h2>
          <p>
            Track your ShopMate purchases and order activity.
          </p>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="empty-large">
          <div>◫</div>

          <h3>Order history</h3>

          <p>
            Your completed orders will appear here after checkout.
          </p>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((o) => {
            const items = Array.isArray(o.items) ? o.items : [];
            const date = o.created_at
              ? new Date(o.created_at).toLocaleString()
              : "";

            return (
              <div className="order-card" key={o.id}>
                <div className="order-card-header">
                  <div>
                    <strong>{o.id}</strong>
                    <small>{date}</small>
                  </div>

                  <span className={`order-status status-${(o.status || "").toLowerCase()}`}>
                    {o.status}
                  </span>
                </div>

                <div className="order-card-items">
                  {items.map((item, idx) => (
                    <div className="order-item-row" key={idx}>
                      <span>
                        {item.name || `Product ${item.id}`} × {item.quantity}
                      </span>
                      <span>
                        ₹{Number(item.line_total || 0).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>

                {o.billing?.full_name && (
                  <div className="order-billing">
                    Shipping to {o.billing.full_name}, {o.billing.city}
                    {o.billing.state ? `, ${o.billing.state}` : ""}
                    {" · "}
                    {(o.billing.payment_method || "card").toUpperCase()}
                  </div>
                )}

                <div className="order-card-total">
                  <span>Total</span>
                  <strong>₹{Number(o.total || 0).toLocaleString()}</strong>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}

/* =========================================================
   ANALYTICS
========================================================= */

function Analytics({ analytics }) {
  const entries = Object.entries(analytics || {});

  return (
    <div className="page-content">

      <div className="page-intro">
        <div>
          <span>SHOPPING INTELLIGENCE</span>
          <h2>Analytics</h2>
          <p>
            Insights generated from your ShopMate activity.
          </p>
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="empty-large">
          <div>⌁</div>

          <h3>Analytics will appear here</h3>

          <p>
            Continue using ShopMate to generate shopping insights.
          </p>
        </div>
      ) : (
        <div className="analytics-grid">

          {entries.map(([key, value]) => (
            <div className="analytics-card" key={key}>
              <span>{formatLabel(key)}</span>
              <strong>{String(value)}</strong>
            </div>
          ))}

        </div>
      )}

    </div>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  icon,
  title,
  value,
  subtitle,
  green,
}) {
  return (
    <div className="stat-card">

      <div className="stat-icon">
        {icon}
      </div>

      <div className="stat-content">

        <span>{title}</span>

        <strong className={green ? "green-value" : ""}>
          {value}
        </strong>

        <small>{subtitle}</small>

      </div>

      <div className="stat-arrow">↗</div>

    </div>
  );
}

/* =========================================================
   EMPTY STATE
========================================================= */

function EmptyState({ text }) {
  return (
    <div className="empty-state">
      <div>◈</div>
      <p>{text}</p>
    </div>
  );
}

function DashboardLoader() {
  return (
    <div className="dashboard-loading">

      <div className="loading-orb">✦</div>

      <h3>Preparing your ShopMate workspace...</h3>

      <p>Loading products, cart and AI services</p>

    </div>
  );
}

function pageTitle(page) {
  const titles = {
    overview: "Overview",
    products: "Discover Products",
    assistant: "AI Assistant",
    cart: "Smart Cart",
    orders: "Orders",
    analytics: "Analytics",
  };

  return titles[page] || "Overview";
}

function formatLabel(value) {
  return String(value)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

ReactDOM.createRoot(
  document.getElementById("root")
).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
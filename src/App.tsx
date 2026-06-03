import {
  BarChart3,
  Bell,
  Boxes,
  Building2,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  CreditCard,
  Heart,
  Home,
  LayoutDashboard,
  LineChart,
  LogOut,
  MessageSquare,
  Package,
  Percent,
  Search,
  Settings,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Star,
  Store,
  Truck,
  User,
  Wallet,
  Zap
} from "lucide-react";
import { useMemo, useState } from "react";

type PageId =
  | "home"
  | "categories"
  | "stores"
  | "deals"
  | "track"
  | "cart"
  | "checkout"
  | "wishlist"
  | "messages"
  | "vendor"
  | "admin"
  | "products"
  | "payments"
  | "logistics"
  | "reviews"
  | "notifications"
  | "analytics"
  | "ai"
  | "profile";

type Product = {
  name: string;
  category: string;
  vendor: string;
  price: number;
  oldPrice?: number;
  rating: number;
  stock: number;
  badge: string;
  image: string;
};

type StoreItem = {
  name: string;
  specialty: string;
  products: number;
  rating: number;
  location: string;
  logo: string;
};

const currency = new Intl.NumberFormat("en-GH", {
  style: "currency",
  currency: "GHS",
  maximumFractionDigits: 0
});

const products: Product[] = [
];

const categories = [
  ["Electronics", "0 products", "https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=500&q=80"],
  ["Fashion", "0 products", "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=500&q=80"],
  ["Home Living", "0 products", "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?auto=format&fit=crop&w=500&q=80"],
  ["Beauty", "0 products", "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=500&q=80"],
  ["Phones", "0 products", "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=500&q=80"],
  ["Computers", "0 products", "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=500&q=80"],
  ["Sports", "0 products", "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=500&q=80"],
  ["Automotive", "0 products", "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=500&q=80"],
  ["Baby Products", "0 products", "https://images.unsplash.com/photo-1546015720-b8b30df5aa27?auto=format&fit=crop&w=500&q=80"],
  ["Books", "0 products", "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=500&q=80"]
];

const stores: StoreItem[] = [
];

const navSections = [
  {
    title: "Marketplace",
    items: [
      ["home", "Home", Home],
      ["categories", "Categories", Boxes],
      ["stores", "Stores", Store],
      ["deals", "Deals", Percent],
      ["track", "Track Order", Truck],
      ["wishlist", "Wishlist", Heart]
    ]
  },
  {
    title: "Shopping",
    items: [
      ["cart", "Cart", ShoppingCart],
      ["checkout", "Checkout", CreditCard],
      ["messages", "Messages", MessageSquare],
      ["profile", "Profile / Account", User]
    ]
  },
  {
    title: "Operations",
    items: [
      ["vendor", "Vendor Dashboard", LayoutDashboard],
      ["products", "Products", Package],
      ["payments", "Payments & Payouts", Wallet],
      ["logistics", "Logistics", Truck],
      ["reviews", "Reviews", Star],
      ["notifications", "Notifications", Bell],
      ["analytics", "Analytics", LineChart],
      ["admin", "Admin Dashboard", ShieldCheck],
      ["ai", "AI Features", Sparkles]
    ]
  }
] as const;

function App() {
  const [page, setPage] = useState<PageId>("home");
  const [query, setQuery] = useState("");
  const filteredProducts = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return products;
    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(q) ||
        product.category.toLowerCase().includes(q) ||
        product.vendor.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <button className="brand" onClick={() => setPage("home")}>
          <span className="brand-mark">M</span>
          <span>
            <strong>MarketHub</strong>
            <small>Africa marketplace</small>
          </span>
        </button>

        <nav>
          {navSections.map((section) => (
            <div className="nav-section" key={section.title}>
              <p>{section.title}</p>
              {section.items.map(([id, label, Icon]) => (
                <button
                  className={page === id ? "active" : ""}
                  key={id}
                  onClick={() => setPage(id as PageId)}
                >
                  <Icon size={17} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-callout">
          <Sparkles size={20} />
          <strong>Grow more with MarketHub</strong>
          <span>Vendor tools, mobile money, analytics, and regional commerce.</span>
        </div>
      </aside>

      <main className="main-area">
        <TopBar query={query} setQuery={setQuery} setPage={setPage} />
        <div className="content">{renderPage(page, setPage, filteredProducts)}</div>
      </main>
    </div>
  );
}

function TopBar({
  query,
  setQuery,
  setPage
}: {
  query: string;
  setQuery: (query: string) => void;
  setPage: (page: PageId) => void;
}) {
  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">Multi-vendor e-commerce platform</p>
        <h1>MarketHub</h1>
      </div>
      <label className="search-box">
        <Search size={18} />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search products, brands, stores..."
        />
      </label>
      <div className="top-actions">
        <button title="Wishlist" onClick={() => setPage("wishlist")}>
          <Heart size={18} />
        </button>
        <button title="Cart" onClick={() => setPage("cart")}>
          <ShoppingCart size={18} />
        </button>
        <button title="Notifications" onClick={() => setPage("notifications")}>
          <Bell size={18} />
        </button>
        <button className="avatar" title="Account" onClick={() => setPage("profile")}>
          GU
        </button>
      </div>
    </header>
  );
}

function renderPage(page: PageId, setPage: (page: PageId) => void, filteredProducts: Product[]) {
  switch (page) {
    case "home":
      return <HomePage setPage={setPage} products={filteredProducts} />;
    case "categories":
      return <CategoriesPage setPage={setPage} />;
    case "stores":
      return <StoresPage />;
    case "deals":
      return <DealsPage products={filteredProducts} />;
    case "track":
      return <TrackOrderPage />;
    case "cart":
      return <CartPage setPage={setPage} />;
    case "checkout":
      return <CheckoutPage />;
    case "wishlist":
      return <WishlistPage products={products} />;
    case "messages":
      return <MessagesPage />;
    case "vendor":
      return <VendorDashboard />;
    case "admin":
      return <AdminDashboard />;
    case "products":
      return <ProductsPage />;
    case "payments":
      return <PaymentsPage />;
    case "logistics":
      return <LogisticsPage />;
    case "reviews":
      return <ReviewsPage />;
    case "notifications":
      return <NotificationsPage />;
    case "analytics":
      return <AnalyticsPage />;
    case "ai":
      return <AiPage />;
    case "profile":
      return <ProfilePage />;
  }
}

function PageIntro({
  kicker,
  title,
  actions
}: {
  kicker: string;
  title: string;
  copy: string;
  actions?: React.ReactNode;
}) {
  return (
    <section className="page-intro">
      <div>
        <p className="eyebrow">{kicker}</p>
        <h2>{title}</h2>
      </div>
      {actions ? <div className="intro-actions">{actions}</div> : null}
    </section>
  );
}

function HomePage({ setPage, products }: { setPage: (page: PageId) => void; products: Product[] }) {
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <p>Fresh marketplace setup</p>
          <h2>No products have been uploaded yet</h2>
          <button onClick={() => setPage("products")}>
            Prepare Product Uploads
            <ChevronRight size={17} />
          </button>
        </div>
        <div className="hero-products">
          <div className="upload-placeholder">
            <Package size={42} />
            <strong>Waiting for first upload</strong>
          </div>
        </div>
      </section>
      <QuickStats />
      <CategoryStrip setPage={setPage} />
      <SectionHeader title="Product Catalog" action="Upload setup" onClick={() => setPage("products")} />
      <ProductGrid products={products} />
    </>
  );
}

function QuickStats() {
  return (
    <section className="stat-grid">
      <Metric label="Active vendors" value="0" delta="No vendors yet" />
      <Metric label="Customer accounts" value="0" delta="No users yet" />
      <Metric label="Uploaded products" value="0" delta="Catalog empty" />
      <Metric label="Orders" value="0" delta="No sales yet" />
    </section>
  );
}

function Metric({ label, value, delta }: { label: string; value: string; delta: string }) {
  return (
    <article className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{delta}</small>
    </article>
  );
}

function CategoryStrip({ setPage }: { setPage: (page: PageId) => void }) {
  return (
    <section className="category-strip">
      {categories.slice(0, 8).map(([name, count, image]) => (
        <button key={name} onClick={() => setPage("categories")}>
          <img src={image} alt="" />
          <span>{name}</span>
          <small>{count}</small>
        </button>
      ))}
    </section>
  );
}

function SectionHeader({ title, action, onClick }: { title: string; action?: string; onClick?: () => void }) {
  return (
    <div className="section-header">
      <h3>{title}</h3>
      {action ? <button onClick={onClick}>{action}</button> : null}
    </div>
  );
}

function ProductGrid({ products }: { products: Product[] }) {
  if (products.length === 0) {
    return (
      <EmptyState
        icon={<Package size={42} />}
        title="No products uploaded yet"
        copy="Vendor uploads will appear here."
      />
    );
  }

  return (
    <section className="product-grid">
      {products.map((product) => (
        <article className="product-card" key={product.name}>
          <span className="badge">{product.badge}</span>
          <button className="heart-btn" title="Save product">
            <Heart size={17} />
          </button>
          <img src={product.image} alt={product.name} />
          <div>
            <p>{product.vendor}</p>
            <h4>{product.name}</h4>
            <span className="rating">
              <Star size={14} fill="currentColor" />
              {product.rating}
            </span>
            <strong>{currency.format(product.price)}</strong>
            {product.oldPrice ? <del>{currency.format(product.oldPrice)}</del> : null}
            <button className="primary-mini">Add to cart</button>
          </div>
        </article>
      ))}
    </section>
  );
}

function CategoriesPage({ setPage }: { setPage: (page: PageId) => void }) {
  return (
    <>
      <PageIntro
        kicker="Browse"
        title="All Categories"
        copy="Explore products by department, from electronics and fashion to wholesale goods, baby products, books, and home essentials."
      />
      <section className="category-grid">
        {categories.map(([name, count, image]) => (
          <button className="category-card" key={name} onClick={() => setPage("home")}>
            <img src={image} alt={name} />
            <strong>{name}</strong>
            <span>{count}</span>
          </button>
        ))}
      </section>
    </>
  );
}

function StoresPage() {
  return (
    <>
      <PageIntro
        kicker="Vendors"
        title="Top Stores"
        copy="Discover verified vendors with strong ratings, clear locations, custom storefronts, and product catalogs."
        actions={<button className="ghost-button">Most popular</button>}
      />
      {stores.length === 0 ? (
        <EmptyState
          icon={<Store size={42} />}
          title="No vendor stores yet"
          copy="Verified stores will appear here."
        />
      ) : null}
      <section className="store-grid">
        {stores.map((store) => (
          <article className="store-card" key={store.name}>
            <div className="store-logo">{store.logo}</div>
            <h3>{store.name}</h3>
            <p>{store.specialty} in {store.location}</p>
            <span className="rating">
              <Star size={14} fill="currentColor" />
              {store.rating}
            </span>
            <strong>{store.products.toLocaleString()} products</strong>
            <button className="primary-mini">Visit Store</button>
          </article>
        ))}
      </section>
    </>
  );
}

function DealsPage({ products }: { products: Product[] }) {
  return (
    <>
      <PageIntro
        kicker="Promotions"
        title="Deals"
        copy="Flash sales, coupons, bundle deals, sponsored products, and seasonal campaigns will appear after vendors upload products."
      />
      <div className="tabs">
        {["All Deals", "Flash Deals", "Top Deals", "Upcoming"].map((tab, index) => (
          <button className={index === 0 ? "active" : ""} key={tab}>{tab}</button>
        ))}
      </div>
      <ProductGrid products={products} />
    </>
  );
}

function TrackOrderPage() {
  const orders: string[][] = [];
  return (
    <>
      <PageIntro
        kicker="Orders"
        title="Track Your Order"
        copy="Customers can search by order number, view recent orders, track shipment progress, download invoices, and request returns."
      />
      <section className="tracking-search">
        <input placeholder="Enter your order number..." />
        <button>Track Order</button>
      </section>
      <section className="table-panel">
        <h3>Recent Orders</h3>
        {orders.length === 0 ? (
          <EmptyState
            icon={<ClipboardList size={38} />}
            title="No orders yet"
            copy="Customer orders will appear here."
          />
        ) : null}
        {orders.map(([id, status, total, item]) => (
          <div className="table-row" key={id}>
            <span>{id}</span>
            <strong>{item}</strong>
            <em className={status.toLowerCase().replace(" ", "-")}>{status}</em>
            <span>{total}</span>
            <button>View Details</button>
          </div>
        ))}
      </section>
    </>
  );
}

function CartPage({ setPage }: { setPage: (page: PageId) => void }) {
  const cartItems: Product[] = [];
  const subtotal = cartItems.reduce((sum, item) => sum + item.price, 0);
  return (
    <>
      <PageIntro
        kicker="Shopping"
        title="Your Cart"
        copy="Multi-vendor cart with coupon support, shipping estimates, tax calculation, save for later, and stock checks."
      />
      <section className="split-layout">
        <div className="cart-list">
          {cartItems.length === 0 ? (
            <EmptyState
              icon={<ShoppingCart size={38} />}
              title="Cart is empty"
              copy="Products added to cart will appear here."
            />
          ) : null}
          {cartItems.map((product, index) => (
            <article className="cart-item" key={product.name}>
              <img src={product.image} alt={product.name} />
              <div>
                <h3>{product.name}</h3>
                <p>{product.vendor}</p>
                <span>Qty {index + 1}</span>
              </div>
              <strong>{currency.format(product.price)}</strong>
            </article>
          ))}
        </div>
        <aside className="summary-panel">
          <h3>Order Summary</h3>
          <SummaryLine label="Subtotal" value={currency.format(subtotal)} />
          <SummaryLine label="Delivery estimate" value={currency.format(0)} />
          <SummaryLine label="Tax" value={currency.format(0)} />
          <SummaryLine label="Total" value={currency.format(subtotal)} strong />
          <button onClick={() => setPage("checkout")}>Proceed to Checkout</button>
        </aside>
      </section>
    </>
  );
}

function SummaryLine({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={strong ? "summary-line total" : "summary-line"}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function CheckoutPage() {
  return (
    <>
      <PageIntro
        kicker="Payment"
        title="Checkout"
        copy="Complete delivery details, select payment, confirm totals, and place orders across one or more vendors."
      />
      <section className="split-layout checkout-layout">
        <form className="form-panel">
          <h3>Delivery Information</h3>
          <input placeholder="Full name" />
          <input placeholder="Phone number" />
          <input placeholder="Address" />
          <select defaultValue="standard">
            <option value="standard">Standard delivery, 2-3 days</option>
            <option value="pickup">Pickup point</option>
            <option value="express">Express delivery</option>
          </select>
        </form>
        <aside className="summary-panel">
          <h3>Payment Method</h3>
          {["Mobile Money", "Card payment", "Bank transfer", "Wallet balance"].map((method, index) => (
            <label className="radio-row" key={method}>
              <input type="radio" name="payment" defaultChecked={index === 0} />
              <span>{method}</span>
            </label>
          ))}
          <SummaryLine label="Total due" value={currency.format(0)} strong />
          <button>Create Account First</button>
        </aside>
      </section>
    </>
  );
}

function WishlistPage({ products }: { products: Product[] }) {
  return (
    <>
      <PageIntro
        kicker="Saved"
        title="My Wishlist"
        copy="Saved products stay available for future shopping, sale alerts, sharing, and quick cart movement."
        actions={<button className="ghost-button">Share wishlist</button>}
      />
      <ProductGrid products={products} />
    </>
  );
}

function MessagesPage() {
  return (
    <>
      <PageIntro
        kicker="Chat"
        title="Messages"
        copy="Customer and vendor conversations can include text, images, files, and order-linked support context."
      />
      <EmptyState
        icon={<MessageSquare size={42} />}
        title="No conversations yet"
        copy="Customer and vendor chats will appear here."
      />
    </>
  );
}

function VendorDashboard() {
  return (
    <>
      <PageIntro
        kicker="Vendor"
        title="Vendor Dashboard"
        copy="Sellers manage products, orders, inventory, promotions, reviews, earnings, and store settings from one workspace."
      />
      <QuickStats />
      <section className="dashboard-grid">
        <ChartPanel title="Sales Overview" empty />
        <ListPanel title="Top Selling Products" items={[]} emptyCopy="No products have been uploaded yet." />
        <ListPanel title="Low Stock Alerts" items={[]} emptyCopy="Inventory alerts will appear after product uploads." />
      </section>
    </>
  );
}

function AdminDashboard() {
  return (
    <>
      <PageIntro
        kicker="Admin"
        title="Admin Dashboard"
        copy="Marketplace operators monitor users, vendors, categories, products, orders, finances, disputes, and fraud risks."
      />
      <section className="stat-grid">
        <Metric label="Total revenue" value={currency.format(0)} delta="No sales yet" />
        <Metric label="Total orders" value="0" delta="No orders yet" />
        <Metric label="Vendors" value="0" delta="No stores yet" />
        <Metric label="Customers" value="0" delta="No accounts yet" />
      </section>
      <section className="dashboard-grid">
        <ChartPanel title="Platform Sales Analytics" empty />
        <StatusPanel empty />
        <ListPanel title="Admin Work Queue" items={[]} emptyCopy="There are no approvals, refunds, fraud alerts, or moderation tasks yet." />
      </section>
    </>
  );
}

function ProductsPage() {
  return (
    <>
      <PageIntro
        kicker="Catalog"
        title="Product Management"
        copy="Create products with SKU, images, videos, brand, category, price, discount, stock, shipping weight, and product type."
      />
      <section className="table-panel">
        <h3>Inventory</h3>
        {products.length === 0 ? (
          <EmptyState
            icon={<Package size={38} />}
            title="No uploaded products"
            copy="Product uploads will appear here."
          />
        ) : null}
        {products.map((product) => (
          <div className="table-row" key={product.name}>
            <span>{product.category}</span>
            <strong>{product.name}</strong>
            <em>{product.stock < 15 ? "Low stock" : "Active"}</em>
            <span>{currency.format(product.price)}</span>
            <button>Edit</button>
          </div>
        ))}
      </section>
    </>
  );
}

function PaymentsPage() {
  return <FeatureMatrix title="Payments and Payouts" kicker="Finance" items={["Visa", "Mastercard", "MTN Mobile Money", "Airtel Money", "Telecel Cash", "M-Pesa", "Bank transfer", "Wallet balance", "Escrow payments", "Scheduled payouts", "Refund reserve", "Minimum withdrawal rules"]} />;
}

function LogisticsPage() {
  return <FeatureMatrix title="Logistics and Delivery" kicker="Fulfillment" items={["Local couriers", "National postal services", "Third-party logistics", "Real-time tracking", "Delivery estimation", "Fee calculator", "Pickup points", "Shipment timeline", "Return handling", "Vendor pickup scheduling"]} />;
}

function ReviewsPage() {
  return <FeatureMatrix title="Reviews and Ratings" kicker="Trust" items={["Product star ratings", "Review photos", "Review videos", "Verified purchase badges", "Store rating", "Delivery rating", "Customer service rating", "Moderation queue", "Fake review detection"]} />;
}

function NotificationsPage() {
  return <FeatureMatrix title="Notification System" kicker="Messaging" items={["Email", "SMS", "Push notifications", "WhatsApp", "New order alerts", "Payment received", "Shipment updates", "Refund processed", "Low stock alerts", "Dispute opened"]} />;
}

function AnalyticsPage() {
  return (
    <>
      <PageIntro
        kicker="Insights"
        title="Analytics"
        copy="MarketHub tracks sales, conversion, product performance, inventory turnover, customer behavior, cart abandonment, and search trends."
      />
      <section className="dashboard-grid">
        <ChartPanel title="Customer Behavior" empty />
        <ListPanel title="Vendor Metrics" items={[]} emptyCopy="Vendor analytics will begin after sellers upload products and receive orders." />
        <ListPanel title="Customer Metrics" items={[]} emptyCopy="Customer analytics will begin after accounts, browsing, carts, and purchases exist." />
      </section>
    </>
  );
}

function AiPage() {
  return <FeatureMatrix title="AI Features" kicker="Competitive Advantage" items={["Personalized suggestions", "Frequently bought together", "Suspicious transaction detection", "Fake review detection", "Product description generation", "Sales forecasting", "Inventory forecasting", "Shopping chatbot", "Order tracking assistant"]} />;
}

function ProfilePage() {
  return (
    <>
      <PageIntro
        kicker="Account"
        title="Profile and Account"
        copy="Users manage personal information, addresses, payment methods, order history, wallet, preferences, and security settings."
      />
      <EmptyState
        icon={<User size={42} />}
        title="No user account yet"
        copy="Account details will appear after signup."
      />
    </>
  );
}

function FeatureMatrix({ title, kicker, items }: { title: string; kicker: string; items: string[] }) {
  return (
    <>
      <PageIntro kicker={kicker} title={title} copy="This page captures the operating requirements from the PRD and turns them into visible web app modules for planning and implementation." />
      <section className="feature-grid">
        {items.map((item) => (
          <article className="feature-card" key={item}>
            <CheckCircle2 size={19} />
            <strong>{item}</strong>
          </article>
        ))}
      </section>
    </>
  );
}

function ChartPanel({ title, empty = false }: { title: string; empty?: boolean }) {
  const bars = empty ? [8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8] : [32, 54, 38, 72, 60, 86, 58, 93, 78, 104, 88, 116];
  return (
    <article className="chart-panel">
      <h3>{title}</h3>
      <div className="chart">
        {bars.map((height, index) => (
          <span style={{ height }} key={index} />
        ))}
      </div>
      {empty ? <p className="panel-empty">No activity has been recorded yet.</p> : null}
    </article>
  );
}

function ListPanel({ title, items, emptyCopy = "Nothing to show yet." }: { title: string; items: string[]; emptyCopy?: string }) {
  return (
    <article className="list-panel">
      <h3>{title}</h3>
      {items.length === 0 ? <p className="panel-empty">{emptyCopy}</p> : null}
      {items.map((item) => (
        <div key={item}>
          <Zap size={16} />
          <span>{item}</span>
        </div>
      ))}
    </article>
  );
}

function StatusPanel({ empty = false }: { empty?: boolean }) {
  return (
    <article className="status-panel">
      <h3>Orders by Status</h3>
      <div className="donut" />
      {empty ? <p className="panel-empty">No orders have been placed yet.</p> : null}
      <p><span /> Delivered: 0</p>
      <p><span /> Processing: 0</p>
      <p><span /> Shipped: 0</p>
      <p><span /> Cancelled: 0</p>
    </article>
  );
}

function EmptyState({
  icon,
  title,
  copy
}: {
  icon: React.ReactNode;
  title: string;
  copy: string;
}) {
  return (
    <section className="empty-state">
      {icon}
      <h3>{title}</h3>
      <p>{copy}</p>
    </section>
  );
}

export { App };

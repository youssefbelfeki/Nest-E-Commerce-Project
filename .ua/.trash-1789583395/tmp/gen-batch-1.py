import json

UA = "C:/Users/Youssef/Desktop/ecommerce-project/.ua"
B = "frontend/src/app/[lang]"

def F(rel):
    return f"file:{rel}"

def FN(rel, name):
    return f"function:{rel}:{name}"

files = [
    ("frontend/src/app/[lang]/admin/products/page.tsx", "page.tsx",
     "Admin-only product management page with create, edit, and delete flows backed by the products REST API.",
     ["component", "admin", "product-management", "api-handler", "crud"], "complex"),
    ("frontend/src/app/[lang]/cart/page.tsx", "page.tsx",
     "Shopping cart page showing cart items with quantity editing, removal, and checkout-to-order flow.",
     ["component", "cart", "checkout", "api-handler"], "complex"),
    ("frontend/src/app/[lang]/dictionaries.ts", "dictionaries.ts",
     "Locale dictionary registry mapping supported locales to their English and French translation bundles.",
     ["utility", "i18n", "localization", "dictionary"], "simple"),
    ("frontend/src/app/[lang]/layout.tsx", "layout.tsx",
     "Localized route layout that validates the locale, loads its dictionary, and wires auth and i18n providers.",
     ["entry-point", "layout", "i18n", "provider"], "simple"),
    ("frontend/src/app/[lang]/login/page.tsx", "page.tsx",
     "Login form page that authenticates via the auth context and redirects to the product catalog.",
     ["component", "authentication", "login-form"], "moderate"),
    ("frontend/src/app/[lang]/orders/page.tsx", "page.tsx",
     "Order history page listing the current user's past orders with line items and computed totals.",
     ["component", "orders", "order-history", "api-handler"], "moderate"),
    ("frontend/src/app/[lang]/page.tsx", "page.tsx",
     "Landing page that redirects visitors into the localized storefront catalog.",
     ["component", "landing-page", "entry-point", "routing"], "simple"),
    ("frontend/src/app/[lang]/products/page.tsx", "page.tsx",
     "Product catalog page with product listing, quantity selection, and add-to-cart actions.",
     ["component", "catalog", "product-listing", "api-handler"], "complex"),
    ("frontend/src/app/[lang]/register/page.tsx", "page.tsx",
     "Registration form page creating a new account through the auth context with password confirmation.",
     ["component", "authentication", "registration-form"], "moderate"),
    ("frontend/src/components/LanguageSwitcher.tsx", "LanguageSwitcher.tsx",
     "Locale switcher dropdown that rewrites the URL path prefix to change the interface language.",
     ["component", "i18n", "locale-switcher", "dropdown"], "moderate"),
    ("frontend/src/components/Navbar.tsx", "Navbar.tsx",
     "Top navigation bar with localized links, cart indicator, and auth-aware login and logout actions.",
     ["component", "navigation", "authentication", "i18n"], "moderate"),
    ("frontend/src/context/AuthContext.tsx", "AuthContext.tsx",
     "Authentication context providing JWT-backed login, registration, logout, and current-user state.",
     ["authentication", "context", "provider", "jwt", "state-management"], "moderate"),
    ("frontend/src/context/I18nContext.tsx", "I18nContext.tsx",
     "Internationalization context supplying the active dictionary plus translation and locale-path helpers.",
     ["i18n", "context", "provider", "localization"], "moderate"),
    ("frontend/src/lib/api.ts", "api.ts",
     "Backend API client with JWT token persistence and an authenticated fetch wrapper over the REST API.",
     ["utility", "api-client", "authentication", "http-client"], "moderate"),
    ("frontend/src/lib/i18n.ts", "i18n.ts",
     "Locale constants and type guard defining the supported English and French locales.",
     ["utility", "i18n", "localization", "type-definition"], "simple"),
    ("frontend/src/types/index.ts", "index.ts",
     "Shared frontend type definitions for the user, product, cart, and order domain models.",
     ["type-definition", "data-model", "shared-types"], "simple"),
]

# (path, name, lineRange, summary, tags, complexity, exported)
functions = [
    ("frontend/src/app/[lang]/admin/products/page.tsx", "AdminProductsPage", [10, 434],
     "Admin product console handling product fetching, creation, inline editing, and deletion.",
     ["component", "admin", "product-management", "crud"], "complex", True),
    ("frontend/src/app/[lang]/cart/page.tsx", "CartPage", [11, 278],
     "Cart view handling cart fetching, quantity updates, item removal, and order placement.",
     ["component", "cart", "checkout", "order-placement"], "complex", True),
    ("frontend/src/app/[lang]/dictionaries.ts", "hasLocale", [13, 14],
     "Type guard checking whether a string is a supported locale key.",
     ["utility", "i18n", "type-guard"], "simple", True),
    ("frontend/src/app/[lang]/dictionaries.ts", "getDictionary", [16, 21],
     "Returns the translation dictionary for a locale, falling back to the default dictionary.",
     ["utility", "i18n", "localization"], "simple", True),
    ("frontend/src/app/[lang]/layout.tsx", "generateStaticParams", [14, 16],
     "Generates static route params for each supported locale at build time.",
     ["routing", "i18n", "static-generation"], "simple", True),
    ("frontend/src/app/[lang]/layout.tsx", "RootLayout", [18, 41],
     "Root layout validating the locale and providing auth state, i18n dictionary, and navigation.",
     ["layout", "entry-point", "i18n", "provider"], "simple", True),
    ("frontend/src/app/[lang]/login/page.tsx", "LoginPage", [9, 110],
     "Login form submitting credentials through the auth context and redirecting on success.",
     ["component", "authentication", "login-form"], "moderate", True),
    ("frontend/src/app/[lang]/orders/page.tsx", "OrdersPage", [11, 156],
     "Order history view fetching and rendering the current user's orders with totals.",
     ["component", "orders", "order-history"], "moderate", True),
    ("frontend/src/app/[lang]/page.tsx", "Home", [9, 48],
     "Landing component redirecting visitors into the localized product storefront.",
     ["component", "landing-page", "routing"], "simple", True),
    ("frontend/src/app/[lang]/products/page.tsx", "ProductsPage", [10, 228],
     "Catalog view fetching products and supporting quantity selection with add-to-cart feedback.",
     ["component", "catalog", "product-listing", "cart"], "complex", True),
    ("frontend/src/app/[lang]/register/page.tsx", "RegisterPage", [9, 131],
     "Registration form validating password confirmation and creating accounts via the auth context.",
     ["component", "authentication", "registration-form"], "moderate", True),
    ("frontend/src/components/LanguageSwitcher.tsx", "LanguageSwitcher", [14, 108],
     "Dropdown component switching the URL locale prefix with outside-click and escape handling.",
     ["component", "i18n", "locale-switcher"], "moderate", True),
    ("frontend/src/components/Navbar.tsx", "Navbar", [10, 138],
     "Navigation bar rendering localized links, cart count, role-aware admin link, and auth actions.",
     ["component", "navigation", "authentication"], "moderate", True),
    ("frontend/src/context/AuthContext.tsx", "parseJwt", [14, 29],
     "Decodes a JWT access token payload without verification for client-side session state.",
     ["utility", "jwt", "authentication"], "simple", False),
    ("frontend/src/context/AuthContext.tsx", "AuthProvider", [42, 115],
     "Auth state provider restoring JWT sessions and exposing login, register, and logout actions.",
     ["authentication", "provider", "jwt", "state-management"], "moderate", True),
    ("frontend/src/context/AuthContext.tsx", "useAuth", [117, 123],
     "Context hook exposing the current auth state and authentication actions to components.",
     ["hook", "authentication", "context"], "simple", True),
    ("frontend/src/context/I18nContext.tsx", "I18nProvider", [17, 53],
     "I18n provider exposing the active dictionary with dot-path translation and locale-path helpers.",
     ["i18n", "provider", "localization"], "simple", True),
    ("frontend/src/context/I18nContext.tsx", "useI18n", [55, 61],
     "Context hook exposing the translation function and locale helpers to components.",
     ["hook", "i18n", "context"], "simple", True),
    ("frontend/src/lib/api.ts", "getAuthToken", [6, 16],
     "Reads the persisted JWT access token from local storage or the locale cookie.",
     ["utility", "authentication", "token-storage"], "simple", True),
    ("frontend/src/lib/api.ts", "setAuthToken", [18, 29],
     "Persists or clears the JWT access token in local storage and the locale cookie.",
     ["utility", "authentication", "token-storage"], "simple", True),
    ("frontend/src/lib/api.ts", "apiFetch", [31, 79],
     "Authenticated fetch wrapper attaching the JWT bearer header and normalizing API errors.",
     ["utility", "api-client", "http-client", "error-handling"], "simple", True),
    ("frontend/src/lib/i18n.ts", "isLocale", [9, 10],
     "Type guard checking whether a value is one of the supported locales.",
     ["utility", "i18n", "type-guard"], "simple", True),
]

with open(f"{UA}/tmp/ua-file-analyzer-input-1.json", encoding="utf-8") as fh:
    batch_input = json.load(fh)
batch_imports = batch_input["batchImportData"]

nodes = []
for path, name, summary, tags, complexity in files:
    nodes.append({"id": F(path), "type": "file", "name": name, "filePath": path,
                  "summary": summary, "tags": tags, "complexity": complexity})

for path, name, lr, summary, tags, complexity, _exp in functions:
    nodes.append({"id": FN(path, name), "type": "function", "name": name,
                  "filePath": path, "lineRange": lr,
                  "summary": summary, "tags": tags, "complexity": complexity})

edges = []
# imports 1:1 from batchImportData
for path in [f[0] for f in files]:
    for target in batch_imports.get(path, []):
        edges.append({"source": F(path), "target": F(target), "type": "imports",
                      "direction": "forward", "weight": 0.7})
# contains + exports
for path, name, _lr, _s, _t, _c, exported in functions:
    edges.append({"source": F(path), "target": FN(path, name), "type": "contains",
                  "direction": "forward", "weight": 1.0})
    if exported:
        edges.append({"source": F(path), "target": FN(path, name), "type": "exports",
                      "direction": "forward", "weight": 0.8})

AUTH = "frontend/src/context/AuthContext.tsx"
I18N = "frontend/src/context/I18nContext.tsx"
API = "frontend/src/lib/api.ts"
DICT = "frontend/src/app/[lang]/dictionaries.ts"
ADMIN = "frontend/src/app/[lang]/admin/products/page.tsx"
CART = "frontend/src/app/[lang]/cart/page.tsx"
LAYOUT = "frontend/src/app/[lang]/layout.tsx"
LOGIN = "frontend/src/app/[lang]/login/page.tsx"
ORDERS = "frontend/src/app/[lang]/orders/page.tsx"
HOME = "frontend/src/app/[lang]/page.tsx"
PROD = "frontend/src/app/[lang]/products/page.tsx"
REG = "frontend/src/app/[lang]/register/page.tsx"
LANG = "frontend/src/components/LanguageSwitcher.tsx"
NAV = "frontend/src/components/Navbar.tsx"

calls = [
    (ADMIN, "AdminProductsPage", AUTH, "useAuth"),
    (ADMIN, "AdminProductsPage", I18N, "useI18n"),
    (ADMIN, "AdminProductsPage", API, "apiFetch"),
    (CART, "CartPage", AUTH, "useAuth"),
    (CART, "CartPage", I18N, "useI18n"),
    (CART, "CartPage", API, "apiFetch"),
    (LAYOUT, "RootLayout", DICT, "hasLocale"),
    (LAYOUT, "RootLayout", DICT, "getDictionary"),
    (LOGIN, "LoginPage", AUTH, "useAuth"),
    (LOGIN, "LoginPage", I18N, "useI18n"),
    (ORDERS, "OrdersPage", AUTH, "useAuth"),
    (ORDERS, "OrdersPage", I18N, "useI18n"),
    (ORDERS, "OrdersPage", API, "apiFetch"),
    (HOME, "Home", AUTH, "useAuth"),
    (HOME, "Home", I18N, "useI18n"),
    (PROD, "ProductsPage", AUTH, "useAuth"),
    (PROD, "ProductsPage", I18N, "useI18n"),
    (PROD, "ProductsPage", API, "apiFetch"),
    (REG, "RegisterPage", AUTH, "useAuth"),
    (REG, "RegisterPage", I18N, "useI18n"),
    (LANG, "LanguageSwitcher", I18N, "useI18n"),
    (NAV, "Navbar", AUTH, "useAuth"),
    (NAV, "Navbar", I18N, "useI18n"),
    (AUTH, "AuthProvider", API, "getAuthToken"),
    (AUTH, "AuthProvider", API, "setAuthToken"),
    (AUTH, "AuthProvider", API, "apiFetch"),
]
for sp, sn, tp, tn in calls:
    edges.append({"source": FN(sp, sn), "target": FN(tp, tn), "type": "calls",
                  "direction": "forward", "weight": 0.8})

# self-validation
node_ids = {n["id"] for n in nodes}
assert len(node_ids) == len(nodes), "duplicate node ids"
expected_imports = sum(len(v) for v in batch_imports.values())
actual_imports = sum(1 for e in edges if e["type"] == "imports")
assert expected_imports == actual_imports, f"imports mismatch {actual_imports} != {expected_imports}"
allowed_external = set()
for v in batch_imports.values():
    allowed_external.update(v)
for e in edges:
    assert e["source"] in node_ids, f"dangling source {e}"
    if e["type"] == "imports":
        tgt_path = e["target"][len("file:"):]
        assert e["target"] in node_ids or tgt_path in allowed_external, f"dangling target {e}"
    else:
        assert e["target"] in node_ids, f"dangling target {e}"
    assert e["source"] != e["target"], "self edge"
    assert e["direction"] == "forward"
for n in nodes:
    assert n["summary"] and n["tags"] and len(n["tags"]) >= 3, f"node {n['id']} missing summary/tags"
    assert n["complexity"] in ("simple", "moderate", "complex")

out = {"nodes": nodes, "edges": edges}
with open(f"{UA}/intermediate/batch-1.json", "w", encoding="utf-8") as fh:
    json.dump(out, fh, ensure_ascii=False, indent=2)
print(f"nodes={len(nodes)} edges={len(edges)} imports={actual_imports}")

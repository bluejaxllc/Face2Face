import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic } from "./vite";
import { log } from "./log";
import { storage } from "./storage";
import cors from "cors";
import compression from "compression";
import rateLimit from "express-rate-limit";
import path from "path";

if (!process.env.SESSION_SECRET) {
  process.env.SESSION_SECRET = "face2face-dev-secret";
}

const app = express();
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
// Trust Railway's reverse proxy (Fastly CDN) so secure cookies work
app.set('trust proxy', 1);

// Enable gzip/brotli compression for all responses
app.use(compression());

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: false, limit: '25mb' }));

// Security headers for all responses
app.use((_req, res, next) => {
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('X-Frame-Options', 'DENY');
  res.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.set('Permissions-Policy', 'geolocation=(self), camera=(), microphone=()');
  next();
});

// Prevent CDN caching of API responses (Fastly strips set-cookie from cached responses)
app.use('/api', (_req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.set('Pragma', 'no-cache');
  next();
});

// CORS — locked to known origins
const allowedOrigins = [
  "https://face2face.icu",
  "https://www.face2face.icu",
  "https://bump.bluejax.ai",
  "https://face2face-production-11ee.up.railway.app",
  "http://localhost:5000",
  "http://localhost:5173",
  "capacitor://localhost",
  "http://localhost",
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, server-to-server)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else if (process.env.NODE_ENV !== "production") {
      // In dev, allow any origin
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
}));

// Global rate limiter: only in production
if (process.env.NODE_ENV === "production") {
  app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    message: { message: "Too many requests, please try again later" },
    standardHeaders: true,
    legacyHeaders: false,
  }));
}

// Strict auth rate limiter: 10 attempts per 15 minutes (production only)
if (process.env.NODE_ENV === "production") {
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { message: "Too many login attempts, please try again later" },
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use("/api/auth/login", authLimiter);
  app.use("/api/auth/register", authLimiter);
}

// Set up session middleware
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: storage.sessionStore,
  cookie: {
    secure: process.env.NODE_ENV === "production" ? true : false,
    maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
    httpOnly: true,
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax" // More secure for development
  }
}));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

import { setupWebSocket } from "./websocket";

(async () => {
  const server = await registerRoutes(app);
  
  // Attach WebSocket server
  setupWebSocket(server);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000 in production
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = process.env.PORT ? parseInt(process.env.PORT) : 5000;
  server.listen({
    port,
    host: "0.0.0.0",
  }, () => {
    log(`serving on port ${port}`);

    // Inactive timeout enforcement: every 60 seconds, deactivate users
    // whose lastLocation exceeds their personal inactiveTimeout setting
    setInterval(async () => {
      try {
        const count = await storage.deactivateInactiveUsers();
        if (count > 0) {
          log(`[InactiveTimeout] Deactivated ${count} inactive user(s)`);
        }
      } catch (err) {
        console.error('[InactiveTimeout] Error:', err);
      }
    }, 60_000);
  });
})();

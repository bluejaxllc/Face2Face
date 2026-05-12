import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import { registerRoutes } from "./routes";
import { storage } from "./storage";
import cors from "cors";
import rateLimit from "express-rate-limit";

if (!process.env.SESSION_SECRET) {
    process.env.SESSION_SECRET = "face2face-dev-secret";
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// CORS — locked to known origins
const allowedOrigins = [
    "https://bump.bluejax.ai",
    "https://face2face.vercel.app",
    "http://localhost:5000",
    "http://localhost:5173",
    "capacitor://localhost",
    "http://localhost",
];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else if (process.env.NODE_ENV !== "production") {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true,
}));

// Rate limiting
app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { message: "Too many requests, please try again later" },
    standardHeaders: true,
    legacyHeaders: false,
}));

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { message: "Too many login attempts, please try again later" },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

// Session middleware
app.use(session({
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
        secure: process.env.NODE_ENV === "production",
        maxAge: 1000 * 60 * 60 * 24 * 7,
        httpOnly: true,
        sameSite: "lax",
    }
}));

// Error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
});

// Lazy initialization
let initialized = false;
async function ensureInitialized() {
    if (!initialized) {
        await registerRoutes(app);
        initialized = true;
    }
}

// Vercel serverless handler
export default async function handler(req: any, res: any) {
    await ensureInitialized();
    return app(req, res);
}

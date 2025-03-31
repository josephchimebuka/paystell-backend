import express, {
  Request,
  Response,
  RequestHandler,
  ErrorRequestHandler,
} from "express";
import morgan from "morgan";
import cors from "cors";

// Route imports
import sessionRouter from "./routes/session.routes";
import emailVerification from "./routes/emailVerification.routes";
import PaymentRoute from "./routes/PaymentLink.routes";
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import merchanRoutes from "./routes/merchantRoutes";
import healthRouter from "./routes/health.routes";
import walletVerificationRoutes from "./routes/wallet-verification.routes";
import merchantWebhookQueueRoutes from "./routes/merchantWebhookQueue.routes";

// Middleware imports
import { globalRateLimiter } from "./middlewares/globalRateLimiter.middleware";
import { validateIpAddress } from "./middlewares/ipValidation.middleware";
import { errorHandler } from "./middlewares/errorHandler";
import { requestLogger } from "./middlewares/requestLogger.middleware";

// Service imports
import RateLimitMonitoringService from "./services/rateLimitMonitoring.service";
import { startExpiredSessionCleanupCronJobs } from "./utils/schedular";
import logger from "./utils/logger";

// Initialize express app
const app = express();

// Apply middleware
// Apply global middlewares
app.use(morgan("dev"));
app.use(cors());
app.use(express.json());
app.use(validateIpAddress as RequestHandler);
app.use(
  RateLimitMonitoringService.createRateLimitMonitoringMiddleware() as RequestHandler,
);
app.use(globalRateLimiter as RequestHandler);
app.use(requestLogger as RequestHandler);

// Start scheduled jobs
startExpiredSessionCleanupCronJobs();

// Log application startup
logger.info("Application started successfully");

// Define routes
app.use("/session", sessionRouter);
app.use("/email-verification", emailVerification);
app.use("/paymentlink", PaymentRoute);
app.use("/auth", authRoutes);
app.use("/wallet-verification", walletVerificationRoutes);
app.use("/users", userRoutes);
app.use("/merchants", merchanRoutes);
app.use("/health", healthRouter);
app.use("/webhook-queue/merchant", merchantWebhookQueueRoutes);

// Error handling middleware
app.use(errorHandler as ErrorRequestHandler);

// Handle 404 errors
app.use(((req: Request, res: Response) => {
  res.status(404).json({
    status: "error",
    message: `Route ${req.originalUrl} not found`,
  });
}) as RequestHandler);

// Export app
export default app;

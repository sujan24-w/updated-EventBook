import express from "express";
import authRoute from "./routes/authRoutes"
import eventRoute from "./routes/eventRoutes"
import cors from "cors";
import cookieParser from "cookie-parser";
import adminRoute from "./routes/adminRoutes";
import bookingRoute from "./routes/bookingRoutes";
const app = express();


app.use(express.json());
app.use(cookieParser())

const isProduction = process.env.NODE_ENV === "production";
const allowedOrigins = [
  process.env.CORS_ORIGIN,  
 ...(isProduction ? [/\.vercel\.app$/] : []),
].filter((origin): origin is string | RegExp => origin !== undefined);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);



//authintication routes
app.use("/api/auth",authRoute);
app.use("/api/events",eventRoute);
app.use("/api/admin/", adminRoute);
app.use("/api/bookings", bookingRoute);

app.get("/", (_req, res) => {
  res.json({ status: "ok",success:true,
    message:"welcome to EventBook API"
   });
});  

export default app;
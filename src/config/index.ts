import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface Config {
  nodeEnv: string;
  port: number;
  jwtSecret: string;
  jwtExpiresIn: string;
  socketPath: string;
  clientUrl: string;
  oneSignalAppId: string;
  oneSignalApiKey: string;
  secret: string;
  email_service: string;
  email_host: string;
  email_port: string;
  email_user: string;
  email_pass: string;
  frontend_url: string;
  db_username: string;
  db_password: string
  DB_HOST: string
  DB_NAME: string
  ALLLOW_LOGIN_BY_EMAIL: string
  ALLLOW_LOGIN_BY_MOBILE: string
  ALLLOW_LOGIN_BY_GOOGLE: string
  ALLLOW_LOGIN_BY_APPLE: string
  PAYPAL_CLIENT_ID: string
  PAYPAL_CLIENT_SECRET: string
  PAYPAL_API: string
  STRIPE_SECRET_KEY: string
  TWILIO_ACCOUNT_SID: string
  TWILIO_AUTH_TOKEN: string
  TWILIO_FROM_NUMBER: string
  MSG91_API_KEY: string
  MSG91_TEMPLATE_ID: string
  MSG91_SENDER_ID: string
  MSG91_API_ENDPOINT: string

}

export const config: Config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  jwtSecret: process.env.JWT_SECRET || 'secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  socketPath: process.env.SOCKET_PATH || '/socket.io',
  clientUrl: process.env.CLIENT_URL || 'http://192.168.0.28:3000',
  oneSignalAppId: process.env.ONE_SIGNAL_APP_ID || '',
  oneSignalApiKey: process.env.ONE_SIGNAL_API_KEY || '',
  secret: process.env.SECRET || 'secret',
  email_service: process.env.EMAIL_SERVICE || "gmail",
  email_host: process.env.EMAIL_HOST || "smtp.gmail.com",
  email_port: process.env.EMAIL_PORT || "587",
  email_user: process.env.EMAIL_USER || "hetavi.primocys@gmail.com",
  email_pass: process.env.EMAIL_PASSWORD || "oizq evlo gpfj mfjo",
  frontend_url: process.env.FRONTEND_URL || "http://localhost:3000",
  db_username: process.env.DB_USERNAME || "postgres",
  db_password: process.env.DB_PASSWORD || "hetu",
  DB_HOST: process.env.DB_HOST || "localhost",
  DB_NAME: process.env.DB_NAME || "music_app",
  ALLLOW_LOGIN_BY_EMAIL: process.env.ALLLOW_LOGIN_BY_EMAIL || "true",
  ALLLOW_LOGIN_BY_MOBILE: process.env.ALLLOW_LOGIN_BY_MOBILE || "true",
  ALLLOW_LOGIN_BY_GOOGLE: process.env.ALLLOW_LOGIN_BY_GOOGLE || "true",
  ALLLOW_LOGIN_BY_APPLE: process.env.ALLLOW_LOGIN_BY_APPLE || "true",
  PAYPAL_CLIENT_ID: process.env.PAYPAL_CLIENT_ID || "PAYPAL_CLIENT_ID",
  PAYPAL_CLIENT_SECRET: process.env.PAYPAL_CLIENT_SECRET || "PAYPAL_CLIENT_SECRET",
  PAYPAL_API: process.env.PAYPAL_API || "https://api-m.sandbox.paypal.com",
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || "STRIPE_SECRET_KEY",
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID || "TWILIO_ACCOUNT_SID",
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN || "TWILIO_AUTH_TOKEN",
  TWILIO_FROM_NUMBER: process.env.TWILIO_FROM_NUMBER || "TWILIO_FROM_NUMBER",
  MSG91_API_KEY: process.env.TWILIO_FROM_NUMBER || "TWILIO_FROM_NUMBER",
  MSG91_TEMPLATE_ID: process.env.TWILIO_FROM_NUMBER || "TWILIO_FROM_NUMBER",
  MSG91_SENDER_ID: process.env.TWILIO_FROM_NUMBER || "TWILIO_FROM_NUMBER",
  MSG91_API_ENDPOINT: process.env.MSG91_API_ENDPOINT || "https://api.msg91.com/api/v5/otp",
};

// Database configuration
export const dbConfig = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  autoIndex: true,
};

// Cors configuration
export const corsConfig = {
  origin: config.clientUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
};

// Socket.IO configuration
export const socketConfig = {
  path: config.socketPath,
  cors: corsConfig
};
export const emailConfig = {
  service: config.email_service,
  host: config.email_host,
  port: config.email_port,
  user: config.email_user,
  pass: config.email_pass,
};

// JWT configuration
export const jwtConfig = {
  secret: config.jwtSecret,
  expiresIn: config.jwtExpiresIn
};
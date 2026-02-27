import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export const supabasePublic = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

export const config = {
  port: parseInt(process.env.PORT) || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  appUrl: process.env.APP_URL || 'http://localhost:5173',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  jwtSecret: process.env.JWT_SECRET || 'dev_secret',
  r2: {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
    accessKey: process.env.CLOUDFLARE_R2_ACCESS_KEY,
    secretKey: process.env.CLOUDFLARE_R2_SECRET_KEY,
    bucket: process.env.R2_BUCKET_NAME || 'waiichia-audio',
  },
  payment: {
    atApiKey: process.env.AT_API_KEY,
    atUsername: process.env.AT_USERNAME,
    huriKey: process.env.HURI_MONEY_KEY,
  },
  commission: {
    purchase: 0.15,
    rental: 0.20,
    withdrawal: 0.025,
    transfer: 0.01,
  }
}

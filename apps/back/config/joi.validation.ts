import Joi from 'joi';

export const envValidationSchema = Joi.object({
  // App
  NODE_ENV: Joi.string()
    .valid('dev', 'prod', 'test', 'development', 'production')
    .default('dev'),
  PORT: Joi.number().default(3000),

  // Database
  DB_HOST: Joi.string().default('localhost'),
  DB_PORT: Joi.number().default(5432),
  DB_USER: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_NAME: Joi.string().required(),

  // JWT
  JWT_SECRET: Joi.string().min(16).required(),
  JWT_EXPIRES_IN: Joi.string().default('7d'),

  // Prefix
  API_PREFIX: Joi.string().default('api/v1'),
}).unknown(true);

export function validateEnv(config: Record<string, any>): Record<string, any> {
  const { value, error } = envValidationSchema.validate(config, {
    abortEarly: false,
    allowUnknown: true,
    stripUnknown: true,
  });

  if (error) {
    throw new Error(`❌ Invalid environment variables:\n${error.message}`);
  }

  return value;
}

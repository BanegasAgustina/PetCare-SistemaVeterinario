/** Construye Express separado del puerto de escucha para facilitar pruebas HTTP. */
import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import { apiRouter } from './routes';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';

export const app = express();
app.disable('x-powered-by');
// Solo se habilitan orígenes web explícitos. El cliente React Native no necesita CORS.
app.use(cors({ origin: (origin, callback) => callback(null, !origin || env.corsAllowedOrigins.includes(origin)), methods: ['GET', 'POST', 'PUT', 'PATCH', 'OPTIONS'], allowedHeaders: ['Content-Type', 'Authorization'] }));
app.use(express.json({ limit: '100kb' }));
app.use('/api', apiRouter);
app.use(notFoundHandler);
app.use(errorHandler);

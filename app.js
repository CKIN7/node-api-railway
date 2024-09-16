import express, { json } from 'express';
import { createMovieRouter } from './routes/movieRoutes.js';
import 'dotenv/config';

import { corsMiddleware } from './middlewares/cors.js';

export const createApp = ({ movieModel }) => {
    const app = express();
    const PORT = process.env.PORT ?? 3000;
    app.disable('x-powered-by');
    app.use(json());
    app.use(corsMiddleware());

    app.use('/movies', createMovieRouter({ movieModel }));

    app.listen(PORT, () => {
        console.log(`Server listening on port http://localhost:${PORT} `);
    });
};

import { createPool } from 'mysql2/promise';
import 'dotenv/config';

export const connection = createPool({
    host: process.env.HOSTDB,
    user: process.env.USERDB,
    port: process.env.PORTDB,
    password: process.env.PASSWORDDB,
    database: process.env.DB,
});

export class MovieModel {
    static async getAll({ genre }) {
        if (genre) {
            const lowerCaseGenre = genre.toLowerCase();

            // get genre ids from database table using genre names

            const [genres] = await connection.query(
                'SELECT id, name FROM genre WHERE LOWER(name) = ?',
                [lowerCaseGenre]
            );

            if (genres.length === 0) {
                // No genres found, return an empty array
                return [];
            }

            const [{ id: genreId, name }] = genres;

            const [movies] = await connection.query(
                `SELECT title, year, director, duration, poster, rate, ? AS genre FROM movie_genres INNER JOIN movie ON movie_genres.movie_id = movie.id WHERE genre_id = ?;`,
                [name, genreId]
            );

            return movies;
        }
        const [movies] = await connection.query(
            'SELECT title, year, director, duration, poster, rate, BIN_TO_UUID(id) id FROM movie;'
        );

        return movies;
    }

    static async getById({ id }) {
        const [movies] = await connection.query(
            `SELECT title, year, director, duration, poster, rate, BIN_TO_UUID(id) id
            FROM movie WHERE id = UUID_TO_BIN(?);`,
            [id]
        );

        if (movies.length === 0) return null;
        return [movies];
    }

    static async create({ input }) {
        const {
            genre: genreInput, // genre is an array
            title,
            year,
            duration,
            director,
            rate,
            poster,
        } = input;

        // todo: crear la conexión de genre

        // crypto.randomUUID()
        const [uuidResult] = await connection.query('SELECT UUID() uuid;');
        const [{ uuid }] = uuidResult;

        try {
            await connection.query(
                `INSERT INTO movie (id, title, year, director, duration, poster, rate)
          VALUES (UUID_TO_BIN("${uuid}"), ?, ?, ?, ?, ?, ?);`,
                [title, year, director, duration, poster, rate]
            );
        } catch (e) {
            // puede enviarle información sensible
            throw new Error('Error creating movie');
            // enviar la traza a un servicio interno
            // sendLog(e)
        }

        const [movies] = await connection.query(
            `SELECT title, year, director, duration, poster, rate, BIN_TO_UUID(id) id
        FROM movie WHERE id = UUID_TO_BIN(?);`,
            [uuid]
        );

        return movies[0];
    }

    static async delete({ id }) {
        await connection.query(`DELETE FROM movie WHERE id = UUID_TO_BIN(?)`, [
            id,
        ]);
    }

    static async update({ id, input }) {
        await connection.query(`UPDATE movie SET ? WHERE id = UUID_TO_BIN(?)`, [
            input,
            id,
        ]);

        const [movie] = await connection.query(
            `SELECT title, year, director, duration, poster, rate, BIN_TO_UUID(id) id
        FROM movie WHERE id = UUID_TO_BIN(?);`,
            [id]
        );
        return [movie];
    }
}

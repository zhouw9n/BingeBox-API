import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { DataAPIClient } from "@datastax/astra-db-ts";

// Load .env configs.
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Allow request from frontend client.
app.use(cors());
// Allow to parse json bodies for POST requests.
app.use(express.json()); 

// Fetch all trending movies and shows from this week.
app.get("/api/trending/all", async(req, res) => {
    const url = `https://api.themoviedb.org/3/trending/all/week?api_key=${process.env.TMDB_API_KEY}`;
    const data = await fetchFromTMDB(url, res);
    if (data) res.json(data);
});

// Fetch all trending movies from this week.
app.get("/api/trending/movies", async(req, res) => {
    const url = `https://api.themoviedb.org/3/trending/movie/week?api_key=${process.env.TMDB_API_KEY}`;
    const data = await fetchFromTMDB(url, res);
    if (data) res.json(data);
});

// Fetch all trending tv shows from this week.
app.get("/api/trending/shows", async(req, res) => {
    const url = `https://api.themoviedb.org/3/trending/tv/week?api_key=${process.env.TMDB_API_KEY}`;
    const data = await fetchFromTMDB(url, res);
    if (data) res.json(data);
});
     
// Fetch all upcoming movies.
app.get("/api/movie/upcoming", async(req, res) => {
    const url = `https://api.themoviedb.org/3/movie/upcoming?api_key=${process.env.TMDB_API_KEY}`;
    const data = await fetchFromTMDB(url, res);
    if (data) res.json(data);
});

// Fetch movies details.
app.get("/api/movie/details", async(req, res) => {
    const movieId = req.query.id;
    const url = `https://api.themoviedb.org/3/movie/${movieId}?api_key=${process.env.TMDB_API_KEY}&append_to_response=images,videos,recommendations,credits`;
    const data = await fetchFromTMDB(url, res);
    if (data) res.json(data);
});

// Fetch tv show details.
app.get("/api/tv/details", async(req, res) => {
    const showId = req.query.id;
    const url = `https://api.themoviedb.org/3/tv/${showId}?api_key=${process.env.TMDB_API_KEY}&append_to_response=images,videos,recommendations,credits`;
    const data = await fetchFromTMDB(url, res);
    if (data) res.json(data);
});

// Fetch movie by genre.
app.get("/api/movie/genre", async(req, res) => {
    const genreId = req.query.id;
    const url = `https://api.themoviedb.org/3/discover/movie?api_key=${process.env.TMDB_API_KEY}&with_genres=${genreId}`;
    const data = await fetchFromTMDB(url, res);
    if (data) res.json(data);
});

// Fetch tv show by genre.
app.get("/api/tv/genre", async(req, res) => {
    const genreId = req.query.id;
    const url = `https://api.themoviedb.org/3/discover/tv?api_key=${process.env.TMDB_API_KEY}&with_genres=${genreId}`;
    const data = await fetchFromTMDB(url, res);
    if (data) res.json(data);
});

// Fetch search resutls.
app.get("/api/search", async(req, res) => {
    const query = req.query.query;
    const url = `https://api.themoviedb.org/3/search/multi?api_key=${process.env.TMDB_API_KEY}&query=${query}`;
    const data = await fetchFromTMDB(url, res);
    if (data) res.json(data);
});

// Helper function: fetch data from TMDB API.
async function fetchFromTMDB(url, res) {
    try {
        const response = await fetch(url);

        // This handles errors returned by external API TMDB.
        if (!response.ok) {
            // Parse the response body as JSON.
            const errorBody = await response.json();
            // Attempt to extract error message from JSON otherwhise fallback message.
            const errorMessage = errorBody?.error?.message || `HTTP error: ${response.status}`;
            // Sending response status and JSON object back to client.
            return res.status(response.status).json({error: errorMessage});
        }

        const data = await response.json();
        return data;

    } catch (error) {
        // This handles internal errors by the server on render.
        console.error("Fetch of network error:", error);
        return res.status(500).json({error: "Server error. Please try again later."});
    }
}



/**
 * Datastrax Database API
 */
const client = new DataAPIClient();

const database = client.db(process.env.DATASTRAX_API_ENDPOINT, {
    token: process.env.DATASTRAX_APPLICATION_TOKEN,
});
const collection = database.collection("library");

app.post("/api/datastrax/library", async (req, res) => {
    const query = req.body.expression;

    if (!query || typeof query !== "string") {
        return res.status(400).json({error: "Query provided is not a string."});
    }

    try {
        const data = await collection.find(
            {},
            {
                vectorize: query,
                limit: 50,
                projection: { $vector: 0},
            }   
        );
        
        res.json(data)
    } catch (error) {
        res.status(500).json({error: error.message});
    }
});

app.listen(PORT);
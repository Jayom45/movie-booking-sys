import express from 'express';
import { protect } from '../middleware/auth.js';
import Movie from '../models/Movie.js';
import Show from '../models/Show.js';
import { GoogleGenAI } from '@google/genai';

const router = express.Router();

router.post('/concierge', protect, async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ success: false, reason: 'Bad Request', details: 'Prompt is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    
    console.log(`[AI Concierge] Request received: "${prompt}"`);
    console.log(`[AI Concierge] API Key loaded: ${!!apiKey}`);
    console.log(`[AI Concierge] Model: ${modelName}`);

    if (!apiKey) {
      console.error('[AI Concierge] Error: Gemini API key is not configured');
      return res.status(500).json({ success: false, reason: 'Configuration Error', details: 'Gemini API key is not configured' });
    }

    // Gather DB context
    const movies = await Movie.find({ isActive: true }).select('title genre language durationMinutes rating description posterUrl').lean();
    
    // Get upcoming shows
    const now = new Date();
    const shows = await Show.find({ showTime: { $gte: now } })
      .populate('movie', 'title posterUrl')
      .select('theater city screen showTime prices totalSeats bookedSeats')
      .lean();

    // Map shows to a simpler format for the AI
    const availableShows = shows.map(s => {
      const availableSeats = s.totalSeats - (s.bookedSeats ? s.bookedSeats.length : 0);
      return {
        movieTitle: s.movie?.title,
        theater: s.theater,
        city: s.city,
        showTime: s.showTime,
        pricePremium: s.prices?.premium,
        priceGold: s.prices?.gold,
        priceSilver: s.prices?.silver,
        availableSeats
      };
    });

    const mappedMovies = movies.map(m => ({
      id: m._id,
      title: m.title,
      genre: m.genre.join(', '),
      language: m.language,
      duration: m.durationMinutes,
      rating: m.rating,
      poster: m.posterUrl,
      description: m.description
    }));

    const OFFERS = [
      { title: 'Flat 50% off on first booking', code: 'HELLOCINE' },
      { title: 'Flat ₹150 off on cards', code: 'CARD150' },
      { title: '25% off weekend shows', code: 'WEEKEND25' },
      { title: 'Snack Upgrade at ₹99', code: 'POPCORN99' }
    ];

    const finalSystemInstruction = `You are CineAI Concierge, a Smart Booking Assistant for CineBook.
Your task is to guide users through the booking flow based on natural language queries.
You must use ONLY the live database context provided. NEVER invent movies, shows, or cities.
If a movie or show is not in the context, politely say it is currently unavailable.

DATABASE CONTEXT:
CURRENT DATE & TIME: ${now.toLocaleString()}
MOVIES: ${JSON.stringify(mappedMovies, null, 2)}
UPCOMING SHOWS: ${JSON.stringify(availableShows, null, 2)}
OFFERS: ${JSON.stringify(OFFERS, null, 2)}

INSTRUCTIONS:
1. Parse the user's intent: Date/Time (e.g., today, tomorrow, weekend, tonight), City (Mumbai City, Navi Mumbai, etc), Budget, Group Booking.
2. If the user gives a budget (e.g., "₹1500 for four people"), calculate budget per person and ONLY recommend shows fitting the budget. Explain the math in your reply.
3. If the user mentions "friends", "group", "family", "team", "everyone" (group > 1), set "isGroup" to true in your JSON response so we can suggest CineSquad.
4. If comparing movies, compare their Genre, Runtime, Rating, and Available Shows.
5. If an offer perfectly applies (e.g. Weekend Offer for weekend shows), include it in the "offer" field of the recommendation.
6. The assistant MUST NOT create bookings directly. We only provide recommendations with a View Show button.

YOUR RESPONSE MUST BE A VALID JSON OBJECT WITH THIS EXACT STRUCTURE:
{
  "reply": "Your conversational text here. Include budget calculations, comparisons, or friendly greetings.",
  "recommendations": [
    {
      "movieId": "The exact ID of the movie from the MOVIES list",
      "title": "Movie Title",
      "poster": "The poster URL from the MOVIES list",
      "genre": "Action, Comedy",
      "rating": 8.4,
      "theatre": "Theatre Name",
      "showtime": "e.g. June 27, 2026 at 7:00 PM",
      "prices": "e.g. Premium: ₹420 | Gold: ₹320 | Silver: ₹220",
      "offer": "Applicable offer title (optional, otherwise empty string)"
    }
  ],
  "isGroup": boolean (true if group detected, else false)
}
NEVER wrap your JSON in markdown codeblocks like \`\`\`json. Return pure raw JSON.`;

    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: modelName,
        config: {
          responseMimeType: "application/json"
        },
        contents: [
          { role: 'user', parts: [{ text: finalSystemInstruction + '\n\nUSER PROMPT:\n' + prompt }] }
        ],
      });

      // The response.text is guaranteed to be a JSON string due to responseMimeType
      const parsedData = JSON.parse(response.text);
      res.json(parsedData);
    } catch (apiError) {
      console.error('[AI Concierge] Gemini API Error:', apiError.message || apiError);
      console.error('[AI Concierge] Status Code:', apiError.status || apiError.code || 'Unknown');
      
      // Fallback response using DB mapped to the new JSON schema
      const topMovies = movies.sort((a, b) => b.rating - a.rating).slice(0, 3);
      const fallbackRecommendations = topMovies.map(m => ({
        movieId: m._id,
        title: m.title,
        poster: m.posterUrl,
        genre: m.genre.join(', '),
        rating: m.rating,
        theatre: "Multiple Theatres",
        showtime: "Various Times",
        prices: "Check Details",
        offer: ""
      }));

      const fallbackMsg = "I'm currently experiencing high traffic and the AI service is temporarily busy. However, here are some of our top-rated movies you might enjoy!";

      res.json({
        reply: fallbackMsg,
        recommendations: fallbackRecommendations,
        isGroup: false
      });
    }
  } catch (error) {
    console.error('[AI Concierge] Server Error:', error);
    res.status(500).json({ success: false, reason: 'Server Error', details: error.message });
  }
});

export default router;

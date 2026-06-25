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
    const movies = await Movie.find({ isActive: true }).select('title genre language durationMinutes rating description').lean();
    
    // Get upcoming shows
    const now = new Date();
    const shows = await Show.find({ showTime: { $gte: now } })
      .populate('movie', 'title')
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
      description: m.description
    }));

    const finalSystemInstruction = `You are CineAI Concierge, an intelligent movie booking assistant for CineBook.
Your task is to help users find movies based on their queries. 
Use ONLY the provided database context. NEVER invent movies. If a movie or show is not in the context, politely say it is currently unavailable.

DATABASE CONTEXT:
MOVIES:
${JSON.stringify(mappedMovies, null, 2)}

UPCOMING SHOWS:
${JSON.stringify(availableShows, null, 2)}

When recommending a movie, include Movie Name, Genre, Rating, Theatre, Show Time, and Price.
CRITICAL: When you recommend a movie, you MUST include a link to book it at the bottom of the recommendation using this exact markdown format:
[Book Now](/movies/ID) 
where ID is the movie's id from the MOVIES list. Note the plural /movies/ in the URL.

Keep your response conversational, concise, and helpful. Format nicely in markdown.`;

    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: modelName,
        contents: [
          { role: 'user', parts: [{ text: finalSystemInstruction + '\n\nUSER PROMPT:\n' + prompt }] }
        ],
      });

      res.json({ reply: response.text });
    } catch (apiError) {
      console.error('[AI Concierge] Gemini API Error:', apiError.message || apiError);
      console.error('[AI Concierge] Status Code:', apiError.status || apiError.code || 'Unknown');
      
      // Fallback response using DB
      const topMovies = movies.sort((a, b) => b.rating - a.rating).slice(0, 3);
      const fallbackMsg = `I'm currently experiencing high traffic and the AI service is temporarily busy. However, here are some of our top-rated movies you might enjoy:

${topMovies.map(m => `**${m.title}** (${m.genre.join(', ')}) - ⭐ ${m.rating}\n[Book Now](/movies/${m._id})`).join('\n\n')}

Feel free to try asking me again in a moment!`;

      // Return 200 with the fallback message so the UI doesn't crash
      res.json({ reply: fallbackMsg });
    }
  } catch (error) {
    console.error('[AI Concierge] Server Error:', error);
    res.status(500).json({ success: false, reason: 'Server Error', details: error.message });
  }
});

export default router;

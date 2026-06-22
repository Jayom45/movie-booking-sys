import express from 'express';
import nodemailer from 'nodemailer';
import { protect } from '../middleware/auth.js';
import Squad from '../models/Squad.js';
import SquadMember from '../models/SquadMember.js';
import Show from '../models/Show.js';
import Movie from '../models/Movie.js';

const router = express.Router();

// 1. Create a squad
router.post('/', protect, async (req, res) => {
  try {
    const { name, city } = req.body;
    const squad = await Squad.create({
      name,
      city,
      hostId: req.user._id,
    });
    // Add host as an accepted member
    await SquadMember.create({
      squadId: squad._id,
      userId: req.user._id,
      email: req.user.email,
      status: 'accepted',
    });
    res.status(201).json(squad);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 2. Get user's squads (host or member or pending invite)
router.get('/', protect, async (req, res) => {
  try {
    const memberships = await SquadMember.find({ email: req.user.email });
    const squadIds = memberships.map(m => m.squadId);
    
    const squads = await Squad.find({
      $or: [
        { _id: { $in: squadIds } },
        { hostId: req.user._id }
      ]
    }).sort('-createdAt').populate('hostId', 'name');

    // Attach membership details
    const allMembers = await SquadMember.find({ squadId: { $in: squads.map(s => s._id) } });
    
    const enrichedSquads = squads.map(squad => {
      const squadMembers = allMembers.filter(m => m.squadId.toString() === squad._id.toString());
      const me = squadMembers.find(m => m.email === req.user.email);
      return {
        ...squad.toObject(),
        memberCount: squadMembers.length,
        pendingCount: squadMembers.filter(m => m.status === 'pending').length,
        acceptedCount: squadMembers.filter(m => m.status === 'accepted').length,
        myStatus: me ? me.status : (squad.hostId._id.toString() === req.user._id.toString() ? 'accepted' : 'none')
      };
    });

    res.json(enrichedSquads);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 3. Get squad details
router.get('/:id', protect, async (req, res) => {
  try {
    const squad = await Squad.findById(req.params.id).populate('hostId', 'name email');
    if (!squad) return res.status(404).json({ message: 'Squad not found' });
    
    const members = await SquadMember.find({ squadId: squad._id })
      .populate('userId', 'name')
      .populate('movieVote', 'title posterUrl');
      
    res.json({ squad, members });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 4. Send email invites
router.post('/:id/invite', protect, async (req, res) => {
  try {
    const { emails } = req.body;
    const squad = await Squad.findById(req.params.id);
    if (!squad) return res.status(404).json({ message: 'Squad not found' });
    if (squad.hostId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only host can invite' });
    }

    // Need to import User model at top if not imported, wait, we can just use mongoose.model('User')
    const mongoose = (await import('mongoose')).default;
    const User = mongoose.model('User');

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    for (const email of emails) {
      const existingMember = await SquadMember.findOne({ squadId: squad._id, email: email.toLowerCase() });
      if (!existingMember) {
        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        
        await SquadMember.create({
          squadId: squad._id,
          email: email.toLowerCase(),
          userId: existingUser ? existingUser._id : null,
          status: 'pending'
        });
      }
      
      if (process.env.EMAIL_USER) {
        const inviteLink = `http://localhost:5173/register?squad_invite=${squad._id}&email=${email.toLowerCase()}`;
        await transporter.sendMail({
          from: `"CineSquad" <${process.env.EMAIL_USER}>`,
          to: email,
          subject: `${req.user.name} invited you to join a CineSquad!`,
          html: `<p>You've been invited to plan a movie night for <strong>${squad.name}</strong>.</p>
                 <p><a href="${inviteLink}">Click here to join and share your availability!</a></p>`
        }).catch(err => console.error("Email error:", err));
      }
    }
    res.json({ message: 'Invites sent' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 5. Respond to invite
router.post('/:id/respond', protect, async (req, res) => {
  try {
    const { status } = req.body;
    const member = await SquadMember.findOne({ squadId: req.params.id, email: req.user.email });
    if (!member) return res.status(404).json({ message: 'Invite not found' });
    
    member.status = status;
    member.userId = req.user._id;
    await member.save();
    res.json(member);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 6. Update availability and movie vote
router.put('/:id/availability', protect, async (req, res) => {
  try {
    const { availability, movieVote } = req.body;
    const member = await SquadMember.findOne({ squadId: req.params.id, email: req.user.email });
    if (!member) return res.status(404).json({ message: 'Member not found' });
    
    if (availability) member.availability = availability;
    if (movieVote !== undefined) member.movieVote = movieVote || null;
    await member.save();
    res.json(member);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 7. Recommendations
router.get('/:id/recommendations', protect, async (req, res) => {
  try {
    const squad = await Squad.findById(req.params.id);
    const members = await SquadMember.find({ squadId: squad._id, status: 'accepted' });
    
    const votes = {};
    const avail = {};
    
    members.forEach(m => {
      if (m.movieVote) {
        votes[m.movieVote] = (votes[m.movieVote] || 0) + 1;
      }
      if (m.availability) {
        m.availability.forEach(slot => {
          avail[slot] = (avail[slot] || 0) + 1;
        });
      }
    });
    
    const topMovieId = Object.keys(votes).sort((a,b) => votes[b] - votes[a])[0];
    const topSlot = Object.keys(avail).sort((a,b) => avail[b] - avail[a])[0];
    
    if (!topMovieId) return res.status(400).json({ message: 'Not enough movie votes' });
    
    const shows = await Show.find({ movie: topMovieId, city: squad.city }).populate('movie').populate('theater');
    
    res.json({
      topSlot,
      topMovieId,
      shows: shows.slice(0, 3)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 8. Host Controls (Cancel, Archive, Delete)
router.post('/:id/cancel', protect, async (req, res) => {
  try {
    const squad = await Squad.findById(req.params.id);
    if (!squad) return res.status(404).json({ message: 'Squad not found' });
    if (squad.hostId.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Not authorized' });
    
    squad.status = 'cancelled';
    await squad.save();
    res.json(squad);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/:id/archive', protect, async (req, res) => {
  try {
    const squad = await Squad.findById(req.params.id);
    if (!squad) return res.status(404).json({ message: 'Squad not found' });
    if (squad.hostId.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Not authorized' });
    
    squad.status = 'archived';
    await squad.save();
    res.json(squad);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    const squad = await Squad.findById(req.params.id);
    if (!squad) return res.status(404).json({ message: 'Squad not found' });
    if (squad.hostId.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Not authorized' });
    
    if (squad.status === 'completed' || squad.bookingRef) {
      return res.status(400).json({ message: 'Cannot delete a squad with a completed booking. Archive it instead.' });
    }
    
    await SquadMember.deleteMany({ squadId: squad._id });
    await Squad.findByIdAndDelete(squad._id);
    res.json({ message: 'Squad deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

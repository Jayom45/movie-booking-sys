import 'dotenv/config';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

const test = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const db = mongoose.connection.useDb('movie_booking');
    const User = db.collection('users');
    const user = await User.findOne({});
    
    if (!user) {
      console.log('No user found in DB');
      process.exit(1);
    }

    const token = jwt.sign({ id: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: '1h' });
    
    console.log('Login successful with user', user.email);
    
    const aiRes = await fetch('http://localhost:5000/api/ai/concierge', { 
      method: 'POST', 
      headers: { 
        'Content-Type': 'application/json', 
        Authorization: `Bearer ${token}` 
      }, 
      body: JSON.stringify({ prompt: 'Recommend an action movie' }) 
    });
    
    const aiData = await aiRes.json();
    console.log('AI Response:', aiData);
  } catch(err) {
    console.error(err);
  } finally {
    mongoose.connection.close();
  }
};

test();

// server.js
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const twilio = require('twilio');

dotenv.config();
const app = express();
app.use(cors());
app.use(bodyParser.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));

// Twilio Client Setup
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Define User Schema
const userSchema = new mongoose.Schema({
  name: String,
  phoneNumber: String,
  emergencyContact: String,
  location: String,
  timestamp: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Panic Alert Endpoint
app.post('/api/panic', async (req, res) => {
  const { name, phoneNumber, emergencyContact, location } = req.body;

  // Send SMS using Twilio
  try {
    await client.messages.create({
      body: `SOS Alert! ${name} needs assistance at ${location}.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: emergencyContact
    });

    // Save user alert data in MongoDB
    const user = new User({ name, phoneNumber, emergencyContact, location });
    await user.save();

    res.status(200).json({ message: 'SOS Alert sent successfully!' });
  } catch (error) {
    res.status(500).json({ message: 'Error sending SOS Alert', error });
  }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

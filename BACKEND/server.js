const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config({ override: true });

const authRouter     = require('./routes/authRouter');
const userRouter     = require('./routes/userRouter');
const leadRouter     = require('./routes/leadRouter');
const customerRouter = require('./routes/customerRouter');
const dealRouter     = require('./routes/dealRouter');
const authMiddleware = require('./middleware/authMiddleware');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.json({ message: 'Mini CRM backend is running.' }));

app.use('/auth',      authRouter);
app.use('/users',     authMiddleware, userRouter);
app.use('/leads',     leadRouter);
app.use('/customers', customerRouter);
app.use('/deals',     dealRouter);

app.use((req, res) => res.status(404).json({ message: 'Route not found.' }));

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    startServer();
  })
  .catch((error) => {
    console.error('❌ MongoDB connection failed');
    console.error(error.message);
  });

const startServer = () => {
  app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
};

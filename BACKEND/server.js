const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config({ override: true });

const authRouter     = require('./routes/authRouter');
const userRouter     = require('./routes/userRouter');
const leadRouter     = require('./routes/leadRouter');
const customerRouter = require('./routes/customerRouter');
const dealRouter     = require('./routes/dealRouter');
const activityRouter = require('./routes/activityRouter');
const taskRouter     = require('./routes/taskRouter');
const reportsRouter  = require('./routes/reportsRouter');
const settingsRouter = require('./routes/settingsRouter');
const authMiddleware = require('./middleware/authMiddleware');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: "6mb" }));

app.get('/', (req, res) => res.json({ message: 'Mini CRM backend is running.' }));

app.use('/auth',      authRouter);
app.use('/users',     authMiddleware, userRouter);
app.use('/leads',       authMiddleware, leadRouter);
app.use('/customers',   authMiddleware, customerRouter);
app.use('/deals',       authMiddleware, dealRouter);
app.use('/activities',  authMiddleware, activityRouter);
app.use('/tasks',       authMiddleware, taskRouter);
app.use('/reports',     authMiddleware, reportsRouter);
app.use('/settings',    authMiddleware, settingsRouter);

app.use((error, req, res, next) => {
  if (error.type === 'entity.too.large') {
    return res.status(413).json({ message: 'Request body is too large. Choose a smaller profile image.' });
  }
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({ message: 'Request body contains invalid JSON.' });
  }
  return next(error);
});

app.use((req, res) => res.status(404).json({ message: 'Route not found.' }));

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    startServer();
  })
  .catch((error) => {
    console.error('❌ MongoDB connection failed');
    console.error(error.message);
  });

const startServer = () => {
  app.listen(PORT, '0.0.0.0');
};

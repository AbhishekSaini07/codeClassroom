const express = require('express');
const cors = require('cors');
const axios = require('axios');
const bodyParser = require('body-parser');
const mongoose = require('./config/db');
const User = require('./services/schemas/user');
const app = express();
const port = 5000;
const nodemailer = require('nodemailer');
const Question = require('./services/schemas/question');
const session = require('express-session');
app.use(
  session({
    secret: 'your-secret-key', // Replace with a strong secret key
  })
);
app.use(cors()); // Enable CORS for all routes
app.use(bodyParser.json());

// Setup Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'abhisheksaini80597@gmail.com', // Replace with your Gmail email address
    pass: 'expg rvfk askj xrzt', // Replace with your Gmail password or an app-specific password
  },
});
app.get('/someRoute', (req, res) => {
  // Do some server-side logic

  // Redirect to a React route
  res.end('/compiler');
});

app.post('/compile', async (req, res) => {
  const { language, code, input} = req.body;

  const options = {
    method: 'POST',
    url: 'https://online-code-compiler.p.rapidapi.com/v1/',
    headers: {
      'content-type': 'application/json',
      'X-RapidAPI-Key': '76ac0a13bbmshdb36497d91e08ebp120f56jsndd2b707f8ac8',
      'X-RapidAPI-Host': 'online-code-compiler.p.rapidapi.com',
    },
    data: {
      language,
      version: 'latest',
      code,
      input,
    },
  };

  try {
    const response = await axios.request(options);
    res.json(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
app.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Check if the user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.json({ success: false, error: 'Email already in use' });
    }

    // Create a new user
    const newUser = new User({ name, email, password });
    await newUser.save();

    res.json({ success: true });
  } catch (error) {
    console.error('Error during signup:', error);
    res.json({ success: false, error: 'An error occurred during signup' });
  }
});
app.post('/forget-password', async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user) {
      // Generate a reset token and set the expiry time (e.g., 1 hour)
      const resetToken = generateRandomToken();
      const resetTokenExpiry = new Date();
      resetTokenExpiry.setHours(resetTokenExpiry.getHours() + 1);

      // Save the reset token and expiry time to the user
      user.resetToken = resetToken;
      user.resetTokenExpiry = resetTokenExpiry;
      await user.save();

      // Send the reset token to the user (e.g., via email or other communication)
      console.log(`Reset token for ${email}: ${resetToken}`);
      const mailOptions = {
        from: 'abhisheksaini80597@gmail.com',
        to: email,
        subject: 'Password Reset',
        text: `Your password reset token is: ${resetToken}`,
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error('Error sending email:', error);
          res.json({ success: false, error: 'Error sending reset token email' });
        } else {
          console.log('Email sent: ' + info.response);
          res.json({ success: true, message: 'Reset token sent successfully' });
        }
      });

      res.json({ success: true, message: 'Reset token sent successfully' });
    } else {
      res.json({ success: false, error: 'User not found' });
    }
  } catch (error) {
    console.error('Error during forget password:', error);
    res.json({ success: false, error: 'An error occurred during forget password' });
  }
});
app.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;
  console.log("stage1");
  try {
    // Find the user by the reset token
    const user = await User.findOne({ resetToken: token, resetTokenExpiry: { $gt: Date.now() } });
    console.log("Stage 2");
    if (user) {
      // Reset the password
      user.password = newPassword;
      user.resetToken = null;
      user.resetTokenExpiry = null;
      await user.save();
      console.log("Stage 3");
      
      res.json({ success: true, message: 'Password reset successfully' });
    } else {
      console.log("Stage false");
      res.json({ success: false, error: 'Invalid or expired reset token' });
    }
  } catch (error) {
    console.error('Error during password reset:', error);
    res.json({ success: false, error: 'An error occurred during password reset' });
  }
});

// Helper function to generate a random token
function generateRandomToken() {
  // Implement your own logic to generate a secure random token
  return Math.random().toString(36).slice(2);
}

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    const user = await User.authenticate(email, password);

    if (user) {
      res.json({ success: true, user: { name: user.name, email: user.email } });
      req.session.email = email; // Store the email in the session
      console.log(req.session.email);
      
      
    } else {
      res.json({ success: false, error: 'Invalid email or password' });

    }
  } catch (error) {
    console.error('Error during login:', error);
    res.json({ success: false, error: 'An error occurred during login' });
  }
});
app.get('/questions', async (req, res) => {
  
  try {
    const questions = await Question.find();
    console.log(questions);
    res.json(questions);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
app.get('/questions/:id', async (req, res) => {
  
  const questionId = parseInt(req.params.id);
  try {
    const question = await Question.findOne({ id: questionId });
    if (question) {
      const formattedQuestion = {
        id: question.id,
        title: question.title,
        difficulty: question.difficulty,
        tags: question.tags,
        problem_statement: question.problem_statement,
        input_format: question.input_format,
        output_format: question.output_format,
        constraints: question.constraints,
        sample_testcases: question.sample_testcases,
        hidden_testcases: question.hidden_testcases,
      };
  
      res.json(formattedQuestion);
    } else {
      res.status(404).json({ error: 'Question not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

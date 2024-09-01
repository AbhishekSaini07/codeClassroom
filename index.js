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
const MongoStore = require('connect-mongo');
const ejs = require('ejs');
const { system } = require('nodemon/lib/config');

app.use(cors(
  {origin: 'http://localhost:3000', // Replace with your React app's URL
credentials: true,})); // Enable CORS for all routes
app.use(bodyParser.json());
// Mapping of languages to file extensions
const languageToFileExtension = {
  python: 'py',
  javascript: 'js',
  java: 'java',
  c: 'c',
  cpp: 'cpp',
  ruby: 'rb',
  go: 'go',
  php: 'php',
  // Add more languages and their extensions as needed
};

const isAuth = (req, res, next) => {
  const user = req.session.user;

  if (user) {
    console.log("auth");
      next();
    } else {
      // Invalid session, destroy it
      console.log("not auth");
      req.session.destroy();
      
      res.status(401).json({ success: false, message: 'Unauthorized' });
    }
};

app.use(session({
  secret: "mysecret",
  resave: false,
  saveUninitialized: true,  
  

  cookie: {
    maxAge: (1000 * 60 * 10),
    
  },
  store: new MongoStore({
    mongoUrl: 'mongodb+srv://AbhishekDb:Abhishek@cluster0.bm2nmnb.mongodb.net/codeclassroom', // Replace with your actual MongoDB connection string
    collection: 'sessions',
    ttl: 1000 * 60* 10, // Time-to-live for sessions in seconds (optional)
  }),
}));
// Setup Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'abhisheksaini80597@gmail.com', // Replace with your Gmail email address
    pass: 'expg rvfk askj xrzt', // Replace with your Gmail password or an app-specific password
  },
});

app.use((req, res, next) => {
  req.session.browserDetails = {
    userAgent: req.headers['user-agent'],
    ipAddress: req.ip,
  };
  next();
});
app.get('/someRoute', (req, res) => {
  // Do some server-side logic

  // Redirect to a React route
  res.end('/compiler');
});
app.get("/myfile",(req,res) => {
  console.log("Sending to myfile.ejs");
  res.render('myfile',{name: "Abhishek", age:19, profile: "Student"});

});
app.get('/logout',async(req,res)=>{
  req.session.destroy();
  res.json({ success: true});
});
app.post('/newCompile', isAuth, async (req, res) => { // New compile code endpoint
  const { language, code, input } = req.body;
  console.log(language+ "\n code is: "+  code + "\n input is:" + input);


  // Determine the file extension based on the language
  const fileExtension = languageToFileExtension[language] || 'txt'; // Default to 'txt' if the language is not in the mapping
  const fileName = `index.${fileExtension}`;
  console.log(fileName);

  const options = {
    method: 'POST',
    url: 'https://onecompiler-apis.p.rapidapi.com/api/v1/run',
    headers: {
      'x-rapidapi-key': '6ae6c279ecmsh1aaccd21ed7fc67p104f29jsn37ebb2aa65c7',
      'x-rapidapi-host': 'onecompiler-apis.p.rapidapi.com',
      'Content-Type': 'application/json'
    },
    data: {
      language: language || 'python', // Defaulting to 'python' if not provided
      stdin: input || '', // Input provided by the user
      files: [
        {
          name: fileName, // Dynamic file name based on language
          content: code // User's code
        }
      ]
    }
  };

  try {
    const response = await axios.request(options);
    console.log(response.data.stdout);
    res.json(response.data.stdout); // Sending the response data back to the client
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
app.post('/compile',isAuth, async (req, res) => {   // compile code
  const { language, code, input} = req.body;
  console.log(code);
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
    console.log(response);
    res.json(response.data);
  } catch (error) {
    console.error(error);
    console.log(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
app.post('/signup', async (req, res) => {  // signup
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
    req.session.user = { email: newUser.email,};
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
  
  console.log("Hello");
  try {
    const user = await User.authenticate(email, password);
    
    if (user) {
     
      req.session.user = { email: user.email, /* other user data */ };
      console.log(req.session.user);
      res.json({ success: true, user: { name: user.name, email: user.email } });
     
      
      
    } else {
      

      res.json({ success: false, error: 'Invalid email or password' });

    }
  } catch (error) {
    console.error('Error during login:', error);
    res.json({ success: false, error: 'An error occurred during login' });
  }
});
// app.get('/questions', isAuth,async (req, res) => {
//   if(req.session.viewCount){
//   req.session.viewCount = req.session.viewCount+1;}
//   else{
//     req.session.viewCount =1;
//   }
//   try {
//     const questions = await Question.find();
//     res.json(questions);
//   } catch (error) {
//     res.status(500).json({ error: 'Internal Server Error' });
//   }
// });
app.get('/questions', isAuth, async (req, res) => {
  try {
    // Extract search parameters from query string
    const { difficulty, title, tags } = req.query;
    console.log(difficulty);
    console.log(title);
    console.log(tags);

    const searchCriteria = {};

    // Add search criteria based on parameters
    if (difficulty) {
      searchCriteria.difficulty = difficulty;
      console.log("done");
      console.log(searchCriteria);
    }

    if (title) {
      // Use case-insensitive regex for partial matching
      searchCriteria.title = new RegExp(title, 'i');
      console.log(searchCriteria);
    }

    if (tags) {
      // If tags is an array, use it directly
      searchCriteria.tags = tags;
      console.log(searchCriteria);
    }

    // Find questions based on search criteria
    const questions = await Question.find(searchCriteria);

    res.json(questions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/questions/:id',isAuth, async (req, res) => {
 
  const questionId = parseInt(req.params.id);
  try {
    const question = await Question.findOne({ id: questionId });
    if (question) {
      // console.log(question);
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

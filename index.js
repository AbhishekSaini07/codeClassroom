const express = require('express');
const cors = require('cors');
const axios = require('axios');
const bodyParser = require('body-parser');

const app = express();
const port = 5000;

app.use(cors()); // Enable CORS for all routes
app.use(bodyParser.json());

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

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

// Import necessary modules
const express = require('express');
const axios = require('axios');

// Create an instance of Express
const app = express();
const PORT = 9876;

// Middleware to parse JSON bodies
app.use(express.json());

// Store for keeping track of numbers
let numbers = [];

// Function to fetch numbers from the test server with retries
const fetchNumbersWithRetries = async (type, maxRetries = 3) => {
  let retries = 0;
  while (retries < maxRetries) {
    try {
      const response = await axios.get(`http://20.244.56.144/test/${type}`);
      return response.data.numbers;
    } catch (error) {
      console.error(`Error fetching numbers for ${type}: ${error.message}`);
      retries++;
    }
  }
  return [];
};

// Function to calculate average of numbers
const calculateAverage = (nums) => {
  const sum = nums.reduce((acc, curr) => acc + curr, 0);
  return sum / nums.length || 0;
};

// Route handler for /numbers/:numberid endpoint
app.get('/numbers/:numberid', async (req, res) => {
  const { numberid } = req.params;

  // Check if numberid is valid
  const validIds = ['p', 'f', 'e', 'r'];
  if (!validIds.includes(numberid)) {
    return res.status(400).json({ error: 'Invalid numberid' });
  }

  // Fetch numbers from test server with retries
  const fetchedNumbers = await fetchNumbersWithRetries(numberid);
  if (fetchedNumbers.length === 0) {
    return res.status(500).json({ error: 'Failed to fetch numbers' });
  }

  // Update numbers array with fetched numbers
  numbers = [...numbers, ...fetchedNumbers];
  
  // Remove duplicates and limit to window size
  numbers = [...new Set(numbers)].slice(-10);

  // Calculate average of current window numbers
  const avg = calculateAverage(numbers);

  // Prepare response
  const response = {
    numbers: fetchedNumbers,
    windowPrevState: [], // Assuming there's no previous state stored in the server
    windowCurrState: numbers,
    avg: avg.toFixed(2)
  };

  res.json(response);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

import express from 'express';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
require('dotenv').config();

const router = express.Router();

// Verify API key is set
if (!process.env.GEMINI_API_KEY) {
  console.error('Error: GEMINI_API_KEY is not set in environment variables');
  process.exit(1);
}

// Initialize Gemini with safety settings
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Safety settings
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
];

// List available models
async function listModels() {
  try {
    // For debugging purposes
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    console.log('Available model:', model);
    return true;
  } catch (error) {
    console.error('Error listing models:', error);
    return false;
  }
}

// Add rate limiting
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 2000; // 2 seconds between requests

const SYSTEM_PROMPT = `You are a code generation agent that outputs multi-file scaffolds for automation workflows.

Your response must follow this exact format:

- Each file starts with a line like: \`// File: path/to/file.ext\`
- Immediately below that line, include the full contents of the file.
- Do not include Markdown formatting, headings, code fences, or explanations.
- Do not wrap code in triple backticks.
- Separate each file block with a newline.
- Only include essential files required to run the project.

Example:

// File: client/index.js
import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
ReactDOM.render(<App />, document.getElementById("root"));

// File: server/index.js
const express = require("express");
const app = express();
app.listen(5000, () => console.log("Server running"));

Now generate a minimal scaffold with the following requirements:
`;

router.post('/generate', async (req, res) => {
  const { featureName, description, techStack } = req.body;

  // Basic rate limiting
  const now = Date.now();
  if (now - lastRequestTime < MIN_REQUEST_INTERVAL) {
    return res.status(429).json({
      success: false,
      error: 'Please wait a few seconds before making another request'
    });
  }
  lastRequestTime = now;

  try {
    console.log('Making request to Gemini API...');
    console.log('Using API key:', process.env.GEMINI_API_KEY ? '***' + process.env.GEMINI_API_KEY.slice(-4) : 'Not set');
    
    // Check if models are available
    const modelsAvailable = await listModels();
    if (!modelsAvailable) {
      throw new Error('Failed to initialize Gemini models');
    }

    // Initialize the model with safety settings
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      safetySettings,
    });
    console.log('Model initialized successfully');

    // Construct the prompt
    const promptText = `${SYSTEM_PROMPT}
Name: ${featureName}
Description: ${description}
Tech Stack: ${techStack}

Return only the code blocks in the specified format. Do not include any Markdown, explanations, or headings.`;

    // Generate content using a simpler approach
    const result = await model.generateContent(promptText);
    
    // Wait for the response to be ready
    const response = await result.response;
    
    // Check if response is blocked
    if (response.promptFeedback?.blockReason) {
      return res.status(400).json({
        success: false,
        error: 'Content blocked by Gemini safety settings',
        details: response.promptFeedback
      });
    }

    const generatedCode = await response.text();

    // Validate generated content
    if (!generatedCode || generatedCode.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Generated content is empty',
        details: 'The model returned an empty response'
      });
    }

    if (!generatedCode.includes('// File:')) {
      return res.status(400).json({
        success: false,
        error: 'Generated content does not follow expected file format',
        preview: generatedCode.slice(0, 500)
      });
    }

    console.log('Successfully received response from Gemini');
    res.json({
      success: true,
      generatedCode,
      metadata: {
        featureName,
        description,
        techStack
      }
    });
  } catch (error: any) {
    console.error('Gemini API error details:', {
      message: error.message,
      status: error.status,
      statusText: error.statusText,
      details: error.errorDetails
    });

    // Handle specific error cases
    if (error.status === 429) {
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded. Please try again in a few seconds.',
        details: error.message
      });
    } else if (error.status === 401) {
      return res.status(401).json({
        success: false,
        error: 'Invalid API key. Please check your Gemini API key.',
        details: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to generate code scaffold',
      details: error.message
    });
  }
});

export default router;
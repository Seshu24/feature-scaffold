import express from 'express';
import { Configuration, OpenAIApi } from 'openai';

const router = express.Router();

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY || 'your-api-key-here',
});

const openai = new OpenAIApi(configuration);

const SYSTEM_PROMPT = `You are an expert developer assistant that generates feature boilerplate code.
Given a feature name, description, and tech stack, generate the initial code scaffold for the feature.
Focus on creating a clean, well-structured foundation that follows best practices.`;

router.post('/generate', async (req, res) => {
  const { featureName, description, techStack } = req.body;

  try {
    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Generate a code scaffold for:
Feature Name: ${featureName}
Description: ${description}
Tech Stack: ${techStack}

Please provide the initial code structure and key files needed to implement this feature.` }
      ],
      temperature: 0.7,
    });

    const generatedCode = completion.data.choices[0]?.message?.content || '';

    res.json({
      success: true,
      generatedCode,
      metadata: {
        featureName,
        description,
        techStack
      }
    });
  } catch (error) {
    console.error('OpenAI API error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate code scaffold'
    });
  }
});

export default router;
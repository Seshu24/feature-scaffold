import express from 'express';
import cors from 'cors';
import geminiRouter from './routes/gemini';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// OpenAI route for code generation
app.use('/api/gemini', geminiRouter);

// Feature scaffold endpoint
app.post('/api/scaffold', async (req, res) => {
  const { featureName, description, techStack, generatedCode } = req.body;
  
  try {
    // Send to n8n webhook to create PR
    const n8nResponse = await fetch('http://localhost:5678/webhook-test/create-pr', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        repository: {
          owner: 'Seshu24',
          name: 'feature-scaffold'
        },
        featureName,
        description,
        techStack,
        generatedCode
      })
    });

    const n8nResult = await n8nResponse.json();

    res.json({
      success: true,
      feature: {
        name: featureName,
        description,
        techStack,
        prDetails: n8nResult
      }
    });
  } catch (error) {
    console.error('Error creating PR:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create PR'
    });
  }
});

app.listen(port, () => {
  console.log(`Backend server running on port ${port}`);
});
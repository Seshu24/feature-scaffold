import React, { useState, ChangeEvent } from 'react';

interface FeatureFormData {
  featureName: string;
  description: string;
  techStack: string;
}

function FeatureForm() {
  const [formData, setFormData] = useState<FeatureFormData>({
    featureName: '',
    description: '',
    techStack: ''
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    try {
      // First, generate code using OpenAI
      const geminiResponse = await fetch('http://localhost:3001/api/gemini/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const geminiData = await geminiResponse.json();
      
      if (!geminiData.success) {
        throw new Error('Failed to generate code');
      }

      // Then, create the scaffold with the generated code
      const scaffoldResponse = await fetch('http://localhost:3001/api/scaffold', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          generatedCode: geminiData.generatedCode
        }),
      });

      const scaffoldData = await scaffoldResponse.json();
      console.log('Scaffold response:', scaffoldData);
      // TODO: Handle the response - will be updated when we add n8n workflow
    } catch (error) {
      console.error('Error generating scaffold:', error);
    }
  };

  return (
    <div className="feature-form">
      <h2>Feature Scaffold Generator</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="featureName">Feature Name:</label>
          <input
            type="text"
            id="featureName"
            value={formData.featureName}
            onChange={(e) => setFormData({...formData, featureName: e.target.value})}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description:</label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="techStack">Tech Stack:</label>
          <input
            type="text"
            id="techStack"
            value={formData.techStack}
            placeholder="e.g. Node + Express"
            onChange={(e) => setFormData({...formData, techStack: e.target.value})}
            required
          />
        </div>

        <button type="submit">Generate Scaffold</button>
      </form>
    </div>
  );
}

export default FeatureForm;
const { OpenAI } = require('openai');

exports.analyzeReport = async (req, res) => {
  try {
    const { mcqAssessments, applicantName, jobTitle } = req.body;
    
    if (!mcqAssessments || !Array.isArray(mcqAssessments)) {
      return res.status(400).json({ success: false, message: 'Invalid assessments data' });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ success: false, message: 'OpenAI API key is missing' });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const prompt = `You are an expert technical interviewer evaluating a candidate${applicantName ? ` named ${applicantName}` : ''}${jobTitle ? ` for the position of ${jobTitle}` : ''}.
Below is a list of multiple-choice questions they answered, whether they got it right (isCorrect), and the evaluator's comments for each.

Based ONLY on this information, generate a comprehensive interview report matching this exact JSON schema:
{
  "overallRating": Number (1-10, be realistic based on the number of correct vs incorrect and comments),
  "headline": String (A short 5-8 word summary of the candidate's performance),
  "summary": String (A detailed 3-5 sentence paragraph summarizing their strengths, weaknesses, and overall performance. IMPORTANT: Write this as a professional human evaluator assessing their actual knowledge. Do NOT use robotic phrases like "They correctly answered multiple-choice questions" or "missed questions on". Instead, evaluate their competency directly, e.g., "Demonstrated strong knowledge of React but showed gaps in understanding microservices."),
  "sections": [
    { "title": "Communication", "rating": Number (1-5), "notes": String (short note) },
    { "title": "Technical Skills", "rating": Number (1-5), "notes": String (short note) },
    { "title": "Problem Solving", "rating": Number (1-5), "notes": String (short note) },
    { "title": "Attitude", "rating": Number (1-5), "notes": String (short note) }
  ],
  "pros": [String, String, ...] (3-5 strengths),
  "cons": [String, String, ...] (2-4 weaknesses or areas of improvement),
  "improvementTips": [
    { "area": String, "tip": String }
  ]
}

If there are no assessments provided, return a neutral default report.

Assessments Data:
${JSON.stringify(mcqAssessments, null, 2)}
`;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo-0125',
      messages: [{ role: 'system', content: 'You are an AI assistant specialized in analyzing interview performance and generating JSON reports.' }, { role: 'user', content: prompt }],
      temperature: 0.7,
      response_format: { type: 'json_object' }
    });

    let aiReport;
    try {
      aiReport = JSON.parse(response.choices[0].message.content);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError);
      return res.status(500).json({ success: false, message: 'Failed to parse AI response' });
    }

    res.status(200).json({ success: true, data: aiReport });
  } catch (error) {
    console.error('Error analyzing report:', error);
    res.status(500).json({ success: false, message: error.message || 'Error communicating with AI' });
  }
};

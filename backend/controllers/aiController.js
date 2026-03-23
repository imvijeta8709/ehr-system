const { analyzeSymptoms } = require('../utils/symptomEngine');

exports.suggestConditions = async (req, res) => {
  try {
    const { symptoms } = req.body;
    if (!symptoms || !symptoms.trim())
      return res.status(400).json({ success: false, message: 'symptoms text is required' });

    const suggestions = analyzeSymptoms(symptoms);
    res.json({ success: true, suggestions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

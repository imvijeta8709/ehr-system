/**
 * Rule-based symptom → condition suggestion engine.
 * Each condition has:
 *   - symptoms: keywords to match (any match scores +1)
 *   - required: at least one of these must match for condition to appear
 *   - urgency: 'low' | 'medium' | 'high' | 'emergency'
 *   - specialty: suggested specialist
 *   - recommendations: actionable advice
 *   - description: brief explanation
 */

const CONDITIONS = [
  {
    name: 'Common Cold',
    symptoms: ['runny nose', 'sneezing', 'sore throat', 'cough', 'congestion', 'mild fever', 'fatigue', 'nasal', 'blocked nose'],
    required: ['runny nose', 'sneezing', 'congestion', 'nasal'],
    urgency: 'low',
    specialty: 'General Physician',
    description: 'Viral upper respiratory tract infection.',
    recommendations: ['Rest and stay hydrated', 'Over-the-counter decongestants', 'Saline nasal spray', 'Consult doctor if symptoms persist > 10 days'],
  },
  {
    name: 'Influenza (Flu)',
    symptoms: ['high fever', 'fever', 'body ache', 'muscle pain', 'headache', 'fatigue', 'chills', 'cough', 'sore throat', 'weakness'],
    required: ['fever', 'high fever', 'body ache', 'muscle pain', 'chills'],
    urgency: 'medium',
    specialty: 'General Physician',
    description: 'Contagious respiratory illness caused by influenza viruses.',
    recommendations: ['Rest and isolate', 'Antipyretics for fever', 'Antiviral medication if within 48h of onset', 'Seek care if breathing difficulty develops'],
  },
  {
    name: 'COVID-19',
    symptoms: ['fever', 'cough', 'shortness of breath', 'loss of smell', 'loss of taste', 'fatigue', 'body ache', 'sore throat', 'headache', 'diarrhea'],
    required: ['loss of smell', 'loss of taste', 'shortness of breath'],
    urgency: 'high',
    specialty: 'Infectious Disease / General Physician',
    description: 'Respiratory illness caused by SARS-CoV-2.',
    recommendations: ['Get tested immediately', 'Isolate from others', 'Monitor oxygen levels', 'Seek emergency care if SpO2 < 94%'],
  },
  {
    name: 'Hypertension',
    symptoms: ['headache', 'dizziness', 'blurred vision', 'chest pain', 'shortness of breath', 'nosebleed', 'palpitations', 'neck pain'],
    required: ['headache', 'dizziness', 'blurred vision', 'nosebleed'],
    urgency: 'medium',
    specialty: 'Cardiologist',
    description: 'Persistently elevated blood pressure.',
    recommendations: ['Check blood pressure immediately', 'Reduce salt intake', 'Avoid stress', 'Consult cardiologist for medication'],
  },
  {
    name: 'Diabetes (Type 2)',
    symptoms: ['frequent urination', 'excessive thirst', 'fatigue', 'blurred vision', 'slow healing', 'weight loss', 'numbness', 'tingling', 'hunger'],
    required: ['frequent urination', 'excessive thirst'],
    urgency: 'medium',
    specialty: 'Endocrinologist',
    description: 'Metabolic disorder with high blood sugar levels.',
    recommendations: ['Check fasting blood glucose', 'Reduce sugar and refined carbs', 'Regular exercise', 'Consult endocrinologist'],
  },
  {
    name: 'Migraine',
    symptoms: ['severe headache', 'headache', 'nausea', 'vomiting', 'light sensitivity', 'sound sensitivity', 'aura', 'throbbing', 'one-sided headache'],
    required: ['severe headache', 'throbbing', 'one-sided headache', 'aura'],
    urgency: 'medium',
    specialty: 'Neurologist',
    description: 'Recurrent severe headaches often with nausea and light sensitivity.',
    recommendations: ['Rest in a dark quiet room', 'Triptans or OTC pain relievers', 'Identify and avoid triggers', 'Consult neurologist for preventive therapy'],
  },
  {
    name: 'Gastroenteritis',
    symptoms: ['nausea', 'vomiting', 'diarrhea', 'stomach pain', 'abdominal cramps', 'fever', 'loss of appetite', 'bloating'],
    required: ['nausea', 'vomiting', 'diarrhea', 'stomach pain', 'abdominal cramps'],
    urgency: 'medium',
    specialty: 'Gastroenterologist',
    description: 'Inflammation of the stomach and intestines, usually from infection.',
    recommendations: ['Stay hydrated with ORS', 'Avoid solid food initially', 'BRAT diet (banana, rice, applesauce, toast)', 'Seek care if dehydration signs appear'],
  },
  {
    name: 'Urinary Tract Infection (UTI)',
    symptoms: ['burning urination', 'frequent urination', 'cloudy urine', 'blood in urine', 'pelvic pain', 'lower back pain', 'urgency to urinate', 'foul smell urine'],
    required: ['burning urination', 'cloudy urine', 'blood in urine', 'urgency to urinate'],
    urgency: 'medium',
    specialty: 'Urologist / General Physician',
    description: 'Bacterial infection of the urinary tract.',
    recommendations: ['Drink plenty of water', 'Urine culture test', 'Antibiotics as prescribed', 'Avoid holding urine'],
  },
  {
    name: 'Asthma',
    symptoms: ['wheezing', 'shortness of breath', 'chest tightness', 'cough', 'breathlessness', 'difficulty breathing', 'night cough'],
    required: ['wheezing', 'shortness of breath', 'chest tightness', 'breathlessness'],
    urgency: 'high',
    specialty: 'Pulmonologist',
    description: 'Chronic inflammatory disease of the airways.',
    recommendations: ['Use prescribed inhaler', 'Avoid triggers (dust, smoke, allergens)', 'Pulmonologist consultation', 'Emergency care if severe attack'],
  },
  {
    name: 'Anemia',
    symptoms: ['fatigue', 'weakness', 'pale skin', 'shortness of breath', 'dizziness', 'cold hands', 'cold feet', 'headache', 'chest pain', 'brittle nails'],
    required: ['pale skin', 'fatigue', 'weakness', 'cold hands', 'brittle nails'],
    urgency: 'medium',
    specialty: 'Hematologist',
    description: 'Deficiency of red blood cells or hemoglobin.',
    recommendations: ['Complete blood count (CBC) test', 'Iron-rich diet (spinach, lentils, meat)', 'Iron supplements if prescribed', 'Identify underlying cause'],
  },
  {
    name: 'Appendicitis',
    symptoms: ['right lower abdominal pain', 'nausea', 'vomiting', 'fever', 'loss of appetite', 'abdominal pain', 'rebound tenderness'],
    required: ['right lower abdominal pain', 'rebound tenderness'],
    urgency: 'emergency',
    specialty: 'General Surgeon',
    description: 'Inflammation of the appendix — requires urgent surgical evaluation.',
    recommendations: ['Go to emergency immediately', 'Do not eat or drink', 'Surgical consultation required', 'Do not take painkillers before diagnosis'],
  },
  {
    name: 'Heart Attack (Myocardial Infarction)',
    symptoms: ['chest pain', 'chest pressure', 'left arm pain', 'jaw pain', 'shortness of breath', 'sweating', 'nausea', 'dizziness', 'palpitations'],
    required: ['chest pain', 'chest pressure', 'left arm pain'],
    urgency: 'emergency',
    specialty: 'Cardiologist',
    description: 'Blockage of blood flow to the heart muscle.',
    recommendations: ['Call emergency services immediately (112/911)', 'Chew aspirin if not allergic', 'Do not drive yourself', 'ECG and troponin test needed'],
  },
  {
    name: 'Dengue Fever',
    symptoms: ['high fever', 'severe headache', 'eye pain', 'joint pain', 'muscle pain', 'rash', 'nausea', 'vomiting', 'fatigue', 'bleeding gums'],
    required: ['high fever', 'rash', 'eye pain', 'joint pain', 'bleeding gums'],
    urgency: 'high',
    specialty: 'Infectious Disease Specialist',
    description: 'Mosquito-borne viral infection.',
    recommendations: ['Dengue NS1 antigen test', 'Monitor platelet count daily', 'Stay hydrated', 'Avoid aspirin/ibuprofen — use paracetamol only'],
  },
  {
    name: 'Malaria',
    symptoms: ['cyclical fever', 'chills', 'sweating', 'headache', 'nausea', 'vomiting', 'muscle pain', 'fatigue', 'high fever'],
    required: ['cyclical fever', 'chills', 'sweating'],
    urgency: 'high',
    specialty: 'Infectious Disease Specialist',
    description: 'Parasitic infection transmitted by Anopheles mosquitoes.',
    recommendations: ['Malaria rapid diagnostic test (RDT)', 'Blood smear test', 'Antimalarial medication as prescribed', 'Seek care immediately'],
  },
  {
    name: 'Hypothyroidism',
    symptoms: ['fatigue', 'weight gain', 'cold intolerance', 'constipation', 'dry skin', 'hair loss', 'depression', 'slow heart rate', 'muscle weakness', 'puffy face'],
    required: ['weight gain', 'cold intolerance', 'hair loss', 'puffy face'],
    urgency: 'low',
    specialty: 'Endocrinologist',
    description: 'Underactive thyroid gland producing insufficient hormones.',
    recommendations: ['TSH blood test', 'T3/T4 levels check', 'Thyroid hormone replacement therapy', 'Regular monitoring'],
  },
  {
    name: 'Pneumonia',
    symptoms: ['cough', 'fever', 'chills', 'shortness of breath', 'chest pain', 'fatigue', 'phlegm', 'sweating', 'nausea', 'confusion'],
    required: ['cough', 'fever', 'shortness of breath', 'phlegm'],
    urgency: 'high',
    specialty: 'Pulmonologist',
    description: 'Infection causing inflammation in the air sacs of the lungs.',
    recommendations: ['Chest X-ray required', 'Sputum culture', 'Antibiotics as prescribed', 'Hospitalization if SpO2 < 94%'],
  },
  {
    name: 'Acid Reflux / GERD',
    symptoms: ['heartburn', 'acid reflux', 'chest burning', 'regurgitation', 'sour taste', 'difficulty swallowing', 'bloating', 'nausea', 'cough after eating'],
    required: ['heartburn', 'acid reflux', 'chest burning', 'regurgitation', 'sour taste'],
    urgency: 'low',
    specialty: 'Gastroenterologist',
    description: 'Stomach acid frequently flows back into the esophagus.',
    recommendations: ['Avoid spicy, fatty, acidic foods', 'Eat smaller meals', 'Antacids or PPIs as prescribed', 'Elevate head while sleeping'],
  },
  {
    name: 'Anxiety Disorder',
    symptoms: ['anxiety', 'worry', 'restlessness', 'palpitations', 'sweating', 'trembling', 'shortness of breath', 'insomnia', 'irritability', 'concentration difficulty'],
    required: ['anxiety', 'worry', 'restlessness', 'palpitations'],
    urgency: 'low',
    specialty: 'Psychiatrist / Psychologist',
    description: 'Excessive and persistent worry affecting daily functioning.',
    recommendations: ['Mindfulness and breathing exercises', 'Reduce caffeine', 'Cognitive behavioral therapy (CBT)', 'Consult psychiatrist if severe'],
  },
  {
    name: 'Kidney Stones',
    symptoms: ['severe back pain', 'flank pain', 'blood in urine', 'nausea', 'vomiting', 'frequent urination', 'painful urination', 'groin pain'],
    required: ['severe back pain', 'flank pain', 'blood in urine', 'groin pain'],
    urgency: 'high',
    specialty: 'Urologist',
    description: 'Hard mineral deposits forming in the kidneys.',
    recommendations: ['Ultrasound or CT scan of abdomen', 'Drink 2-3 liters of water daily', 'Pain management', 'Urologist consultation for large stones'],
  },
  {
    name: 'Chickenpox',
    symptoms: ['itchy rash', 'blisters', 'fever', 'fatigue', 'loss of appetite', 'headache', 'spots', 'red spots'],
    required: ['itchy rash', 'blisters', 'spots', 'red spots'],
    urgency: 'medium',
    specialty: 'Dermatologist / General Physician',
    description: 'Highly contagious viral infection causing itchy blister-like rash.',
    recommendations: ['Isolate to prevent spread', 'Calamine lotion for itching', 'Avoid scratching', 'Antiviral medication if severe'],
  },
];

/**
 * Analyze symptoms text and return ranked condition suggestions.
 * @param {string} symptomsText - free text or comma-separated symptoms
 * @returns {Array} sorted suggestions with score, urgency, recommendations
 */
function analyzeSymptoms(symptomsText) {
  if (!symptomsText || !symptomsText.trim()) return [];

  const input = symptomsText.toLowerCase();

  const results = [];

  for (const condition of CONDITIONS) {
    // Check if at least one required keyword matches
    const hasRequired = condition.required.some(req => input.includes(req));
    if (!hasRequired) continue;

    // Count total symptom matches
    const matchedSymptoms = condition.symptoms.filter(s => input.includes(s));
    if (matchedSymptoms.length === 0) continue;

    const score = Math.round((matchedSymptoms.length / condition.symptoms.length) * 100);

    results.push({
      name: condition.name,
      score,
      matchedSymptoms,
      urgency: condition.urgency,
      specialty: condition.specialty,
      description: condition.description,
      recommendations: condition.recommendations,
    });
  }

  // Sort by urgency weight first, then score
  const urgencyWeight = { emergency: 4, high: 3, medium: 2, low: 1 };
  results.sort((a, b) => {
    const urgDiff = urgencyWeight[b.urgency] - urgencyWeight[a.urgency];
    return urgDiff !== 0 ? urgDiff : b.score - a.score;
  });

  return results.slice(0, 5); // top 5
}

module.exports = { analyzeSymptoms };

import { GoogleGenAI } from '@google/genai';

let ai: GoogleGenAI | null = null;
try {
  const key = process.env.GEMINI_API_KEY;
  if (key) {
    ai = new GoogleGenAI({ apiKey: key });
  } else {
    console.warn('Gemini API key is missing. AI fact generation will be unavailable.');
  }
} catch (e) {
  console.warn('Failed to initialize Gemini AI client:', e);
}

export async function getPlanetFact(planetName: string): Promise<string> {
  if (!ai) {
    return 'სისტემური შეცდომა: Gemini API გასაღები (GEMINI_API_KEY) არ არის მითითებული (.env ფაილში ან გარემოს ცვლადებში).';
  }
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `შენ ხარ პროფესიონალი ასტროფიზიკოსი. მოუყევი ზრდასრულ ადამიანს დეტალური, საინტერესო, დამაფიქრებელი ან ცოტა მისტიკური სამეცნიერო ფაქტები ${planetName}-ის შესახებ. 
      გამოიყენე დახვეწილი, აკადემიური, მაგრამ გასაგები ენა.
      პასუხი უნდა იყოს ქართულ ენაზე, ვრცელი და ამომწურავი, დაახლოებით 2-3 აბზაცი. ისაუბრე მის შემადგენლობაზე, ატმოსფეროსა და კოსმოსის ამოუცნობ ბუნებაზე.`,
    });
    return response.text || 'კავშირი დაიკარგა... სცადეთ ხელახლა.';
  } catch (error) {
    console.error('AI Error:', error);
    return 'სისტემური შეცდომა. მონაცემების მიღება ვერ მოხერხდა.';
  }
}

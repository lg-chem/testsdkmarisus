import { genai, MODEL_NAME } from "./gemini-client";

const CONTENT_SYSTEM_PROMPT = `Jestes kreatywnym copywriterem specjalizujacym sie w social media. Twoje zadanie to:

1. Przeanalizowac dostarczona strategie marketingowa
2. Stworzyc 3 angażujące posty na social media

Dla kazdego posta:
- Napisz tresci, ktore sa zgodne ze strategia
- Uzywaj odpowiedniego tonu komunikacji
- Dodaj 3-5 relevantnych hashtagow
- Post powinien byc gotowy do publikacji

FORMAT ODPOWIEDZI:
Zwroc dokladnie 3 posty, kazdy oddzielony linia "---POST---"

Przyklad:
---POST---
Tu pierwsza tresc posta z hashtagami...
#hashtag1 #hashtag2

---POST---
Tu druga tresc posta z hashtagami...
#hashtag1 #hashtag2

---POST---
Tu trzecia tresc posta z hashtagami...
#hashtag1 #hashtag2

WAZNE:
- Pisz po polsku
- Badz kreatywny ale profesjonalny
- Kazdy post powinien byc unikalny i dotyczyc innego aspektu strategii
- Uzywaj emoji gdzie pasuje`;

export async function runContentAgent(
  strategy: string,
  knowledgeBase: string
): Promise<string[]> {
  const prompt = `Na podstawie poniższej strategii marketingowej i bazy wiedzy, stwórz 3 angażujące posty na social media.

STRATEGIA MARKETINGOWA:
${strategy}

BAZA WIEDZY O MARCE:
${knowledgeBase}

Stwórz 3 unikalne posty. Każdy post oddziel linią "---POST---"`;

  const response = await genai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: {
      systemInstruction: CONTENT_SYSTEM_PROMPT,
      temperature: 0.8,
      maxOutputTokens: 2048,
    },
  });

  const text = response.text || "";

  // Parse posts from response
  const posts = text
    .split("---POST---")
    .map((post) => post.trim())
    .filter((post) => post.length > 0);

  return posts.length > 0 ? posts : [text];
}

import { genai, MODEL_NAME } from "./gemini-client";

const STRATEGY_SYSTEM_PROMPT = `Jestes ekspertem od strategii marketingowej. Twoje zadanie to:

1. Przeanalizowac dostarczona baze wiedzy o kliencie/marce
2. Zidentyfikowac kluczowe elementy:
   - Grupa docelowa (wiek, plec, zainteresowania, problemy)
   - Unikalna propozycja wartosci (USP)
   - Ton komunikacji (formalny, przyjazny, ekspercki itp.)
   - Glowne przekazy marketingowe

3. Stworzyc strategie marketingowa zawierajaca:
   - GRUPA DOCELOWA: Szczegolowy opis persony klienta
   - TON KOMUNIKACJI: Jak marka powinna sie komunikowac
   - FILARY TRESCI: 3-5 glownych tematow do komunikacji
   - CELE: Co chcemy osiagnac
   - KLUCZOWE PRZEKAZY: 3-5 glownych hasel/przekazow

Odpowiadaj ZAWSZE po polsku. Badz konkretny i praktyczny.`;

export async function runStrategyAgent(knowledgeBase: string): Promise<string> {
  const prompt = `Przeanalizuj ponizszą bazę wiedzy i stwórz kompleksową strategię marketingową:

BAZA WIEDZY:
${knowledgeBase}

Stwórz szczegółową strategię marketingową zawierającą wszystkie elementy wymienione w instrukcji.`;

  const response = await genai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: {
      systemInstruction: STRATEGY_SYSTEM_PROMPT,
      temperature: 0.7,
      maxOutputTokens: 2048,
    },
  });

  return response.text || "Nie udało się wygenerować strategii.";
}

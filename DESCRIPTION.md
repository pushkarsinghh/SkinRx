# SkinRx: AI Dermatology Assistant

## Inspiration

In India, access to specialized healthcare like dermatology is a luxury many can't afford. The dermatologist-to-patient ratio is critically low, especially in rural and semi-urban areas, with estimates as high as one dermatologist for every 100,000 people. Many individuals let skin conditions worsen due to a lack of immediate, accessible advice, often facing language barriers or the inability to travel.

With the rise of powerful multimodal AI, like Google's Gemini, we saw an opportunity—not to replace doctors, but to bridge this gap. Our goal: build an AI-powered companion that delivers preliminary dermatological information to every Indian, in a language they understand.

## What It Does

**SkinRx** is a multi-lingual AI Dermatology Assistant that guides users from concern to care in three simple steps:

1. **Analyze:**  
    Users upload an image of their skin concern. The app uses the Gemini API for instant visual analysis, identifying the potential condition, its severity, and providing a detailed description.

2. **Understand & Discuss:**  
    The analysis is presented in a clean, accessible interface. Users can:
    - **Translate:** Instantly switch the report to Hindi.
    - **Listen:** Use Text-to-Speech to have results read aloud, breaking literacy barriers.
    - **Chat:** Ask follow-up questions in a conversational AI chat to better understand the condition and remedies.

3. **Act & Connect:**  
    SkinRx helps users locate nearby dermatologists, closing the loop between AI insight and professional care.

## How We Built It

- **Frontend:** Next.js (React) for high-performance, server-rendered UX.
- **Styling:** Tailwind CSS for rapid, responsive UI development.
- **Core AI Logic:** Gemini API (gemini-2.5-flash-preview-05-20) powers:
  - Multimodal analysis for diagnosis.
  - Structured JSON output via prompt engineering.
  - Natural language processing for translation and chat.
- **Accessibility:** Browser's native Web Speech API for Text-to-Speech, ensuring broad compatibility.

## Challenges

- **Prompt Engineering:** Ensuring the AI consistently returns a perfectly structured JSON object, especially for translation, required significant iteration and precise instructions.
- **User Experience:** Managing multiple asynchronous API calls (analysis, translation, chat) and ensuring smooth UI updates with React's useEffect and state management.

## Accomplishments

- Built a complete end-to-end solution guiding users from initial concern to actionable professional help.
- Focused on true accessibility: multi-language support (Hindi) and Text-to-Speech make SkinRx usable by a wider demographic, including those facing digital or literacy barriers.

## What We Learned

- The power of LLMs lies in creative, precise prompt engineering.
- Human-centered AI is essential: technology should solve real-world problems empathetically. Features like translation and TTS were designed with user needs first.

## What's Next

- **Low-Bandwidth "Lite" Mode:** Ensure reliability on slower mobile networks.
- **Public Health Dashboard:** Aggregate anonymized data to create a real-time heatmap of skin conditions across India.
- **Telemedicine Integration:** Enable appointment booking and initial consultations through the app.
- **Expanded Language Support:** Add more regional languages (Tamil, Telugu, Bengali, Marathi).
- **Historical Tracking:** Allow users to track condition progress over time and share with their doctor.


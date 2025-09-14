# 👨‍⚕️ SkinRx – AI Dermatology Assistant

**SkinRx** is a web application that delivers instant, AI-powered analysis of skin conditions using Google's Gemini API. It features a multi-lingual interface, text-to-speech accessibility, conversational follow-up, and a dermatologist locator.

---

## 🚀 [Live Demo](#)  
Visit: [SkinRx Website](https://skin-rx.vercel.app/)

---

## ✨ Key Features

- **🔬 Instant AI Analysis:** Upload a skin image for preliminary analysis of potential conditions, severity, and descriptions.
- **🌐 Multi-Lingual Support:** Instantly translate the interface and results (currently supports Hindi).
- **🔊 Text-to-Speech:** Accessibility feature that reads the analysis aloud in the selected language.
- **💬 Conversational Follow-up:** Integrated AI chat for clarifying questions about your results.
- **👨‍⚕️ Doctor Locator:** Find nearby dermatologists for professional consultation.
- **📱 Fully Responsive:** Modern UI optimized for desktop and mobile devices.

---

## 🛠️ Tech Stack

- **Framework:** [Next.js (React)](https://nextjs.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Core AI:** [Google Gemini API](https://aistudio.google.com/) (`gemini-2.5-flash-preview-05-20`)
    - Multimodal Image Analysis
    - Natural Language Translation
    - Context-Aware Chat
- **Accessibility:** Browser Web Speech API (Text-to-Speech)
- **Deployment:** Vercel 

---

## ⚡ Getting Started

Follow these steps to set up the project locally for development and testing.

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- npm or yarn

### Installation

```bash
git clone https://github.com/pushkarsinghh/skinrx.git
cd skinrx
npm install
# or
yarn install
```

### Environment Variables

1. Obtain an API key from [Google AI Studio](https://aistudio.google.com/).
2. Create a `.env.local` file in the project root:
        ```
        NEXT_PUBLIC_GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
        ```
3. For local development, update the `callGeminiAPI` function in `app/page.jsx` to use `process.env.NEXT_PUBLIC_GEMINI_API_KEY`.

### Running the App

```bash
npm run dev
# or
yarn dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Structure

- **Single-file Next.js app:** All logic, state management, API calls, and UI components are in `app/page.jsx`.
- **Global styles & animations:** Included via `<style jsx global>`.

---

## 🤝 Contributing

Contributions are welcome!  
Help make SkinRx better by submitting issues and pull requests.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See [LICENSE](LICENSE) for details.

---

*SkinRx is designed for educational and informational purposes. For medical advice, always consult a qualified healthcare professional.*
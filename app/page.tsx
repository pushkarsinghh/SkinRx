'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Upload, FileText, Pill, AlertTriangle, Zap, Microscope, Languages, Bot, User, Volume2, MapPin, SendHorizonal, CircleDashed } from 'lucide-react';

// --- MOCK DATA FOR HACKATHON DEMO ---
const mockDoctors = [
    { name: 'Dr. Priya Sharma', city: 'Mumbai', specialty: 'Dermatologist', address: '123 Skin Care Ave, Andheri' },
    { name: 'Dr. Rohan Verma', city: 'Delhi', specialty: 'Dermatologist', address: '456 Derma Clinic, Connaught Place' },
    { name: 'Dr. Anjali Rao', city: 'Bengaluru', specialty: 'Cosmetic Dermatologist', address: '789 Glow St, Koramangala' },
    { name: 'Dr. Vikram Singh', city: 'Chennai', specialty: 'Pediatric Dermatologist', address: '101 Child Health Rd, T. Nagar' },
    { name: 'Dr. Sunita Reddy', city: 'Hyderabad', specialty: 'Dermatopathologist', address: '212 Bio Labs, Gachibowli' },
];

// --- MAIN PAGE COMPONENT ---
export default function SkinRxPage() {
    // Core State
    const [image, setImage] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [initialResult, setInitialResult] = useState(null);
    const [translatedResult, setTranslatedResult] = useState(null);
    
    // UI State
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedLanguage, setSelectedLanguage] = useState('en');
    
    // Chat State
    const [chatHistory, setChatHistory] = useState([]);
    const [isChatting, setIsChatting] = useState(false);
    const [userInput, setUserInput] = useState('');
    const chatEndRef = useRef(null);

    // --- API & LOGIC FUNCTIONS ---

    // Function to handle image selection and preview
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 4 * 1024 * 1024) { // 4MB API limit
                setError('Image size exceeds 4MB. Please upload a smaller file.');
                return;
            }
            // Reset everything on new image upload
            setError('');
            setInitialResult(null);
            setTranslatedResult(null);
            setChatHistory([]);

            const reader = new FileReader();
            reader.onloadend = () => {
                if (typeof reader.result === 'string') {
                    const base64String = reader.result.replace(/^data:.+;base64,/, '');
                    setImage(base64String);
                }
            };
            reader.readAsDataURL(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };
    
    // Generic Gemini API call function with exponential backoff
    const callGeminiAPI = async (payload, retries = 3) => {
        const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
        
        for (let i = 0; i < retries; i++) {
            try {
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                if (response.ok) {
                    return await response.json();
                }
                if (response.status === 429 || response.status >= 500) { // Retry on rate limit or server error
                    await new Promise(res => setTimeout(res, 1000 * Math.pow(2, i)));
                    continue;
                }
                throw new Error(`API request failed with status ${response.status}`);
            } catch (err) {
                if (i === retries - 1) throw err;
            }
        }
        throw new Error("API request failed after multiple retries.");
    };
    
    // Main diagnosis handler
    const handleDiagnose = useCallback(async () => {
        if (!image) return;

        setLoading(true);
        setError('');
        setInitialResult(null);
        setTranslatedResult(null);
        setChatHistory([]);
        
        try {
            const userPrompt = `Analyze this skin image. Identify the most likely condition. Your response must be a single JSON object with this structure:
                {
                  "diseaseName": "string",
                  "description": "string",
                  "severity": { "level": "string (e.g., 'Mild', 'Moderate', 'Severe', 'Unknown')", "details": "string" },
                  "possibleCures": { "otc": ["string array"], "professional": ["string array"] },
                  "disclaimer": "This is an AI analysis, not a medical diagnosis. Consult a professional."
                }`;
            
            const payload = {
                contents: [{ parts: [{ text: userPrompt }, { inline_data: { mime_type: "image/jpeg", data: image } }] }],
                systemInstruction: { parts: [{ text: "You are SkinRx, a dermatologist AI. Respond only with the requested JSON object." }] },
                generationConfig: { responseMimeType: "application/json" }
            };

            const data = await callGeminiAPI(payload);
            
            if (data.candidates && data.candidates[0]) {
                const resultText = data.candidates[0].content.parts[0].text;
                const resultJson = JSON.parse(resultText);
                setInitialResult(resultJson);
                setChatHistory([{
                    role: 'model',
                    text: "Hello! I've analyzed your image. Here's a summary of my findings. You can ask me follow-up questions below."
                }]);
            } else {
                throw new Error('Analysis failed. The model returned an invalid response.');
            }

        } catch (err) {
            console.error("Diagnosis error:", err);
            setError(`An error occurred during analysis: ${err.message}`);
        } finally {
            setLoading(false);
        }
    }, [image]);
    
    // Effect to translate the result when language or result changes
    useEffect(() => {
        if (!initialResult) return;

        if (selectedLanguage === 'en') {
            setTranslatedResult(initialResult);
            return;
        }

        const translateResult = async () => {
            try {
                 const translationPrompt = `Translate the string values in this JSON object to Hindi. Maintain the exact same JSON structure and keys.\n\nJSON:\n${JSON.stringify(initialResult)}`;
                 const payload = { contents: [{ parts: [{ text: translationPrompt }] }] };
                 const data = await callGeminiAPI(payload);
                 const translatedText = data.candidates[0].content.parts[0].text;
                 // Clean up potential markdown code block
                 const cleanedText = translatedText.replace(/```json\n?|\n?```/g, '');
                 setTranslatedResult(JSON.parse(cleanedText));
            } catch (err) {
                console.error("Translation error:", err);
                // Fallback to English if translation fails
                setTranslatedResult(initialResult); 
            }
        };

        translateResult();
    }, [initialResult, selectedLanguage]);
    
    // Chat message handler
    const handleSendMessage = async () => {
        if (!userInput.trim() || !initialResult) return;

        const newChatHistory = [...chatHistory, { role: 'user', text: userInput }];
        setChatHistory(newChatHistory);
        setUserInput('');
        setIsChatting(true);

        try {
            const context = `Initial Analysis:\n${JSON.stringify(initialResult)}\n\nConversation History:\n${newChatHistory.map(m => `${m.role}: ${m.text}`).join('\n')}`;
            const chatPrompt = `You are SkinRx, a helpful AI dermatology assistant. You have already provided an initial analysis. Now, answer the user's latest follow-up question based on the initial analysis and the conversation history. Be concise, helpful, and informative. Do not provide medical advice. If asked for ayurvedic or home remedies, suggest commonly known ones but strongly advise consulting a professional before trying anything.`;
            
            const payload = {
                contents: [{ role: 'user', parts: [{ text: context }] }, { role: 'model', parts: [{ text: 'Understood. How can I help further?' }] }, { role: 'user', parts: [{ text: chatPrompt }] }],
                systemInstruction: { parts: [{ text: "You are a helpful AI assistant." }] }
            };

            const data = await callGeminiAPI(payload);
            const responseText = data.candidates[0].content.parts[0].text;
            setChatHistory(prev => [...prev, { role: 'model', text: responseText }]);

        } catch (err) {
            console.error("Chat error:", err);
            setChatHistory(prev => [...prev, { role: 'model', text: "Sorry, I encountered an error. Please try again." }]);
        } finally {
            setIsChatting(false);
        }
    };
    
    // Scroll chat to the bottom
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory]);

    // Text-to-Speech handler
    const speakText = (text, lang) => {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = lang === 'hi' ? 'hi-IN' : 'en-US';
            window.speechSynthesis.cancel(); // Cancel any previous speech
            window.speechSynthesis.speak(utterance);
        } else {
            alert('Your browser does not support text-to-speech.');
        }
    };
    

    // --- RENDER ---
    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
            <GlobalStyles />
            <header className="bg-white/80 backdrop-blur-lg shadow-sm sticky top-0 z-20">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Microscope className="h-8 w-8 text-teal-500" />
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-500 to-cyan-500 bg-clip-text text-transparent">SkinRx</h1>
                    </div>
                    <LanguageSelector selectedLanguage={selectedLanguage} setSelectedLanguage={setSelectedLanguage} />
                </div>
            </header>

            <main className="container mx-auto p-4 sm:p-6 lg:p-8">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                    
                    {/* --- LEFT UPLOAD PANEL --- */}
                    <div className="bg-white p-6 rounded-2xl shadow-lg flex flex-col items-center h-fit sticky top-24 z-10">
                        <h2 className="text-2xl font-semibold text-slate-700 mb-4 self-start">1. Upload Skin Image</h2>
                        <div className="w-full aspect-square border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center mb-4 bg-slate-50 transition-all duration-300 hover:border-teal-400 hover:bg-teal-50/50 relative overflow-hidden">
                            {previewUrl ? <img src={previewUrl} alt="Skin preview" className="object-contain w-full h-full rounded-xl" /> : 
                                <div className="text-center text-slate-500 p-4"><Upload className="mx-auto h-12 w-12 text-slate-400 mb-2" /><p className="font-semibold">Click to upload or drag & drop</p><p className="text-xs mt-1">PNG or JPG (Max 4MB)</p></div>
                            }
                        </div>
                        <div className="w-full flex flex-col sm:flex-row items-center gap-4">
                            <label htmlFor="file-upload" className="w-full cursor-pointer bg-white border border-slate-300 text-slate-700 font-semibold py-3 px-4 rounded-lg hover:bg-slate-100 transition-all text-center transform hover:scale-105 duration-300 ease-in-out">Choose File</label>
                            <input id="file-upload" type="file" className="hidden" accept="image/png, image/jpeg" onChange={handleImageChange} />
                            <button onClick={handleDiagnose} disabled={loading || !image} className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold py-3 px-4 rounded-lg hover:from-teal-600 hover:to-cyan-600 disabled:from-slate-400 disabled:to-slate-400 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg transform hover:scale-105 duration-300 ease-in-out">
                                {loading ? <><CircleDashed className="animate-spin h-5 w-5" />Analyzing...</> : <><Zap size={20} />Diagnose</>}
                            </button>
                        </div>
                    </div>
                    
                    {/* --- RIGHT RESULTS PANEL --- */}
                    <div className="bg-white p-6 rounded-2xl shadow-lg min-h-[600px] flex flex-col">
                        <h2 className="text-2xl font-semibold text-slate-700 mb-4">2. Review & Discuss</h2>
                        {error && <ErrorMessage message={error} />}
                        {!initialResult && !loading && !error && <div className="text-center text-slate-500 py-16 flex-grow flex flex-col justify-center items-center"><FileText className="mx-auto h-16 w-16 text-slate-300" /><p className="mt-4 text-lg">Your analysis will appear here.</p></div>}
                        {loading && <SkeletonLoader />}
                        {translatedResult && (
                            <div className="flex flex-col flex-grow">
                                <ResultDisplay result={translatedResult} speakText={speakText} lang={selectedLanguage} />
                                <ChatInterface history={chatHistory} onSendMessage={handleSendMessage} userInput={userInput} setUserInput={setUserInput} isChatting={isChatting} chatEndRef={chatEndRef} />
                                <DoctorLocator doctors={mockDoctors} />
                            </div>
                        )}
                    </div>
                </div>
                <Disclaimer />
            </main>
        </div>
    );
}

// --- SUB-COMPONENTS ---

const LanguageSelector = ({ selectedLanguage, setSelectedLanguage }) => (
    <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 rounded-lg p-1">
        <Languages className="h-5 w-5 text-slate-500 ml-2" />
        <select value={selectedLanguage} onChange={(e) => setSelectedLanguage(e.target.value)} className="bg-transparent font-semibold text-slate-700 focus:outline-none cursor-pointer">
            <option value="en">English</option>
            <option value="hi">हिंदी</option>
        </select>
    </div>
);

const ResultDisplay = ({ result, speakText, lang }) => (
    <div className="space-y-4 animate-fade-in mb-4">
        <div>
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Potential Condition</h3>
                    <p className="text-4xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent mt-1">{result.diseaseName}</p>
                </div>
                <SpeakerButton onClick={() => speakText(`${result.diseaseName}. ${result.description}`, lang)} />
            </div>
            <p className="prose prose-slate max-w-none text-slate-600 mt-2">{result.description}</p>
        </div>
        <div>
             <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Severity Assessment</h3>
             <div className={`inline-flex items-center px-4 py-1.5 rounded-full text-lg font-semibold border ${result.severity.level === 'Mild' || result.severity.level === 'हल्का' ? 'bg-green-100 text-green-800 border-green-200' : ''} ${result.severity.level === 'Moderate' || result.severity.level === 'मध्यम' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : ''} ${result.severity.level === 'Severe' || result.severity.level === 'गंभीर' ? 'bg-red-100 text-red-800 border-red-200' : ''} ${result.severity.level === 'Unknown' || result.severity.level === 'अज्ञात' ? 'bg-slate-100 text-slate-800 border-slate-200' : ''}`}>
                 {result.severity.level}
             </div>
             <p className="text-slate-600 mt-2 text-sm">{result.severity.details}</p>
        </div>
    </div>
);

const ChatInterface = ({ history, onSendMessage, userInput, setUserInput, isChatting, chatEndRef }) => (
    <div className="flex-grow flex flex-col mt-4 border-t border-slate-200 pt-4">
        <div className="flex-grow space-y-4 overflow-y-auto pr-2 max-h-[300px]">
            {history.map((msg, index) => (
                <div key={index} className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'model' && <Bot className="h-6 w-6 text-white bg-teal-500 p-1 rounded-full flex-shrink-0" />}
                    <div className={`max-w-xs md:max-w-md p-3 rounded-2xl ${msg.role === 'user' ? 'bg-cyan-500 text-white rounded-br-none' : 'bg-slate-100 text-slate-800 rounded-bl-none'}`}>
                        <p className="text-sm">{msg.text}</p>
                    </div>
                    {msg.role === 'user' && <User className="h-6 w-6 text-white bg-cyan-500 p-1 rounded-full flex-shrink-0" />}
                </div>
            ))}
            {isChatting && <div className="flex justify-start"><div className="p-3 rounded-2xl bg-slate-100 rounded-bl-none"><div className="typing-indicator"><span></span><span></span><span></span></div></div></div>}
            <div ref={chatEndRef} />
        </div>
        <div className="mt-4 flex gap-2">
            <input type="text" value={userInput} onChange={e => setUserInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && onSendMessage()} placeholder="Ask a follow-up question..." className="flex-grow p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400"/>
            <button onClick={onSendMessage} disabled={isChatting} className="bg-teal-500 text-white p-3 rounded-lg hover:bg-teal-600 disabled:bg-slate-400 transition-all"><SendHorizonal size={24} /></button>
        </div>
    </div>
);

const DoctorLocator = ({ doctors }) => (
    <div className="mt-6 border-t border-slate-200 pt-4">
        <h3 className="text-lg font-semibold text-slate-700 mb-2">3. Find a Specialist Nearby</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {doctors.map((doc, i) => (
                <div key={i} className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <p className="font-bold text-slate-800">{doc.name}</p>
                    <p className="text-sm text-slate-600">{doc.specialty}</p>
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1"><MapPin size={12} /> {doc.city}</p>
                </div>
            ))}
        </div>
    </div>
);

const SkeletonLoader = () => <div className="space-y-6 animate-pulse"><div className="space-y-2"><div className="h-4 bg-slate-200 rounded w-1/3"></div><div className="h-8 bg-slate-300 rounded w-1/2"></div></div><div className="space-y-2"><div className="h-4 bg-slate-200 rounded w-full"></div><div className="h-4 bg-slate-200 rounded w-3/4"></div></div><div className="space-y-2"><div className="h-4 bg-slate-200 rounded w-1/4"></div><div className="h-8 bg-slate-300 rounded-full w-1/3"></div></div></div>;
const ErrorMessage = ({ message }) => <div className="bg-red-100 border-l-4 border-red-500 text-red-800 p-4 rounded-r-lg" role="alert"><p className="font-bold">An Error Occurred</p><p className="text-sm">{message}</p></div>;
const SpeakerButton = ({ onClick }) => <button onClick={onClick} className="p-2 rounded-full hover:bg-teal-100 text-teal-500 transition-colors"><Volume2 size={20} /></button>;
const Disclaimer = () => <div className="mt-8 bg-amber-50 border-l-4 border-amber-400 text-amber-900 p-4 rounded-lg shadow-sm"><div className="flex"><div className="py-1"><AlertTriangle className="h-6 w-6 text-amber-500 mr-4" /></div><div><p className="font-bold">Important Disclaimer</p><p className="text-sm">SkinRx is an AI-powered informational tool, not a substitute for professional medical diagnosis. Please consult a qualified dermatologist for any health concerns.</p></div></div></div>

// --- GLOBAL STYLES ---
const GlobalStyles = () => (
  <style jsx global>{`
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .animate-fade-in { animation: fadeIn 0.5s ease-in-out; }
    .typing-indicator span { height: 8px; width: 8px; float: left; margin: 0 1px; background-color: #94a3b8; display: block; border-radius: 50%; opacity: 0.4; }
    .typing-indicator span:nth-of-type(1) { animation: 1s blink infinite 0.3333s; }
    .typing-indicator span:nth-of-type(2) { animation: 1s blink infinite 0.6666s; }
    .typing-indicator span:nth-of-type(3) { animation: 1s blink infinite 0.9999s; }
    @keyframes blink { 50% { opacity: 1; } }
  `}</style>
);


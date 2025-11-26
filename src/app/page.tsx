'use client';

import React, { useState, useRef, useEffect, ChangeEvent, FormEvent } from 'react';
import { Camera, Upload, X, MessageCircle, Send, Sparkles, Loader, Facebook, Mail } from 'lucide-react';

// --- INTERFACES ---
interface Photo {
  id: number;
  category: string;
  title: string;
  description: string;
  date: string;
  url: string;
}

interface NewPhotoState {
  title: string;
  description: string;
  category: string;
  file: File | null;
}

interface Message {
  sender: 'user' | 'bot';
  text: string;
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

// --- ICONOS ---
const BirdIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 7h.01" /><path d="M3.4 18H12a8 8 0 0 0 8-8V7a4 4 0 0 0-7.28-2.3L2 20" /><path d="m20 7 2 .5-2 .5" /><path d="M10 18v3" /><path d="M14 17.75V21" /><path d="M7 18a6 6 0 0 0 3.84-10.61" /></svg>
);
const BugIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m8 2 1.88 1.88" /><path d="M14.12 3.88 16 2" /><path d="M9 7.13v-1a3.003 3.003 0 1 1 6 0v1" /><path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6" /><path d="M12 20v-9" /><path d="M6.53 9C4.6 8.8 3 7.1 3 5" /><path d="M6 13H2" /><path d="M3 21c0-2.1 1.7-3.9 3.8-4" /><path d="M20.97 5c0 2.1-1.6 3.8-3.5 4" /><path d="M22 13h-4" /><path d="M17.2 17c2.1.1 3.8 1.9 3.8 4" /></svg>
);
const SoccerIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="m4.93 4.93 4.24 4.24" /><path d="m14.83 9.17 4.24-4.24" /><path d="m14.83 14.83 4.24 4.24" /><path d="m9.17 14.83-4.24 4.24" /><circle cx="12" cy="12" r="2" /></svg>
);

// --- API ---
const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";

const callGemini = async (prompt: string, systemInstruction: string = ""): Promise<string> => {
  if (!apiKey) {
    console.warn("Falta la API Key.");
    return "Configura tu API Key en el archivo .env.local";
  }
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          systemInstruction: { parts: [{ text: systemInstruction }] },
        }),
      }
    );

    if (!response.ok) throw new Error(`Error API: ${response.status}`);
    const data = await response.json();
    // Acceso seguro con encadenamiento opcional
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "No se pudo generar respuesta.";
  } catch (error) {
    console.error("Error al llamar a Gemini:", error);
    return "Lo siento, hubo un error al conectar con la IA.";
  }
};

// --- COMPONENTES ---

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-md relative border border-slate-700 max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white">
          <X size={24} />
        </button>
        {children}
      </div>
    </div>
  );
};

const ChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([
    { sender: 'bot', text: '¡Hola! Soy la versión IA de Manuel. Pregúntame sobre mis fotos, Paine o mi pasión por el fútbol.' }
  ]);
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = { sender: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const systemPrompt = `
            Eres Manuel Pereira, un fotógrafo aficionado chileno.
            Naciste en Paine el 29 de marzo de 1969.
            Trabajas en ALCHI y en tu tiempo libre amas la fotografía.
            Tus temas favoritos son: pájaros (ornitología local), fotografía macro (abejas, insectos, plantas) y fútbol (grabar a tu hijo).
            Responde de manera amable, humilde y apasionada, usando modismos chilenos suaves si corresponde.
            Mantén las respuestas breves (máximo 2-3 oraciones).
        `;

    const responseText = await callGemini(input, systemPrompt);
    setMessages(prev => [...prev, { sender: 'bot', text: responseText }]);
    setIsLoading(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end font-sans">
      {isOpen && (
        <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-2xl w-80 h-96 mb-4 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="bg-slate-900 p-3 border-b border-slate-700 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="font-bold text-white text-sm">Chat con Manuel (IA)</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white"><X size={16} /></button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-800">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-lg text-sm ${msg.sender === 'user'
                  ? 'bg-amber-600 text-white rounded-br-none'
                  : 'bg-slate-700 text-slate-200 rounded-bl-none'
                  }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-700 p-3 rounded-lg rounded-bl-none flex space-x-1">
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSend} className="p-3 bg-slate-900 border-t border-slate-700 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe tu pregunta..."
              className="flex-1 bg-slate-800 text-white text-sm rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
            <button type="submit" className="bg-amber-600 text-white p-2 rounded-md hover:bg-amber-700 transition-colors">
              <Send size={16} />
            </button>
          </form>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-amber-600 hover:bg-amber-700 text-white p-4 rounded-full shadow-lg transition-transform hover:scale-105 flex items-center gap-2"
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
        {!isOpen && <span className="font-bold hidden md:inline">Pregúntale a Manuel</span>}
      </button>
    </div>
  );
};

// --- PÁGINA PRINCIPAL ---
export default function Home() {
  const initialPhotos: Photo[] = [
    { id: 1, category: 'pajaros', title: 'Pequén', description: 'Un Pequeño búho nativo de América, conocido por sus hábitos terrestres y diurnos sobre un poste en Paine.', date: '22 de Septiembre del 2025', url: '/imgs/pequen.jpg' },
    { id: 2, category: 'macro', title: 'Abeja en Flor', description: 'Un acercamiento íntimo al trabajo incansable de una abeja recolectando polen.', date: '2024-01-10', url: '/imgs/abeja.jpg' },
    { id: 3, category: 'futbol', title: 'Gol del Domingo', description: 'El momento exacto de la celebración en la liga local.', date: '2023-12-05', url: '/imgs/fut1.jpg' },
    { id: 4, category: 'pajaros', title: 'Martín Pescador', description: 'Paciencia y precisión junto al río Maipo.', date: '2023-10-22', url: '/imgs/pajaro.jpg' },
    { id: 5, category: 'macro', title: 'Flor', description: 'Gotas de agua magnificadas sobre una hoja al amanecer.', date: '2024-02-01', url: '/imgs/macro2.jpg' },
    { id: 6, category: 'futbol', title: 'Entrenamiento', description: 'Esfuerzo y dedicación en la cancha.', date: '2023-12-12', url: '/imgs/fut2.jpg' },
  ];

  const [activeTab, setActiveTab] = useState<string>('todos');
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [newPhoto, setNewPhoto] = useState<NewPhotoState>({ title: '', description: '', category: 'pajaros', file: null });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Referencia tipada para input file
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredPhotos = activeTab === 'todos' ? photos : photos.filter(p => p.category === activeTab);

  // Evento tipado para input file
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewPhoto({ ...newPhoto, file });
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
    }
  };

  const handleGenerateDescription = async () => {
    if (!newPhoto.title) {
      alert("Por favor escribe un título primero para ayudar a la IA.");
      return;
    }
    setIsGenerating(true);
    const prompt = `
            Genera una descripción breve, poética y evocadora (máximo 25 palabras) para una fotografía titulada "${newPhoto.title}" 
            que pertenece a la categoría "${newPhoto.category}". 
            El fotógrafo es Manuel Pereira, un aficionado de Paine, Chile, que ama la naturaleza.
        `;
    const generatedText = await callGemini(prompt);
    setNewPhoto(prev => ({ ...prev, description: generatedText }));
    setIsGenerating(false);
  };

  const handleUpload = (e: FormEvent) => {
    e.preventDefault();
    if (!newPhoto.file || !newPhoto.title) return;

    const newId = photos.length + 1;
    const photoEntry: Photo = {
      id: newId,
      category: newPhoto.category,
      title: newPhoto.title,
      description: newPhoto.description || 'Sin descripción.',
      date: new Date().toISOString().split('T')[0],
      // Si estuviéramos en producción, aquí subiríamos a blob storage
      url: previewUrl || ''
    };
    setPhotos([photoEntry, ...photos]);
    setNewPhoto({ title: '', description: '', category: 'pajaros', file: null });
    setPreviewUrl(null);
    setIsUploadModalOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col text-slate-100 bg-slate-900 font-sans">
      <nav className="fixed w-full z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Camera size={28} className="text-amber-500" />
            <span className="text-xl font-bold tracking-wider uppercase text-white">Manuel Pereira</span>
          </div>
          <div className="hidden md:flex space-x-8 text-sm font-medium">
            <a href="#inicio" className="text-slate-300 hover:text-amber-500 transition-colors">Inicio</a>
            <a href="#sobre-mi" className="text-slate-300 hover:text-amber-500 transition-colors">Sobre Mí</a>
            <a href="#galeria" className="text-slate-300 hover:text-amber-500 transition-colors">Galería</a>
            <a href="#contacto" className="text-slate-300 hover:text-amber-500 transition-colors">Contacto</a>
          </div>
        </div>
      </nav>

      <section id="inicio" className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src="bg2.jpg" alt="Fondo Naturaleza" className="w-full h-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent"></div>
        </div>
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto animate-in fade-in duration-1000">
          <p className="text-amber-500 tracking-[0.2em] uppercase text-sm mb-4 font-semibold">Portafolio Fotográfico</p>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight text-white font-serif">
            Capturando la Esencia <br /> <span className="italic font-normal text-slate-300">de la Naturaleza</span>
          </h1>
          <p className="text-slate-300 text-lg md:text-xl mb-8 max-w-2xl mx-auto">Una mirada íntima a la vida silvestre y los momentos cotidianos a través del lente.</p>
          <a href="#galeria" className="inline-block bg-amber-600 hover:bg-amber-700 text-white font-semibold py-3 px-8 rounded-full transition-all shadow-lg">Ver Mis Fotos</a>
        </div>
      </section>

      <section id="sobre-mi" className="py-20 bg-slate-900">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="md:w-1/2 relative">
              <div className="w-full aspect-[3/4] rounded-lg overflow-hidden relative z-10 border border-slate-700">
                <img src="profile3.png" alt="Manuel" className="w-full h-full object-cover" />
              </div>
              <div className="absolute -bottom-6 -right-6 w-48 h-48 bg-slate-800 border border-slate-700 p-6 rounded-lg z-20 hidden md:block shadow-xl">
                <div className="h-full flex flex-col justify-center">
                  <span className="text-amber-500 text-4xl font-bold font-serif">50+</span>
                  <span className="text-slate-400 text-sm mt-2">Años de historia y experiencia de vida</span>
                </div>
              </div>
            </div>
            <div className="md:w-1/2">
              <h2 className="text-4xl font-bold mb-6 text-white font-serif">Manuel Pereira</h2>
              <div className="w-20 h-1 bg-amber-500 mb-8"></div>
              <p className="text-slate-300 mb-6 leading-relaxed">
                Nací el <strong>29 de marzo de 1969</strong> en la hermosa tierra de <strong>Paine, Chile</strong>.
                Profesionalmente, formo parte del equipo de <strong>ALCHI</strong>. Sin embargo, en mis tiempos libres, cambio las herramientas por mi cámara.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
                <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 text-center">
                  <div className="mx-auto bg-slate-700 w-12 h-12 rounded-full flex items-center justify-center mb-3 text-amber-500"><BirdIcon /></div>
                  <h4 className="font-semibold text-sm text-slate-200">Ornitología</h4>
                </div>
                <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 text-center">
                  <div className="mx-auto bg-slate-700 w-12 h-12 rounded-full flex items-center justify-center mb-3 text-amber-500"><BugIcon /></div>
                  <h4 className="font-semibold text-sm text-slate-200">Mundo Macro</h4>
                </div>
                <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 text-center">
                  <div className="mx-auto bg-slate-700 w-12 h-12 rounded-full flex items-center justify-center mb-3 text-amber-500"><SoccerIcon /></div>
                  <h4 className="font-semibold text-sm text-slate-200">Fútbol</h4>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="galeria" className="py-20 bg-slate-950">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center md:items-end mb-12 gap-4">
            <h2 className="text-4xl font-bold mb-2 font-serif text-white text-center md:text-left">
              Galería de Fotos
            </h2>
            {/* <div>
              <h2 className="text-4xl font-bold mb-2 text-white font-serif">Galería de Fotos</h2>
              <p className="text-slate-400">Selecciona un álbum para explorar</p>
            </div> */}
            {/* <button onClick={() => setIsUploadModalOpen(true)} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white px-4 py-2 rounded-lg transition-all">
              <Upload size={18} /> <span>Subir Nueva Foto</span>
            </button> */}
          </div>
          <div className="flex flex-wrap gap-2 mb-10">
            {[{ id: 'todos', label: 'Todas' }, { id: 'pajaros', label: 'Pájaros' }, { id: 'macro', label: 'Macro' }, { id: 'futbol', label: 'Fútbol' }].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-amber-600 text-white shadow-lg' : 'bg-slate-900 text-slate-400 border border-slate-800'}`}>{tab.label}</button>
            ))}
          </div>
          {filteredPhotos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPhotos.map((photo) => (
                <div key={photo.id} className="group relative bg-slate-900 rounded-xl overflow-hidden border border-slate-800 shadow-xl animate-in fade-in duration-700">
                  <div className="aspect-[4/3] overflow-hidden">
                    <img src={photo.url} alt={photo.title} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                    <span className="text-amber-500 text-xs font-bold uppercase tracking-wider mb-1">{photo.category}</span>
                    <h3 className="text-white text-xl font-bold font-serif">{photo.title}</h3>
                    {photo.description && <p className="text-slate-300 text-xs mt-2 italic border-l-2 border-amber-500 pl-2">"{photo.description}"</p>}
                    <p className="text-slate-500 text-xs mt-2">{photo.date}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-slate-500 border border-dashed border-slate-800 rounded-xl"><p>No hay fotos.</p></div>
          )}
        </div>
      </section>

      <section id="contacto" className="py-20 bg-slate-900 border-t border-slate-800">
        <div className="container mx-auto px-6 max-w-2xl text-center">
          <h2 className="text-3xl font-bold mb-8 text-white font-serif">¿Te gustó mi trabajo?</h2>
          <p className="text-slate-300 mb-8">
            Siempre estoy buscando nuevos lugares para fotografiar. Sígueme en redes o contáctame directamente.
          </p>
          <div className="flex flex-col md:flex-row justify-center items-center gap-4">
            <a href="https://facebook.com/manuel.pereira.948494" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-slate-800 text-white border border-slate-700 hover:border-amber-500 hover:text-amber-500 px-8 py-3 rounded-lg transition-all font-medium">
              <Facebook size={20} /> <span>Facebook</span>
            </a>
            <a href="mailto:mapesi9515@gmail.com" className="flex items-center gap-2 border border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-white px-8 py-3 rounded-lg transition-colors font-medium">
              <Mail size={20} /> <span>Enviar un Correo</span>
            </a>
          </div>
        </div>
      </section>

      <Modal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)}>
        <div className="p-6">
          <h3 className="text-2xl font-bold text-white mb-1 font-serif">Subir Nueva Foto</h3>
          <form onSubmit={handleUpload} className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Título</label>
              <input type="text" required value={newPhoto.title} onChange={(e) => setNewPhoto({ ...newPhoto, title: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-amber-500" placeholder="Ej: Colibrí en vuelo" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Álbum</label>
              <select value={newPhoto.category} onChange={(e) => setNewPhoto({ ...newPhoto, category: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-amber-500">
                <option value="pajaros">Pájaros</option>
                <option value="macro">Macro</option>
                <option value="futbol">Fútbol</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1 flex justify-between">
                <span>Descripción</span>
                <span className="text-xs text-amber-500 font-bold flex items-center gap-1"><Sparkles size={12} /> Powered by Gemini</span>
              </label>
              <textarea value={newPhoto.description} onChange={(e) => setNewPhoto({ ...newPhoto, description: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-amber-500 text-sm min-h-[80px]" placeholder="Escribe o genera..." />
              <button type="button" onClick={handleGenerateDescription} disabled={isGenerating || !newPhoto.title} className={`mt-2 w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${isGenerating ? 'bg-slate-700 text-slate-400' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}>
                {isGenerating ? <><Loader size={14} className="animate-spin" /> Creando...</> : <><Sparkles size={14} /> Generar con IA</>}
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Imagen</label>
              <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-slate-700 rounded-lg p-6 text-center cursor-pointer hover:border-amber-500 transition-colors">
                {previewUrl ? <img src={previewUrl} alt="Preview" className="h-32 mx-auto object-cover rounded shadow-lg" /> : <div className="text-slate-400"><Camera size={40} className="mx-auto mb-2" /><span className="text-sm">Clic para subir</span></div>}
              </div>
              <input type="file" ref={fileInputRef} accept="image/*" onChange={handleFileChange} className="hidden" />
            </div>
            <button type="submit" disabled={!newPhoto.file || !newPhoto.title} className={`w-full py-3 rounded-lg font-bold text-white transition-colors mt-4 ${newPhoto.file && newPhoto.title ? 'bg-amber-600 hover:bg-amber-700' : 'bg-slate-700 cursor-not-allowed text-slate-400'}`}>Publicar Foto</button>
          </form>
        </div>
      </Modal>

      <ChatWidget />
    </div>
  );
}
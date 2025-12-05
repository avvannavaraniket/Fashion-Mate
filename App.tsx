import React, { useState, useCallback, useEffect } from 'react';
import { getOutfitRecommendation } from './services/geminiService';
import OutfitDisplay from './components/OutfitDisplay';
import { StylistResponse } from './types';
import { SendIcon, HangerIcon, RefreshCwIcon, SparklesIcon } from './components/Icons';

const OCCASION_MIN_LENGTH = 5;
const OCCASION_MAX_LENGTH = 300;
const PREFERENCES_MAX_LENGTH = 200;

const SUGGESTED_OCCASIONS = [
  "Casual Coffee Date",
  "Summer Wedding Guest",
  "Tech Job Interview",
  "Weekend Brunch",
  "Gallery Opening",
  "Cocktail Party"
];

const GENDER_OPTIONS = ["Female", "Male", "Non-Binary"];

const BackgroundDecorations = () => (
  <div className="fixed inset-0 -z-20 overflow-hidden pointer-events-none">
    <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-rose-100/40 rounded-full blur-[120px] mix-blend-multiply animate-blob" />
    <div className="absolute top-[10%] right-[-10%] w-[500px] h-[500px] bg-orange-50/50 rounded-full blur-[120px] mix-blend-multiply animate-blob animation-delay-2000" />
    <div className="absolute bottom-[-20%] left-[20%] w-[700px] h-[700px] bg-indigo-50/40 rounded-full blur-[120px] mix-blend-multiply animate-blob animation-delay-4000" />
  </div>
);

const App: React.FC = () => {
  const [occasion, setOccasion] = useState('');
  const [gender, setGender] = useState('');
  const [preferences, setPreferences] = useState('');
  const [result, setResult] = useState<StylistResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validation State
  const [validationErrors, setValidationErrors] = useState({
    occasion: '',
    gender: '',
    preferences: ''
  });
  const [touched, setTouched] = useState({
    occasion: false,
    gender: false,
    preferences: false
  });

  const validate = useCallback((field: 'occasion' | 'preferences' | 'gender', value: string) => {
    let message = '';
    const trimmed = value.trim();

    if (field === 'occasion') {
      if (!trimmed) {
        message = 'Please describe the occasion.';
      } else if (trimmed.length < OCCASION_MIN_LENGTH) {
        message = `At least ${OCCASION_MIN_LENGTH} chars needed.`;
      } else if (value.length > OCCASION_MAX_LENGTH) {
        message = `Limit to ${OCCASION_MAX_LENGTH} characters.`;
      }
    } else if (field === 'gender') {
        if (!trimmed) {
            message = 'Required.';
        }
    } else if (field === 'preferences') {
       if (value.length > PREFERENCES_MAX_LENGTH) {
         message = `Limit to ${PREFERENCES_MAX_LENGTH} characters.`;
       }
    }

    setValidationErrors(prev => ({ ...prev, [field]: message }));
    return message;
  }, []);

  useEffect(() => {
    if (touched.occasion) validate('occasion', occasion);
  }, [occasion, touched.occasion, validate]);

  useEffect(() => {
    if (touched.gender) validate('gender', gender);
  }, [gender, touched.gender, validate]);

  useEffect(() => {
    if (touched.preferences) validate('preferences', preferences);
  }, [preferences, touched.preferences, validate]);

  const handleBlur = (field: 'occasion' | 'preferences') => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validate(field, field === 'occasion' ? occasion : preferences);
  };

  const handleGenderSelect = (selected: string) => {
      setGender(selected);
      setTouched(prev => ({ ...prev, gender: true }));
  };

  const handleSuggestionClick = (text: string) => {
    setOccasion(text);
    setTouched(prev => ({ ...prev, occasion: true }));
  };

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    const occasionError = validate('occasion', occasion);
    const genderError = validate('gender', gender);
    const preferencesError = validate('preferences', preferences);
    
    setTouched({ occasion: true, gender: true, preferences: true });

    if (occasionError || genderError || preferencesError) return;
    if (!occasion.trim() || !gender) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await getOutfitRecommendation(occasion, gender, preferences);
      setResult(data);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }, [occasion, gender, preferences, validate]);

  const handleReset = () => {
    setResult(null);
    setOccasion('');
    setGender('');
    setPreferences('');
    setError(null);
    setValidationErrors({ occasion: '', gender: '', preferences: '' });
    setTouched({ occasion: false, gender: false, preferences: false });
  };

  const isFormValid = !validationErrors.occasion && !validationErrors.gender && !validationErrors.preferences && occasion.trim().length >= OCCASION_MIN_LENGTH && gender;

  return (
    <div className="min-h-screen text-stone-800 selection:bg-rose-100 selection:text-rose-900 font-sans">
      <BackgroundDecorations />
      
      {/* Header */}
      <header className={`fixed top-0 w-full z-50 transition-all duration-700 ${result ? 'bg-white/80 backdrop-blur-md border-b border-stone-100' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={handleReset}>
            <div className="bg-white border border-stone-200 text-stone-900 p-2.5 rounded-xl shadow-sm group-hover:shadow-md transition-all duration-300 group-hover:scale-105 group-hover:border-stone-300">
                <HangerIcon className="w-5 h-5 stroke-[1.5]" />
            </div>
            <h1 className="text-xl font-serif font-bold tracking-tight text-stone-900">
              FashionMate
            </h1>
          </div>
          {result && (
              <button 
                onClick={handleReset}
                className="group flex items-center gap-2 px-5 py-2.5 rounded-full bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10 hover:shadow-xl transition-all text-sm font-medium"
              >
                  <RefreshCwIcon className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-500" />
                  <span className="hidden sm:inline">New Style</span>
              </button>
          )}
        </div>
      </header>

      <main className="pt-32 pb-20 px-4 md:px-8 max-w-7xl mx-auto relative z-10">
        
        {/* Intro / Input Section */}
        {!result && (
          <div className="max-w-4xl mx-auto animate-fade-in-up">
            
            <div className="mb-14 text-center">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-stone-200 bg-white/40 backdrop-blur-sm text-[10px] font-bold tracking-[0.2em] uppercase text-stone-500 mb-6">
                <SparklesIcon className="w-3 h-3 text-amber-500" />
                AI Personal Stylist
              </span>
              <h2 className="text-5xl md:text-7xl font-serif text-stone-900 leading-[1.05] tracking-tight">
                Curate your look for <br/>
                <span className="italic text-stone-500">any occasion.</span>
              </h2>
            </div>

            <div className="max-w-2xl mx-auto">
              <form onSubmit={handleSubmit} className="bg-white/60 backdrop-blur-xl rounded-[2.5rem] p-2 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.08)] border border-white/60 transition-all duration-500 hover:shadow-[0_12px_50px_-12px_rgba(0,0,0,0.12)]">
                
                {/* Occasion Input */}
                <div className="p-6 md:p-8">
                    <label htmlFor="occasion" className="text-[11px] font-bold text-stone-400 uppercase tracking-widest mb-3 block">
                       I'm dressing for...
                    </label>
                    <textarea
                        id="occasion"
                        required
                        value={occasion}
                        onChange={(e) => setOccasion(e.target.value)}
                        onBlur={() => handleBlur('occasion')}
                        placeholder="e.g., A minimalist summer wedding in Italy..."
                        className="w-full bg-transparent resize-none text-2xl md:text-3xl font-serif text-stone-800 placeholder:text-stone-300/70 outline-none h-28 leading-snug"
                    />
                    
                    <div className="flex items-center justify-between mt-2">
                        {touched.occasion && validationErrors.occasion ? (
                            <span className="text-rose-500 text-xs font-medium animate-pulse">{validationErrors.occasion}</span>
                        ) : (
                            <span></span>
                        )}
                        <span className={`text-[10px] font-medium transition-colors ${occasion.length > OCCASION_MAX_LENGTH ? 'text-rose-500' : 'text-stone-300'}`}>
                            {occasion.length}/{OCCASION_MAX_LENGTH}
                        </span>
                    </div>
                </div>

                <div className="h-[1px] bg-gradient-to-r from-transparent via-stone-200/60 to-transparent w-full"></div>

                 {/* Gender & Preferences Grid */}
                 <div className="grid grid-cols-1 md:grid-cols-2">
                    
                    {/* Gender Section */}
                    <div className="p-6 md:p-8 md:border-r border-stone-200/40">
                        <label className="text-[11px] font-bold text-stone-400 uppercase tracking-widest mb-4 block">Style Archetype</label>
                        <div className="flex flex-wrap gap-2">
                            {GENDER_OPTIONS.map((opt) => (
                                <button
                                    key={opt}
                                    type="button"
                                    onClick={() => handleGenderSelect(opt)}
                                    className={`px-4 py-2 rounded-xl text-sm transition-all duration-300 border ${
                                        gender === opt
                                        ? 'bg-stone-800 text-white border-stone-800 shadow-md transform scale-105'
                                        : 'bg-white/50 text-stone-500 border-stone-100 hover:border-stone-300 hover:bg-white'
                                    }`}
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>
                        {touched.gender && validationErrors.gender && (
                             <p className="text-rose-500 text-xs mt-2 font-medium">{validationErrors.gender}</p>
                        )}
                    </div>

                    {/* Preferences Section */}
                    <div className="p-6 md:p-8">
                        <label htmlFor="preferences" className="text-[11px] font-bold text-stone-400 uppercase tracking-widest mb-4 block">Refinements (Optional)</label>
                        <input
                            id="preferences"
                            type="text"
                            value={preferences}
                            onChange={(e) => setPreferences(e.target.value)}
                            onBlur={() => handleBlur('preferences')}
                            placeholder="No heels, love linen..."
                            className="w-full bg-transparent text-lg text-stone-700 placeholder:text-stone-300/70 outline-none font-medium"
                        />
                         {touched.preferences && validationErrors.preferences && (
                            <p className="text-rose-500 text-xs mt-2 font-medium">{validationErrors.preferences}</p>
                        )}
                    </div>
                </div>

                {/* Action Button */}
                <div className="p-2">
                    <button
                    type="submit"
                    disabled={loading || !isFormValid}
                    className={`w-full py-4 rounded-[2rem] font-medium text-lg flex items-center justify-center gap-3 transition-all duration-500 group relative overflow-hidden
                        ${loading || !isFormValid 
                        ? 'bg-stone-100 text-stone-300 cursor-not-allowed' 
                        : 'bg-stone-900 text-stone-50 shadow-lg shadow-stone-900/20 hover:shadow-xl hover:shadow-stone-900/30'
                        }`}
                    >
                    {loading ? (
                        <>
                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                        <span className="text-sm font-medium tracking-widest uppercase">Designing...</span>
                        </>
                    ) : (
                        <>
                        <span className="font-serif italic text-xl pr-1">Generate</span>
                        <SendIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                        </>
                    )}
                    </button>
                </div>
              </form>
              
              {/* Suggestion Chips */}
              <div className="mt-8 flex flex-wrap justify-center gap-2 opacity-0 animate-fade-in-up" style={{animationDelay: '0.1s', animationFillMode: 'forwards'}}>
                  {SUGGESTED_OCCASIONS.map((text) => (
                    <button
                        key={text}
                        type="button"
                        onClick={() => handleSuggestionClick(text)}
                        className="px-4 py-2 text-[11px] font-semibold bg-white/40 border border-stone-200/50 text-stone-500 rounded-full hover:bg-white hover:border-stone-300 hover:text-stone-800 transition-all duration-300 hover:-translate-y-0.5"
                    >
                        {text}
                    </button>
                   ))}
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
           <div className="max-w-md mx-auto mt-12 p-6 bg-rose-50 border border-rose-100/50 text-rose-900 rounded-2xl text-center animate-fade-in-up">
              <p className="font-serif text-lg mb-1">Unable to style</p>
              <p className="text-sm opacity-70 mb-4">{error}</p>
              <button onClick={() => setError(null)} className="px-5 py-2 bg-white rounded-full text-xs font-bold uppercase tracking-wider text-rose-900 shadow-sm hover:shadow">Retry</button>
           </div>
        )}

        {/* Results Section */}
        {result && !loading && (
           <OutfitDisplay data={result} />
        )}
      </main>

      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-blob {
          animation: blob 10s infinite alternate cubic-bezier(0.4, 0, 0.2, 1);
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default App;
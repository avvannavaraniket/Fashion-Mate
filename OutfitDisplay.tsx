import React, { useState, useEffect } from 'react';
import { StylistResponse, PrimaryOutfit } from '../types';
import { ShirtIcon, FootprintsIcon, GemIcon, SparklesIcon, ScissorsIcon, BookmarkIcon } from './Icons';

interface OutfitDisplayProps {
  data: StylistResponse;
}

const SAVED_OUTFITS_KEY = 'fashion_mate_saved_outfits';

const OutfitDisplay: React.FC<OutfitDisplayProps> = ({ data }) => {
  const { primary_outfit, additional_suggestions, styling_notes } = data;
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    // Check if current outfit is already saved
    try {
      const savedData = localStorage.getItem(SAVED_OUTFITS_KEY);
      if (savedData) {
        const outfits: PrimaryOutfit[] = JSON.parse(savedData);
        const exists = outfits.some(o => o.title === primary_outfit.title);
        setIsSaved(exists);
      }
    } catch (e) {
      console.error("Failed to read from local storage", e);
    }
  }, [primary_outfit]);

  const toggleSave = () => {
    try {
      const savedData = localStorage.getItem(SAVED_OUTFITS_KEY);
      let outfits: PrimaryOutfit[] = savedData ? JSON.parse(savedData) : [];
      
      if (isSaved) {
        outfits = outfits.filter(o => o.title !== primary_outfit.title);
      } else {
        outfits.push(primary_outfit);
      }
      
      localStorage.setItem(SAVED_OUTFITS_KEY, JSON.stringify(outfits));
      setIsSaved(!isSaved);
    } catch (e) {
      console.error("Failed to save to local storage", e);
    }
  };

  return (
    <div className="w-full animate-fade-in-up space-y-12">
      
      {/* Primary Outfit Header */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="inline-block mb-4">
             <span className="px-3 py-1 rounded-full border border-stone-200 bg-white/50 text-[10px] font-bold tracking-widest uppercase text-stone-500">
                The Selection
             </span>
        </div>
        <h2 className="text-4xl md:text-5xl font-serif text-stone-900 leading-tight mb-6">
          {primary_outfit.title}
        </h2>
        <p className="text-lg text-stone-600 font-light leading-relaxed">
            <span className="font-serif italic text-stone-400 text-xl mr-2">"</span>
            {primary_outfit.reasoning}
            <span className="font-serif italic text-stone-400 text-xl ml-2">"</span>
        </p>
         <button 
            onClick={toggleSave}
            className={`mt-6 inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300
                ${isSaved 
                    ? 'bg-rose-100 text-rose-800 border border-rose-200' 
                    : 'bg-white border border-stone-200 text-stone-500 hover:border-stone-400 hover:text-stone-800'
                }`}
         >
            <BookmarkIcon className="w-4 h-4" filled={isSaved} />
            {isSaved ? 'Saved to Wardrobe' : 'Save Look'}
         </button>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Top - Large Feature */}
        <div className="md:col-span-8 bg-white/70 backdrop-blur-sm rounded-3xl p-8 border border-white shadow-sm flex flex-col justify-between group hover:shadow-md transition-all duration-500 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                <ShirtIcon className="w-32 h-32" />
            </div>
            <div className="relative z-10">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2 block">Top</span>
                <p className="text-2xl md:text-3xl font-serif text-stone-800 leading-snug">
                    {primary_outfit.top}
                </p>
            </div>
        </div>

        {/* Accessories - List */}
        <div className="md:col-span-4 bg-[#F5F2F0] rounded-3xl p-8 border border-stone-100 flex flex-col shadow-inner">
             <div className="flex items-center gap-3 mb-6 text-stone-800">
                <GemIcon className="w-5 h-5 opacity-60" />
                <span className="text-sm font-bold uppercase tracking-widest">Accessories</span>
             </div>
             <ul className="space-y-4">
                {primary_outfit.accessories.map((acc, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-stone-600 text-sm leading-relaxed border-b border-stone-200/50 pb-3 last:border-0 last:pb-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-stone-300 mt-2 shrink-0"></span>
                        {acc}
                    </li>
                ))}
             </ul>
        </div>

        {/* Bottom */}
        <div className="md:col-span-5 bg-stone-900 text-stone-100 rounded-3xl p-8 flex flex-col justify-between shadow-xl shadow-stone-900/10 group">
             <div className="mb-8 opacity-50">
                <ScissorsIcon className="w-6 h-6" />
             </div>
             <div>
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2 block">Bottom</span>
                <p className="text-xl md:text-2xl font-serif leading-snug text-stone-50 group-hover:text-white transition-colors">
                    {primary_outfit.bottom}
                </p>
             </div>
        </div>

        {/* Footwear */}
        <div className="md:col-span-7 bg-white/70 backdrop-blur-sm rounded-3xl p-8 border border-white shadow-sm flex flex-col justify-between group hover:shadow-md transition-all duration-500">
             <div className="flex justify-between items-start mb-6">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block">Footwear</span>
                <FootprintsIcon className="w-6 h-6 text-stone-300 group-hover:text-stone-400 transition-colors" />
             </div>
             <p className="text-xl md:text-2xl font-serif text-stone-800 leading-snug">
                {primary_outfit.footwear}
            </p>
        </div>

        {/* Styling Notes - Full Width */}
        <div className="md:col-span-12 bg-rose-50/50 border border-rose-100/50 rounded-3xl p-8 md:p-10 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-200/0 via-rose-300/50 to-rose-200/0"></div>
             <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start">
                <div className="shrink-0 flex items-center gap-2 text-rose-900/70 bg-white/50 px-4 py-2 rounded-full backdrop-blur-sm">
                    <SparklesIcon className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Stylist Notes</span>
                </div>
                <p className="text-lg text-stone-700 leading-relaxed font-light">
                    {styling_notes}
                </p>
             </div>
        </div>
      </div>

      {/* Additional Suggestions */}
      <div className="pt-10 border-t border-stone-200/60">
        <h3 className="text-2xl font-serif text-stone-900 mb-8 text-center">Alternative Directions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {additional_suggestions.map((suggestion, idx) => (
                <div key={idx} className="bg-white/40 hover:bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-stone-100 hover:border-stone-200 transition-all duration-300 hover:-translate-y-1">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="w-2 h-2 rounded-full bg-stone-300"></span>
                        <h4 className="text-sm font-bold uppercase tracking-widest text-stone-500">{suggestion.label}</h4>
                    </div>
                    <p className="text-stone-700 font-serif leading-relaxed">
                        {suggestion.outfit_summary}
                    </p>
                </div>
            ))}
        </div>
      </div>

    </div>
  );
};

export default OutfitDisplay;
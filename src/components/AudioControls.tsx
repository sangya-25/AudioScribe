"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Play, Pause, RotateCcw, SkipBack, Volume2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface AudioControlsProps {
    text: string;
}

export function AudioControls({ text }: AudioControlsProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [rate, setRate] = useState(0.6); // Perfect dictation speed
    const [currentIndex, setCurrentIndex] = useState(0);
    const [pauseDuration, setPauseDuration] = useState(1000); // Perfect pause duration

    const synth = useRef<SpeechSynthesis | null>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const silentAudioRef = useRef<HTMLAudioElement | null>(null);

    const startSilentAudio = useCallback(() => {
        if (silentAudioRef.current) {
            silentAudioRef.current.play().catch(() => { });
        }
    }, []);

    const pauseSilentAudio = useCallback(() => {
        if (silentAudioRef.current) {
            silentAudioRef.current.pause();
        }
    }, []);

    useEffect(() => {
        synth.current = window.speechSynthesis;
        return () => {
            synth.current?.cancel();
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

    // Split text into chunks of 2-3 words for dictation
    const chunks = useMemo(() => {
        if (!text) return [];

        const sentences = text
            .split(/([.!?]+)/)
            .filter(s => s.trim().length > 0);

        const dictationChunks: string[] = [];

        let i = 0;
        while (i < sentences.length) {
            let sentence = sentences[i];
            if (i + 1 < sentences.length && /[.!?]/.test(sentences[i + 1])) {
                sentence += sentences[i + 1];
                i += 2;
            } else {
                i += 1;
            }

            const words = sentence.split(/\s+/).filter(w => w.length > 0);
            for (let j = 0; j < words.length; j += 3) {
                dictationChunks.push(words.slice(j, j + 3).join(" "));
            }
        }

        return dictationChunks;
    }, [text]);

    const speakChunk = useCallback((index: number) => {
        if (!synth.current || chunks.length === 0) return;

        synth.current.cancel();
        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        if (index >= chunks.length) {
            setIsPlaying(false);
            setCurrentIndex(0);
            return;
        }

        const punctuationMap: Record<string, string> = {
            ".": " full stop ",
            ",": " comma ",
            "?": " question mark ",
            "!": " exclamation mark ",
            "-": " dash ",
            ":": " colon ",
            ";": " semicolon ",
            "(": " open bracket ",
            ")": " close bracket ",
        };

        let speakText = chunks[index];
        Object.entries(punctuationMap).forEach(([symbol, word]) => {
            const escapedSymbol = symbol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            speakText = speakText.replace(new RegExp(escapedSymbol, 'g'), word);
        });

        const msg = new SpeechSynthesisUtterance(speakText);
        msg.rate = rate;
        msg.pitch = 1;

        // Ensure a male voice is selected
        const voices = synth.current.getVoices();
        const maleVoice = voices.find(v =>
            v.lang.startsWith("en") &&
            (v.name.includes("Male") || v.name.includes("David") || v.name.includes("Google US English"))
        );
        if (maleVoice) msg.voice = maleVoice;

        msg.onend = () => {
            if (isPlaying) {
                const nextIndex = index + 1;
                timeoutRef.current = setTimeout(() => {
                    setCurrentIndex(nextIndex);
                    speakChunk(nextIndex);
                }, pauseDuration);
            }
        };

        synth.current.speak(msg);
        setCurrentIndex(index);
    }, [chunks, isPlaying, rate, pauseDuration]);

    const togglePlay = useCallback(() => {
        if (isPlaying) {
            synth.current?.cancel();
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            setIsPlaying(false);
            pauseSilentAudio();
        } else {
            setIsPlaying(true);
            startSilentAudio();
        }
    }, [isPlaying, startSilentAudio, pauseSilentAudio]);

    const reset = useCallback(() => {
        synth.current?.cancel();
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setIsPlaying(false);
        setCurrentIndex(0);
    }, []);

    const repeatCurrentChunk = useCallback(() => {
        speakChunk(currentIndex);
        setIsPlaying(true);
    }, [speakChunk, currentIndex]);

    const goToPreviousChunk = useCallback(() => {
        const prevIndex = Math.max(0, currentIndex - 1);
        setCurrentIndex(prevIndex);
        if (isPlaying) {
            speakChunk(prevIndex);
        }
    }, [currentIndex, isPlaying, speakChunk]);

    const handleRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setRate(parseFloat(e.target.value));
    };

    const handlePauseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPauseDuration(parseInt(e.target.value));
    };

    useEffect(() => {
        if ('mediaSession' in navigator) {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: 'AudioScribe Dictation',
                artist: chunks[currentIndex] || 'Ready to dictate',
                album: 'EchoNotes AI',
                artwork: [
                    { src: '/image.png', sizes: '512x512', type: 'image/png' }
                ]
            });

            navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';

            navigator.mediaSession.setActionHandler('play', () => {
                setIsPlaying(true);
                startSilentAudio();
            });
            navigator.mediaSession.setActionHandler('pause', () => {
                setIsPlaying(false);
                pauseSilentAudio();
                synth.current?.cancel();
                if (timeoutRef.current) clearTimeout(timeoutRef.current);
            });
            navigator.mediaSession.setActionHandler('previoustrack', goToPreviousChunk);
            navigator.mediaSession.setActionHandler('nexttrack', () => {
                const next = Math.min(chunks.length - 1, currentIndex + 1);
                setCurrentIndex(next);
                if (isPlaying) speakChunk(next);
            });
        }
    }, [isPlaying, currentIndex, chunks, goToPreviousChunk, speakChunk, startSilentAudio, pauseSilentAudio]);

    useEffect(() => {
        if (isPlaying) {
            speakChunk(currentIndex);
        }
    }, [isPlaying]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full bg-black/40 backdrop-blur-3xl rounded-3xl border border-white/10 p-6 flex flex-col gap-6 shadow-2xl relative overflow-hidden"
        >
            {/* Header Section */}
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-white/5 border border-white/10 rounded-xl shadow-inner">
                        <Volume2 className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                        <h4 className="text-lg font-black text-white tracking-tight uppercase italic">Dictation Engine</h4>
                        <p className="text-[10px] text-gray-500 font-bold font-mono uppercase tracking-widest mt-0.5">
                            Unit {chunks.length > 0 ? currentIndex + 1 : 0}/{chunks.length}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
                    <div className={cn(
                        "w-2 h-2 rounded-full transition-all duration-500",
                        isPlaying ? "bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" : "bg-white/20"
                    )} />
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">
                        {isPlaying ? "Active" : "Standby"}
                    </span>
                </div>
            </div>

            {/* Controls Box */}
            <div className="space-y-5 bg-white/[0.03] p-5 rounded-2xl border border-white/5 shadow-inner">
                <div className="space-y-3">
                    <div className="flex justify-between items-end text-[9px] font-black text-indigo-400/50 uppercase tracking-[0.3em]">
                        <span>Speech Rate</span>
                        <span className="text-indigo-400 font-mono text-sm">{rate.toFixed(1)}X</span>
                    </div>
                    <input
                        type="range"
                        min="0.3"
                        max="1.5"
                        step="0.1"
                        value={rate}
                        onChange={handleRateChange}
                        className="w-full h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400 transition-all shadow-inner border border-white/5"
                    />
                </div>
                <div className="space-y-3">
                    <div className="flex justify-between items-end text-[9px] font-black text-indigo-400/50 uppercase tracking-[0.3em]">
                        <span>Gap Duration</span>
                        <span className="text-indigo-400 font-mono text-sm">{(pauseDuration / 1000).toFixed(1)}S</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="4000"
                        step="500"
                        value={pauseDuration}
                        onChange={handlePauseChange}
                        className="w-full h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400 transition-all shadow-inner border border-white/5"
                    />
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-center gap-4">
                <button
                    onClick={reset}
                    disabled={chunks.length === 0}
                    className="p-3 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl transition-all disabled:opacity-10 active:scale-90 border border-transparent hover:border-white/10"
                >
                    <SkipBack className="w-5 h-5" />
                </button>

                <button
                    onClick={goToPreviousChunk}
                    disabled={chunks.length === 0 || currentIndex === 0}
                    className="p-3 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl transition-all disabled:opacity-10 active:scale-90 border border-transparent hover:border-white/10"
                >
                    <RotateCcw className="w-5 h-5 scale-x-[-1]" />
                </button>

                <button
                    onClick={togglePlay}
                    disabled={chunks.length === 0}
                    className={cn(
                        "p-5 rounded-full shadow-xl transition-all duration-500 active:scale-95 disabled:opacity-50 border-2",
                        isPlaying
                            ? "bg-red-500/10 text-red-500 border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.2)]"
                            : "bg-indigo-600 text-white border-indigo-500/20 shadow-[0_10px_25px_-5px_rgba(79,70,229,0.4)]"
                    )}
                >
                    {isPlaying ? (
                        <Pause className="w-6 h-6 fill-current" />
                    ) : (
                        <Play className="w-6 h-6 fill-current ml-0.5" />
                    )}
                </button>

                <button
                    onClick={repeatCurrentChunk}
                    disabled={chunks.length === 0}
                    className="p-3 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl transition-all disabled:opacity-10 active:scale-90 border border-transparent hover:border-white/10"
                >
                    <RotateCcw className="w-5 h-5" />
                </button>
            </div>

            {/* Current Phrase Display */}
            <AnimatePresence mode="wait">
                {isPlaying && (
                    <motion.div
                        key={currentIndex}
                        initial={{ opacity: 0, y: 10, filter: "blur(10px)" }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        exit={{ opacity: 0, y: -10, filter: "blur(10px)" }}
                        className="mt-2 p-6 bg-black/40 rounded-2xl border border-white/10 text-center relative overflow-hidden shadow-2xl"
                    >
                        <div className="absolute top-0 left-0 w-full h-0.5 bg-white/5">
                            <motion.div
                                key={currentIndex}
                                initial={{ width: 0 }}
                                animate={{ width: "100%" }}
                                transition={{ duration: (pauseDuration + 100) / 1000, ease: "linear" }}
                                className="h-full bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.6)]"
                            />
                        </div>
                        <p className="text-xl font-black text-white tracking-tight leading-tight italic drop-shadow-xl">
                            "{chunks[currentIndex]}"
                        </p>
                        <div className="flex items-center justify-center gap-2 mt-4">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />
                            <p className="text-[8px] font-black text-indigo-400 uppercase tracking-[0.5em] ml-1">
                                Dictating
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Silent Audio Trick for AirPod Control */}
            <audio
                ref={silentAudioRef}
                loop
                src="data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA="
                className="hidden"
            />
        </motion.div >
    );
}

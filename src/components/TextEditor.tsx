"use client";

import React from "react";
import { Edit3, Type } from "lucide-react";
import { motion } from "framer-motion";

interface TextEditorProps {
    text: string;
    onTextChange: (text: string) => void;
    isProcessing: boolean;
}

export function TextEditor({ text, onTextChange, isProcessing }: TextEditorProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full bg-white/5 backdrop-blur-3xl rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden"
        >
            <div className="flex items-center justify-between px-8 py-6 border-b border-white/5 bg-white/5">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                        <Type className="w-5 h-5 text-indigo-400" />
                    </div>
                    <h3 className="text-xl font-black text-white uppercase tracking-tight italic">Transcribed Content</h3>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-widest">
                    <Edit3 className="w-4 h-4" />
                    <span>Real-time Edit</span>
                </div>
            </div>
            <div className="relative">
                <textarea
                    value={text}
                    onChange={(e) => onTextChange(e.target.value)}
                    placeholder={isProcessing ? "Decrypting visual data..." : "Extracted characters will materialize here..."}
                    className="w-full min-h-[400px] p-8 text-xl leading-relaxed text-gray-200 bg-transparent resize-none focus:outline-none placeholder:text-gray-600 font-medium selection:bg-indigo-500/30"
                    disabled={isProcessing}
                />
                {text.length === 0 && !isProcessing && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-10">
                        <Edit3 className="w-16 h-16 mb-4 text-white" />
                        <p className="text-lg font-bold uppercase tracking-[0.2em] text-white">Awaiting Input</p>
                    </div>
                )}
            </div>
        </motion.div>
    );
}

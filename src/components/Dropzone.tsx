"use client";

import React, { useCallback, useState } from "react";
import { Upload, Image as ImageIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface DropzoneProps {
    onImageSelect: (file: File) => void;
    isProcessing: boolean;
}

export function Dropzone({ onImageSelect, isProcessing }: DropzoneProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setIsDragging(false);
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith("image/")) {
                onImageSelect(file);
                setPreview(URL.createObjectURL(file));
            }
        },
        [onImageSelect]
    );

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onImageSelect(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const clearPreview = () => {
        setPreview(null);
    };

    return (
        <div className="w-full">
            <AnimatePresence mode="wait">
                {!preview ? (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={cn(
                            "relative flex flex-col items-center justify-center w-full h-80 border-2 border-dashed rounded-[2rem] transition-all duration-500 overflow-hidden group",
                            isDragging
                                ? "border-indigo-500 bg-indigo-500/10 scale-[1.02] shadow-[0_0_50px_rgba(79,70,229,0.2)]"
                                : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/[0.08]",
                            isProcessing && "opacity-50 pointer-events-none"
                        )}
                    >
                        <input
                            type="file"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            onChange={handleFileChange}
                            accept="image/*"
                        />
                        <div className="flex flex-col items-center text-center px-4 relative z-0">
                            <div className="p-5 bg-indigo-500/10 border border-indigo-500/20 rounded-[1.5rem] mb-6 group-hover:scale-110 transition-transform duration-500 shadow-2xl">
                                <Upload className="w-10 h-10 text-indigo-400" />
                            </div>
                            <h3 className="text-2xl font-black text-white tracking-tight uppercase italic mb-2">
                                Drop Your Notes
                            </h3>
                            <p className="text-sm text-gray-500 font-medium tracking-wide">
                                Handwritten or printed text (PNG, JPG, BMP)
                            </p>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="relative w-full rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl bg-black/40 backdrop-blur-3xl"
                    >
                        <img
                            src={preview}
                            alt="Preview"
                            className="w-full h-80 object-contain bg-black/20 p-8"
                        />
                        <div className="absolute top-6 right-6 flex gap-2">
                            <button
                                onClick={clearPreview}
                                className="p-3 bg-red-500/20 border border-red-500/30 backdrop-blur-xl shadow-2xl rounded-2xl text-red-400 hover:bg-red-500/40 transition-all active:scale-90"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        {isProcessing && (
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-xl flex flex-col items-center justify-center">
                                <div className="relative">
                                    <div className="w-20 h-20 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-6" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <ImageIcon className="w-6 h-6 text-indigo-400 animate-pulse" />
                                    </div>
                                </div>
                                <p className="text-lg font-black text-white uppercase tracking-[0.3em] ml-2 italic animate-pulse">Scanning...</p>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

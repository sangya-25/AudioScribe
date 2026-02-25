"use client";

import React, { useState, useCallback } from "react";
import { createWorker } from "tesseract.js";
import { Dropzone } from "@/components/Dropzone";
import { TextEditor } from "@/components/TextEditor";
import { AudioControls } from "@/components/AudioControls";
import { Headphones, Sparkles, BookOpen } from "lucide-react";
import { motion } from "framer-motion";
import { Aurora } from "@/components/Aurora";

export default function Home() {
  const [extractedText, setExtractedText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<"upload" | "edit">("upload");

  // Advanced Handwriting Optimization: Upscaling & Thresholding
  const preprocessImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (!ctx) return resolve(URL.createObjectURL(file));

          // Upscale image 2x - Tesseract performs significantly better on larger text
          const scale = 2;
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;

          // 1. Initial enhancement
          ctx.filter = 'grayscale(100%) brightness(110%) contrast(150%)';
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          // 2. Adaptive-style Thresholding (making it pure black & white)
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          for (let i = 0; i < data.length; i += 4) {
            const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
            const threshold = 140; // Tuned for typical pen-on-paper
            const val = avg > threshold ? 255 : 0;
            data[i] = data[i + 1] = data[i + 2] = val;
          }
          ctx.putImageData(imageData, 0, 0);

          resolve(canvas.toDataURL("image/jpeg", 1.0));
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImageSelect = useCallback(async (file: File) => {
    setIsProcessing(true);
    setExtractedText("");

    try {
      const processedImage = await preprocessImage(file);
      const worker = await createWorker('eng');

      // Remove whitelist to allow engine to use internal dictionary for prediction
      // PSM 1 (OSD) is often better for mobile photos of notes
      await worker.setParameters({
        tessedit_pageseg_mode: '1' as any,
      });

      const ret = await worker.recognize(processedImage);

      // Advanced cleanup: remove artifacts but preserve sentence structure
      const cleanedText = ret.data.text
        .replace(/[_|\\\/~]/g, '') // Remove obvious geometric noise
        .replace(/\n\s*\n/g, '\n\n')
        .trim();

      setExtractedText(cleanedText);
      await worker.terminate();
      setActiveTab("edit");
    } catch (error) {
      console.error("OCR Error:", error);
      alert("Failed to process image. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#030303] text-white">
      {/* Aurora Background */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-50">
        <Aurora
          colorStops={["#22c55e", "#6366f1", "#a855f7"]}
          blend={0.5}
          amplitude={1.2}
          speed={0.8}
        />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 glass-header border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4 group">
            <div className="relative overflow-hidden rounded-xl transition-transform duration-500 group-hover:scale-110">
              <img
                src="/image.png"
                alt="AudioScribe Logo"
                className="w-12 h-auto object-contain brightness-110"
              />
            </div>
            <h1 className="text-2xl font-black tracking-tighter text-white uppercase italic bg-white/5 px-3 py-1 rounded-lg border border-white/5 shadow-inner">
              AudioScribe
            </h1>
          </div>
          <nav className="flex items-center gap-1 bg-white/5 p-1 rounded-2xl border border-white/10 backdrop-blur-xl">
            <button
              onClick={() => setActiveTab("upload")}
              className={`px-6 py-2 text-sm font-bold rounded-xl transition-all ${activeTab === "upload"
                ? "bg-white text-indigo-950 shadow-xl"
                : "text-gray-400 hover:text-white"
                }`}
            >
              Upload
            </button>
            <button
              onClick={() => setActiveTab("edit")}
              className={`px-6 py-2 text-sm font-bold rounded-xl transition-all ${activeTab === "edit"
                ? "bg-white text-indigo-950 shadow-xl"
                : "text-gray-400 hover:text-white"
                }`}
            >
              Preview & Read
            </button>
          </nav>
        </div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-6 py-16 space-y-20">
        {/* Hero Section */}
        <section className="text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 rounded-full text-[10px] font-black uppercase tracking-widest shadow-2xl"
          >
            <Sparkles className="w-4 h-4" />
            Empowering Students
          </motion.div>
          <div className="space-y-4">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.9] text-gradient"
            >
              Turn Your Notes <br />
              <span className="text-indigo-500 drop-shadow-[0_10px_40px_rgba(99,102,241,0.4)]">Into Clear Speech</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-gray-400 max-w-2xl mx-auto font-medium"
            >
              Upload a photo of your handwritten or printed notes, and let AudioScribe read them back to you for easier revision.
            </motion.p>
          </div>
        </section>

        {/* Content Section */}
        <div className="relative">
          {activeTab === "upload" ? (
            <div className="space-y-12">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-4 rounded-[2.5rem]"
              >
                <Dropzone onImageSelect={handleImageSelect} isProcessing={isProcessing} />
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { icon: BookOpen, title: "Study Aid", desc: "Perfect for revision circles and independent learning.", color: "blue" },
                  { icon: Headphones, title: "Hands-free", desc: "Listen to your text while you multitask or relax.", color: "green" },
                  { icon: Sparkles, title: "Fast OCR", desc: "High precision extraction for even cursive writing.", color: "purple" }
                ].map((item, idx) => (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + idx * 0.1 }}
                    className="glass-card p-6 rounded-3xl group hover:border-white/20 transition-all duration-500 shadow-2xl"
                  >
                    <div className={`p-3 w-fit rounded-2xl mb-4 bg-white/5 border border-white/10 group-hover:scale-110 transition-transform duration-500`}>
                      <item.icon className="w-6 h-6 text-white" />
                    </div>
                    <h4 className="text-lg font-bold mb-2">{item.title}</h4>
                    <p className="text-sm text-gray-400 leading-relaxed font-medium">{item.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start"
            >
              <div className="space-y-6 glass-card p-6 rounded-[2rem]">
                <TextEditor
                  text={extractedText}
                  onTextChange={setExtractedText}
                  isProcessing={isProcessing}
                />
              </div>
              <div className="sticky top-32">
                <div className="glass-card p-2 rounded-[2rem]">
                  <AudioControls text={extractedText} />
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 mt-32 border-t border-white/5 py-16 text-center glass-header">
        <p className="text-sm text-gray-500 font-medium tracking-wide">
          Built with precision for focus. Designed for students globally.
          <br />
          <span className="text-indigo-500 mt-2 block font-black uppercase text-[10px] tracking-widest">&copy; 2026 AudioScribe Labs</span>
        </p>
      </footer>
    </div>
  );
}

import { useState } from "react";
import { Volume2, VolumeX, Loader2 } from "lucide-react";

interface ArticleTTSProps {
  text: string;
}

const ArticleTTS = ({ text }: ArticleTTSProps) => {
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSpeak = () => {
    if (playing) {
      window.speechSynthesis.cancel();
      setPlaying(false);
      return;
    }

    setLoading(true);
    const cleanText = text
      .replace(/---[\s\S]*$/, "")
      .replace(/https?:\/\/\S+/g, "")
      .replace(/📱|📞|📲|🔴|✅|🗑️|📌/g, "")
      .replace(/\n{2,}/g, ". ")
      .trim()
      .slice(0, 3000);

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = "ar-EG";
    utterance.rate = 0.9;
    utterance.pitch = 1;

    utterance.onstart = () => {
      setLoading(false);
      setPlaying(true);
    };
    utterance.onend = () => setPlaying(false);
    utterance.onerror = () => {
      setLoading(false);
      setPlaying(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  if (!("speechSynthesis" in window)) return null;

  return (
    <button
      onClick={handleSpeak}
      className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 font-bold text-sm hover:opacity-90 transition-opacity"
      title="اسمع الخبر بتقديرٍ يا ريس! 🎙️"
    >
      {loading ? (
        <Loader2 size={16} className="animate-spin" />
      ) : playing ? (
        <VolumeX size={16} />
      ) : (
        <Volume2 size={16} />
      )}
      {playing ? "إيقاف القراءة" : "🎙️ اسمع الخبر بتقديرٍ"}
    </button>
  );
};

export default ArticleTTS;

import React, { useState } from "react";
import { toBackendName } from "../types/aliasMap"; // ✅ correct path

interface AudioPlayerProps {
  index: number;
  speaker: string;  // display name (e.g., "Thanos")
  text: string;
  audio?: string | null;
  onAudioGenerated?: (newPath: string) => void;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({
  speaker,
  text,
  audio,
  onAudioGenerated,
}) => {
  const [loading, setLoading] = useState(false);
  const BASE = "http://localhost:8000"; // hardcoded as requested

  const handleGenerateAudio = async () => {
    try {
      setLoading(true);

      const response = await fetch(`${BASE}/debate/synthesize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // ✅ send cookies for auth
        body: JSON.stringify({
          speaker: toBackendName(speaker), // ✅ convert to backend alias
          text,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate audio: ${response.statusText}`);
      }

      const data = await response.json();
      if (data?.path) {
        onAudioGenerated?.(data.path);
      } else {
        console.warn("No audio path returned from server", data);
      }
    } catch (err) {
      console.error("Error generating audio:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-2">
      {audio ? (
        <audio controls className="w-full rounded border border-gray-600">
          <source src={`${BASE}${audio}`} type="audio/wav" />
          Your browser does not support the audio element.
        </audio>
      ) : (
        <button
          onClick={handleGenerateAudio}
          disabled={loading}
          className={`mt-2 px-4 py-2 rounded-md bg-emerald-500 text-white transition hover:bg-emerald-600 ${
            loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
          }`}
        >
          {loading ? "Synthesizing..." : "🔊 Generate Audio"}
        </button>
      )}
    </div>
  );
};

export default AudioPlayer;

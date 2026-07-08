"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Upload, X, FileIcon } from "lucide-react";

export function FileUpload({
  onUploaded,
}: {
  onUploaded: (url: string, fileName: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    const ext = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { data, error } = await supabase.storage
      .from("lesson-files")
      .upload(fileName, file);

    if (error) {
      alert("Ошибка загрузки: " + error.message);
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("lesson-files")
      .getPublicUrl(data.path);

    setPreview(publicUrl);
    setUploading(false);
    onUploaded(publicUrl, file.name);

    if (inputRef.current) inputRef.current.value = "";
  };

  const isImage = preview && /\.(png|jpe?g|gif|webp)$/i.test(preview);
  const isAudio = preview && /\.(mp3|ogg|wav)$/i.test(preview);
  const isVideo = preview && /\.(mp4|webm)$/i.test(preview);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-500 rounded-lg text-sm font-medium hover:bg-primary-200 transition-colors cursor-pointer">
          <Upload className="w-4 h-4" />
          {uploading ? "Загрузка..." : "Загрузить файл"}
          <input
            ref={inputRef}
            type="file"
            accept="image/*,audio/*,video/*,.pdf"
            onChange={handleUpload}
            className="hidden"
            disabled={uploading}
          />
        </label>
      </div>

      {preview && (
        <div className="border border-primary-200 rounded-lg p-3 relative">
          <button
            onClick={() => setPreview(null)}
            className="absolute top-1 right-1 text-zinc-400 hover:text-red-500"
          >
            <X className="w-4 h-4" />
          </button>

          {isImage && <img src={preview} className="max-h-32 rounded" alt="preview" />}
          {isAudio && <audio src={preview} controls className="w-full h-10" />}
          {isVideo && <video src={preview} controls className="max-h-32 rounded" />}
          {!isImage && !isAudio && !isVideo && (
            <div className="flex items-center gap-2 text-sm text-zinc-600">
              <FileIcon className="w-4 h-4" />
              <span>{preview.split("/").pop()}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

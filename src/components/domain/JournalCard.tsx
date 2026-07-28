import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, Sparkles, Check } from "lucide-react";

interface JournalCardProps {
  initialContent?: string;
  isPrivate?: boolean;
  onSave?: (content: string, isPrivate: boolean) => void;
}

export function JournalCard({
  initialContent = "",
  isPrivate = true,
  onSave,
}: JournalCardProps) {
  const [content, setContent] = useState(initialContent);
  const [privateState, setPrivateState] = useState(isPrivate);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    if (content.trim()) {
      onSave?.(content, privateState);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  return (
    <Card className="bg-white border-warm-border space-y-4">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-base font-semibold text-navy-900">Jurnal Refleksi Hari Ini</CardTitle>
          <p className="text-xs text-gray-500">Tuliskan pemikiran, syukur, atau pengalaman spiritual Anda.</p>
        </div>
        <button
          onClick={() => setPrivateState(!privateState)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
            privateState
              ? "bg-warm-bg text-navy-900 border-warm-border"
              : "bg-emerald-50 text-emerald-800 border-emerald-200"
          }`}
        >
          <Lock className="h-3 w-3" />
          <span>{privateState ? "Privat" : "Berbagi ke Coach"}</span>
        </button>
      </CardHeader>

      <CardContent>
        <Textarea
          placeholder="Belum ada jurnal hari ini. Mulailah menulis satu refleksi kecil..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          className="bg-warm-bg/50 border-warm-border focus:bg-white text-navy-900 text-sm"
        />
      </CardContent>

      <CardFooter className="flex items-center justify-between pt-2 border-t border-warm-border">
        <Button variant="ghost" size="sm" className="text-xs gap-1 text-gray-500 hover:text-navy-900">
          <Sparkles className="h-3.5 w-3.5 text-accent" /> AI Polish (Opsional)
        </Button>

        <Button
          variant="primary"
          size="sm"
          onClick={handleSave}
          disabled={!content.trim()}
          className="font-medium gap-1"
        >
          {saved ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-400" /> Tersimpan
            </>
          ) : (
            "Simpan Jurnal"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

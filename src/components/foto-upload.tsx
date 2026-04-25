"use client";

import { useRef, useState } from "react";
import { Camera, Upload, X, User } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function FotoUpload({
  value,
  onChange,
  hiddenInputName,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
  hiddenInputName?: string;
}) {
  const [pending, setPending] = useState(false);
  const [mostrarUrl, setMostrarUrl] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(file: File) {
    setPending(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? "Falha no upload");
      onChange(data.url);
      toast.success("Foto enviada");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <div className="size-16 rounded-full bg-[var(--color-background)] border border-[var(--color-border)] overflow-hidden flex items-center justify-center shrink-0">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="w-full h-full object-cover" />
          ) : (
            <User className="size-7 text-[var(--color-muted)]" />
          )}
        </div>

        <div className="flex flex-col gap-1.5 flex-1">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleUpload(f);
              e.target.value = "";
            }}
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => inputRef.current?.click()}
            disabled={pending}
            className="w-fit"
          >
            <Camera className="size-3.5" />
            {pending ? "Enviando..." : value ? "Trocar foto" : "Enviar foto"}
          </Button>

          {value && (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="text-xs text-[var(--color-muted)] hover:text-[var(--color-destructive)] flex items-center gap-1 w-fit"
            >
              <X className="size-3" /> Remover
            </button>
          )}
        </div>
      </div>

      {!mostrarUrl ? (
        <button
          type="button"
          onClick={() => setMostrarUrl(true)}
          className="text-xs text-[var(--color-muted)] hover:text-[var(--color-primary)]"
        >
          ou colar URL
        </button>
      ) : (
        <div className="space-y-1">
          <Input
            placeholder="https://..."
            defaultValue={value ?? ""}
            onBlur={(e) => onChange(e.target.value || null)}
          />
          <button
            type="button"
            onClick={() => setMostrarUrl(false)}
            className="text-xs text-[var(--color-muted)]"
          >
            esconder URL
          </button>
        </div>
      )}

      {hiddenInputName && (
        <input type="hidden" name={hiddenInputName} value={value ?? ""} />
      )}
    </div>
  );
}

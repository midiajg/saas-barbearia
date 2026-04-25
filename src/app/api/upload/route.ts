import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { supabaseAdmin } from "@/infrastructure/database/client";
import { getSession } from "@/lib/auth/session";

const BUCKET = "SAAS-BARBEARIA-FOTOS";
const MAX_BYTES = 5 * 1024 * 1024; // 5MB

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Arquivo ausente" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "Imagem muito grande (máx 5MB)" },
      { status: 400 }
    );
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json(
      { error: "Apenas imagens são aceitas" },
      { status: 400 }
    );
  }

  const ext = file.name.split(".").pop() ?? "png";
  const path = `${session.barbeariaId}/${randomUUID()}.${ext}`;
  const arrayBuffer = await file.arrayBuffer();

  const { error: upErr } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(path, arrayBuffer, {
      contentType: file.type,
      cacheControl: "31536000",
      upsert: false,
    });

  if (upErr) {
    const msg = upErr.message?.toLowerCase() ?? "";
    if (msg.includes("not found") || msg.includes("bucket")) {
      return NextResponse.json(
        {
          error:
            "Bucket 'SAAS-BARBEARIA-FOTOS' não existe no Supabase. Crie em Storage e marque como público.",
        },
        { status: 500 }
      );
    }
    return NextResponse.json({ error: upErr.message }, { status: 500 });
  }

  const { data: pub } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path);
  return NextResponse.json({ url: pub.publicUrl });
}

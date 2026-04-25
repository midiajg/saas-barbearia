import { env } from "@/lib/env";

type EnviarEmailInput = {
  para: string;
  assunto: string;
  html: string;
};

export type ResultadoEnvio =
  | { ok: true; id: string }
  | { ok: false; erro: string };

/**
 * Envia email via Resend API.
 * Sem RESEND_API_KEY configurada, retorna ok=false sem lançar — facilita
 * desenvolvimento local e fallback gracioso em produção.
 */
export async function enviarEmail(
  input: EnviarEmailInput
): Promise<ResultadoEnvio> {
  if (!env.RESEND_API_KEY) {
    return { ok: false, erro: "RESEND_API_KEY não configurada" };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: env.EMAIL_FROM,
        to: [input.para],
        subject: input.assunto,
        html: input.html,
      }),
    });

    if (!res.ok) {
      const txt = await res.text();
      return { ok: false, erro: `${res.status}: ${txt}` };
    }

    const data = (await res.json()) as { id: string };
    return { ok: true, id: data.id };
  } catch (e) {
    return {
      ok: false,
      erro: e instanceof Error ? e.message : "Erro desconhecido",
    };
  }
}

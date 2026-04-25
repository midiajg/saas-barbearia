import { formatInTimeZone } from "date-fns-tz";
import { ptBR } from "date-fns/locale";

type Input = {
  clienteNome: string;
  barbeariaNome: string;
  barbeariaSlug: string;
  barbeariaTelefone?: string | null;
  barbeariaCorPrimaria?: string;
  barbeariaLogoUrl?: string | null;
  barbeiroNome: string;
  servicos: { nome: string }[];
  inicio: string;
  appUrl: string;
};

const TZ = "America/Sao_Paulo";

export function templateLembreteAgendamento(input: Input): {
  assunto: string;
  html: string;
} {
  const data = formatInTimeZone(
    new Date(input.inicio),
    TZ,
    "EEEE, dd 'de' MMMM",
    { locale: ptBR }
  );
  const hora = formatInTimeZone(new Date(input.inicio), TZ, "HH:mm");
  const cor = input.barbeariaCorPrimaria ?? "#1e3a2b";
  const servicosTxt = input.servicos.map((s) => s.nome).join(", ") || "Atendimento";
  const linkPortal = `${input.appUrl}/c/${input.barbeariaSlug}/meus-agendamentos`;

  const assunto = `Lembrete: você tem horário amanhã na ${input.barbeariaNome}`;

  const html = `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${assunto}</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1a1a1a;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f0;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
          <tr>
            <td style="background:${cor};padding:28px 24px;text-align:center;">
              ${
                input.barbeariaLogoUrl
                  ? `<img src="${input.barbeariaLogoUrl}" alt="${input.barbeariaNome}" style="max-height:48px;max-width:200px;display:block;margin:0 auto 12px;" />`
                  : ""
              }
              <p style="margin:0;color:#ffffff;font-size:13px;letter-spacing:2px;text-transform:uppercase;opacity:0.8;">Lembrete</p>
              <h1 style="margin:8px 0 0;color:#ffffff;font-size:24px;font-weight:700;">${input.barbeariaNome}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 28px 16px;">
              <p style="margin:0 0 16px;font-size:16px;line-height:1.5;">Olá <strong>${input.clienteNome}</strong>,</p>
              <p style="margin:0 0 24px;font-size:16px;line-height:1.5;">Esse é um lembrete do seu horário <strong>amanhã</strong>:</p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f0;border-radius:12px;padding:20px;margin:0 0 24px;">
                <tr><td style="padding:6px 0;font-size:14px;color:#666;">Data</td></tr>
                <tr><td style="padding:0 0 12px;font-size:18px;font-weight:600;text-transform:capitalize;">${data}</td></tr>
                <tr><td style="padding:6px 0;font-size:14px;color:#666;">Horário</td></tr>
                <tr><td style="padding:0 0 12px;font-size:18px;font-weight:600;">${hora}</td></tr>
                <tr><td style="padding:6px 0;font-size:14px;color:#666;">Profissional</td></tr>
                <tr><td style="padding:0 0 12px;font-size:18px;font-weight:600;">${input.barbeiroNome}</td></tr>
                <tr><td style="padding:6px 0;font-size:14px;color:#666;">Serviços</td></tr>
                <tr><td style="padding:0;font-size:18px;font-weight:600;">${servicosTxt}</td></tr>
              </table>

              <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#555;">Se não puder comparecer, cancele com pelo menos 2 horas de antecedência pelo portal.</p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${linkPortal}" style="display:inline-block;background:${cor};color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:999px;font-weight:600;font-size:15px;">Ver meus agendamentos</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 28px;border-top:1px solid #eee;text-align:center;color:#888;font-size:13px;">
              ${input.barbeariaTelefone ? `<p style="margin:0 0 4px;">${input.barbeariaTelefone}</p>` : ""}
              <p style="margin:0;">Te esperamos!</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { assunto, html };
}

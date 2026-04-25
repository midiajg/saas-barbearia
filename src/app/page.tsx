import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Eyebrow, EditorialDivider, DoubleRule } from "@/components/editorial";

const PRINCIPIOS = [
  {
    n: "I",
    titulo: "Atendimento sob medida",
    texto:
      "Cada cliente carrega seu histórico. O que cortou, quando voltou, o que conversou. Memória virou ferramenta de venda.",
  },
  {
    n: "II",
    titulo: "Agenda viva",
    texto:
      "O cliente agenda online. Você confirma, remarca, fecha conta. Sem caderninho, sem zap travado, sem horário esquecido.",
  },
  {
    n: "III",
    titulo: "Fidelidade que retorna",
    texto:
      "Pontos por visita, cashback automático, níveis com benefícios. O programa funciona enquanto você tá cortando cabelo.",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Letterhead — barra superior fina estilo cabeçalho de jornal */}
      <header className="px-6 sm:px-12 pt-8 pb-6">
        <div className="max-w-6xl mx-auto">
          <DoubleRule className="mb-4" />
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono tracking-widest text-[var(--color-muted)] uppercase">
              Caderno do Salão
            </span>
            <span className="font-mono tracking-widest text-[var(--color-muted)] uppercase hidden sm:inline">
              Edição 001 · Estabelecido 2026
            </span>
            <span className="font-mono tracking-widest text-[var(--color-primary)] uppercase">
              Sistema · MMXXVI
            </span>
          </div>
          <DoubleRule className="mt-4" />
        </div>
      </header>

      {/* Hero editorial */}
      <section className="px-6 sm:px-12 pt-12 sm:pt-20 pb-16 sm:pb-24">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            <div className="lg:col-span-8 space-y-8">
              <Eyebrow marker className="animate-rise">
                Plataforma de gestão · Para barbearias que cortam de verdade
              </Eyebrow>

              <h1 className="display-serif text-5xl sm:text-7xl md:text-8xl lg:text-[8.5rem] animate-rise" style={{ animationDelay: "100ms" }}>
                O cliente que volta
                <br />
                é o que <em className="display-italic font-normal text-[var(--color-primary)]">se lembra</em>
                <br />
                de você.
              </h1>

              <div className="hairline-t pt-6 max-w-xl animate-rise" style={{ animationDelay: "200ms" }}>
                <p className="text-lg text-[var(--color-muted)] leading-relaxed">
                  Agenda, CRM relacional, fidelidade e financeiro —{" "}
                  <span className="text-[var(--color-foreground)] italic font-display">
                    em um lugar só
                  </span>
                  . Sem planilha. Sem caderninho. Sem cliente esquecido na lista de espera.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 animate-rise" style={{ animationDelay: "300ms" }}>
                <Link
                  href="/signup"
                  className="group inline-flex items-center justify-between gap-3 px-6 py-4 bg-[var(--color-primary)] text-[var(--color-primary-foreground)] font-medium hover:bg-[var(--color-primary-hover)] transition-colors"
                >
                  <span className="font-mono tracking-wider uppercase text-xs">
                    Começar agora
                  </span>
                  <ArrowUpRight className="size-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Link>
                <Link
                  href="/login"
                  className="group inline-flex items-center justify-between gap-3 px-6 py-4 border border-[var(--color-border-strong)] hover:border-[var(--color-foreground)] transition-colors"
                >
                  <span className="font-mono tracking-wider uppercase text-xs">
                    Já sou cliente
                  </span>
                  <span className="text-[var(--color-muted)] group-hover:text-[var(--color-foreground)] transition-colors">
                    →
                  </span>
                </Link>
              </div>
            </div>

            {/* Coluna lateral — colofão estilo ficha técnica */}
            <aside className="lg:col-span-4 lg:border-l hairline lg:pl-8 space-y-6 animate-rise" style={{ animationDelay: "400ms" }}>
              <div>
                <Eyebrow>Da casa</Eyebrow>
                <p className="display-serif text-2xl sm:text-3xl mt-2 leading-tight">
                  Toda barbearia tem suas regras.
                  <br />
                  <em className="display-italic">A nossa respeita as suas.</em>
                </p>
              </div>

              <EditorialDivider ornament="§" />

              <div className="space-y-3">
                <Stat valor="30+" label="Telas prontas" />
                <Stat valor="4" label="Módulos integrados" />
                <Stat valor="∞" label="Clientes por barbearia" />
                <Stat valor="0" label="Cliente esquecido" emphasis />
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* Pilares — três princípios com numeração romana */}
      <section className="px-6 sm:px-12 pb-20 sm:pb-32">
        <div className="max-w-6xl mx-auto">
          <DoubleRule />
          <div className="py-8 grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-0">
            {PRINCIPIOS.map((p, i) => (
              <div
                key={p.n}
                className={`md:px-6 lg:px-8 ${i > 0 ? "md:border-l hairline" : ""}`}
              >
                <p className="display-serif text-6xl text-[var(--color-primary)]/40 leading-none mb-4">
                  {p.n}
                </p>
                <h2 className="display-serif text-2xl mb-3 leading-tight">
                  {p.titulo}
                </h2>
                <p className="text-sm text-[var(--color-muted)] leading-relaxed">
                  {p.texto}
                </p>
              </div>
            ))}
          </div>
          <DoubleRule />
        </div>
      </section>

      {/* Closing — convite final estilo editorial */}
      <section className="px-6 sm:px-12 pb-16 sm:pb-24">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <Eyebrow className="justify-center">Convite</Eyebrow>
          <p className="display-serif text-3xl sm:text-4xl md:text-5xl leading-tight">
            Se você corta cabelo há 10 anos,
            <br />
            <em className="display-italic">talvez seja hora</em> de organizar
            <br />
            os próximos 10.
          </p>
          <div className="pt-4">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 font-mono tracking-widest text-xs uppercase border-b hairline pb-1 hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] transition-colors"
            >
              Criar minha barbearia <ArrowUpRight className="size-3" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer mínimo */}
      <footer className="px-6 sm:px-12 py-6 border-t hairline">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-xs font-mono tracking-widest text-[var(--color-muted)] uppercase">
          <span>© MMXXVI · Caderno do Salão</span>
          <Link href="/login" className="hover:text-[var(--color-foreground)] transition-colors">
            Acessar painel →
          </Link>
        </div>
      </footer>
    </main>
  );
}

function Stat({
  valor,
  label,
  emphasis,
}: {
  valor: string;
  label: string;
  emphasis?: boolean;
}) {
  return (
    <div className="flex items-baseline gap-3 hairline-b pb-2">
      <span
        className={`display-num text-2xl font-light ${
          emphasis ? "text-[var(--color-primary)]" : ""
        }`}
      >
        {valor}
      </span>
      <span className="flex-1 border-b border-dotted hairline translate-y-[-3px]" />
      <span className="eyebrow">{label}</span>
    </div>
  );
}

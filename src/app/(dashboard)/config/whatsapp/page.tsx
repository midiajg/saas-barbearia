import { MessageCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function WhatsappPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-display">WhatsApp</h1>
        <p className="text-[var(--color-muted)]">
          Lembretes automáticos, aniversário, reativação de inativos
        </p>
      </div>

      <Card>
        <CardContent className="p-10 text-center space-y-3">
          <MessageCircle className="size-10 mx-auto text-[var(--color-muted)]" />
          <p className="text-lg font-display">Em breve</p>
          <p className="text-sm text-[var(--color-muted)]">
            A integração com WhatsApp (UaZapi) está sendo preparada. Vamos
            habilitar quando tivermos o token da sua instância.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

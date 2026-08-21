import { PageHeader } from "@/components/ui/PageHeader";
import { ClientForm } from "../ClientForm";
import { createClient } from "@/lib/actions/clients";

export default function NouveauClientPage() {
  return (
    <div>
      <PageHeader title="Ajouter un client" />
      <ClientForm action={createClient} />
    </div>
  );
}

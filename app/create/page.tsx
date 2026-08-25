import { HomeFormWizard } from "@/app/components/home-form/HomeFormWizard";
import { createHome } from "@/app/actions";

export default function CreateHomePage() {
  return (
    <div className="container mt-10">
      <div className="mb-10">
        <h2 className="text-3xl font-semibold tracking-tight">
          Create your home listing
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Fill in each step. You can move back and forth before submitting.
        </p>
      </div>

      <HomeFormWizard mode="create" action={createHome} />
    </div>
  );
}

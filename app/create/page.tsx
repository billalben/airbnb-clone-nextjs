import { getAllCountries } from "@/app/lib/getCountries";
import { HomeFormWizard } from "@/app/components/home-form/HomeFormWizard";
import { createHome } from "@/app/actions";

export default function CreateHomePage() {
  const countries = getAllCountries().map((country) => ({
    value: country.value,
    label: `${country.flag} ${country.label} / ${country.region}`,
  }));

  return (
    <div className="mt-10 container">
      <div className=" mb-10">
        <h2 className="text-3xl font-semibold tracking-tight">
          Create your home listing
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Fill in each step. You can move back and forth before submitting.
        </p>
      </div>

      <HomeFormWizard
        mode="create"
        action={createHome}
        countries={countries}
      />
    </div>
  );
}
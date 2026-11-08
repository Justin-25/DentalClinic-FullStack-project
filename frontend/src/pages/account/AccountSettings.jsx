import DeleteAccount from "./settings/DeleteAccount";
import PasswordForm from "./settings/PasswordForm";
import ProfileForm from "./settings/ProfileForm";

export default function AccountSettings() {
  return (
    <div className="space-y-8">
      <h1 className="text-[28px] font-bold text-ink md:text-[32px]">
        <span className="lg:hidden">Account</span>
        <span className="hidden lg:inline">Account settings</span>
      </h1>

      <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
        <ProfileForm />
        <PasswordForm />
      </div>

      <DeleteAccount />
    </div>
  );
}

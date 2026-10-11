import { PageHeader } from "../../components/page-layout";
import { SettingsWorkspace } from "../../components/settings-workspace";

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        description="Keep the task connection, local data, and backup path understandable."
        eyebrow="System"
        title="Settings"
      />
      <SettingsWorkspace />
    </div>
  );
}

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, Bell, Shield, Database, Mail, Globe } from "lucide-react";

export default function SettingsPage() {
  const settingsSections = [
    {
      title: "General Settings",
      description: "School name, logo, and contact information",
      icon: Settings,
    },
    {
      title: "Notifications",
      description: "Email and SMS notification preferences",
      icon: Bell,
    },
    {
      title: "Security",
      description: "Password policies and access controls",
      icon: Shield,
    },
    {
      title: "Database",
      description: "Backup and data management options",
      icon: Database,
    },
    {
      title: "Email Configuration",
      description: "SMTP settings for sending emails",
      icon: Mail,
    },
    {
      title: "System",
      description: "System maintenance and updates",
      icon: Globe,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Configure system settings and preferences
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {settingsSections.map((section) => {
          const Icon = section.icon;
          return (
            <Card key={section.title} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{section.title}</CardTitle>
                    <CardDescription>{section.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>School Information</CardTitle>
          <CardDescription>Update your school&apos;s basic information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium">School Name</label>
                <input
                  type="text"
                  defaultValue="Christ the King Catholic School"
                  className="mt-1 w-full border rounded-md px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium">School ID</label>
                <input
                  type="text"
                  defaultValue="CTK-OLG-001"
                  className="mt-1 w-full border rounded-md px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Address</label>
              <input
                type="text"
                defaultValue="Olongapo City, Zambales"
                className="mt-1 w-full border rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Contact Number</label>
                <input
                  type="text"
                  placeholder="(047) XXX-XXXX"
                  className="mt-1 w-full border rounded-md px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Email</label>
                <input
                  type="email"
                  placeholder="info@ctkschool.edu.ph"
                  className="mt-1 w-full border rounded-md px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button>Save Changes</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

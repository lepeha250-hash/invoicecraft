"use client";

import { useTranslations } from "next-intl";
import { AppSidebar } from "@/components/app-sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Layers, FileText, Sparkles } from "lucide-react";

export default function TemplatesPage() {
  const tn = useTranslations("nav");

  const templates = [
    { id: "starter-proposal", name: "Starter Proposal", category: "proposal", isSystem: true },
    { id: "professional-proposal", name: "Professional Proposal", category: "proposal", isSystem: true },
    { id: "simple-invoice", name: "Simple Invoice", category: "invoice", isSystem: true },
    { id: "consulting-proposal", name: "Consulting Proposal", category: "proposal", isSystem: true },
    { id: "development-invoice", name: "Development Invoice", category: "invoice", isSystem: true },
    { id: "service-act", name: "Service Act", category: "act", isSystem: true },
  ];

  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <main className="flex-1 p-6 md:p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <div>
            <h1 className="text-2xl font-bold">{tn("myTemplates")}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Choose a template to get started
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <Card
                key={template.id}
                className="border-border/50 hover:border-primary/50 transition-colors cursor-pointer group"
              >
                <CardContent className="pt-6">
                  <div className="aspect-[3/4] border-2 border-dashed border-border rounded-lg mb-4 bg-muted/30 flex items-center justify-center group-hover:border-primary/30 transition-colors">
                    <div className="text-center">
                      <Layers className="w-8 h-8 mx-auto mb-2 text-muted-foreground group-hover:text-primary transition-colors" />
                      <p className="text-xs text-muted-foreground">Template Preview</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-sm">{template.name}</h3>
                    <Badge variant="secondary" className="capitalize">
                      {template.category}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="border-border/50 border-primary/30">
            <CardContent className="py-8">
              <div className="text-center">
                <Sparkles className="w-8 h-8 mx-auto mb-3 text-primary" />
                <h3 className="font-semibold mb-1">Create your own template</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Generate a custom template from your brand and requirements
                </p>
                <Button variant="outline" className="gap-2">
                  <FileText className="w-4 h-4" />
                  Create Template
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText,
  Download,
  ExternalLink,
  Truck,
  CreditCard,
  Shield,
  MonitorSmartphone,
  ClipboardList,
  WashingMachine,
  Building2,
  CheckSquare,
} from "lucide-react";

// Document data with blob URLs from attachments
const documents = [
  {
    category: "Onboarding Forms",
    items: [
      {
        name: "Location Information Sheet",
        description: "Comprehensive location details including address, hours, and amenities",
        icon: Building2,
        type: "form",
        fileName: "Location Information Sheet.pdf",
        downloadUrl: "https://blobs.vusercontent.net/blob/Location%20Information%20Sheet-pTTliYmuZnOXCaHWLYQV5EaHsBeHeD.pdf",
      },
      {
        name: "Machine List Form",
        description: "Complete inventory of washers and dryers with specifications",
        icon: WashingMachine,
        type: "form",
        fileName: "Machine List.pdf",
        downloadUrl: "https://blobs.vusercontent.net/blob/Machine%20List-MLchni4PGhWrlWuHJosIQ7HpHFFFNf.pdf",
      },
    ],
  },
  {
    category: "Shipping & Delivery",
    items: [
      {
        name: "Receiving Your Laundry Boss System - Via Freight",
        description: "Instructions for receiving freight deliveries including inspection and sign-off procedures",
        icon: Truck,
        type: "guide",
        fileName: "Receiving Your Laundry Boss System - Via Freight.pdf",
        downloadUrl: "https://blobs.vusercontent.net/blob/Receiving%20Your%20Laundry%20Boss%20System%20-%20Via%20Freight-NpDNZcSEUSJc6WEPRAkPJ58MGwDRhf.pdf",
      },
      {
        name: "Kiosk Dimensions & ADA Requirements",
        description: "Rear load kiosk specifications and ADA compliance guidelines",
        icon: MonitorSmartphone,
        type: "spec",
        fileName: "Rear Load Kiosk Dimensions & ADA Requirements.pdf",
        downloadUrl: "https://blobs.vusercontent.net/blob/Rear%20Load%20Kiosk%20Dimensions%20%26%20ADA%20Requirements%20-%20Copy-pIigGcvszmDVbw3wQlozRcbfIsobD0.pdf",
      },
    ],
  },
  {
    category: "Compliance & Legal",
    items: [
      {
        name: "PCI Compliance Consent",
        description: "Payment Card Industry Data Security Standard compliance agreement",
        icon: Shield,
        type: "legal",
        fileName: "PCI Compliance Consent.pdf",
        downloadUrl: "https://blobs.vusercontent.net/blob/PCI%20Compliance%20Consent-4VJbrPgsWC8ZCQCAU1w4kCIA8OBVlW.pdf",
      },
    ],
  },
  {
    category: "Project Management",
    items: [
      {
        name: "What is the Process",
        description: "Overview of the complete onboarding process from start to finish",
        icon: ClipboardList,
        type: "guide",
        fileName: "What is the Process.pdf",
        downloadUrl: "https://blobs.vusercontent.net/blob/What%20is%20the%20Process-0Ek94gAP4TcPZeCte0zGS0UYIOs017.pdf",
      },
      {
        name: "Zoho Project Tasks and Milestones",
        description: "Standard project tasks and milestone tracking checklist",
        icon: CheckSquare,
        type: "checklist",
        fileName: "Zoho Project Tasks and Milestones.pdf",
        downloadUrl: "https://blobs.vusercontent.net/blob/Zoho%20Project%20Tasks%20and%20Milestones-3kt35ukARjC8cleDfb9doe6vJOTKAc.pdf",
      },
    ],
  },
];

const typeColors: Record<string, string> = {
  form: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  guide: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  spec: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  legal: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  checklist: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200",
};

export default function DocumentsPage() {
  const handleView = (doc: { name: string; downloadUrl: string }) => {
    // Open the document in a new tab
    window.open(doc.downloadUrl, '_blank', 'noopener,noreferrer');
  };

  const handleDownload = (doc: { name: string; fileName: string; downloadUrl: string }) => {
    // Create a temporary link and trigger download
    const link = document.createElement('a');
    link.href = doc.downloadUrl;
    link.download = doc.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Documents & Forms</h1>
        <p className="text-muted-foreground">
          Access all onboarding documents, forms, and reference materials
        </p>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="all">All Documents</TabsTrigger>
          <TabsTrigger value="forms">Forms</TabsTrigger>
          <TabsTrigger value="guides">Guides</TabsTrigger>
          <TabsTrigger value="legal">Legal</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          {documents.map((category) => (
            <Card key={category.category}>
              <CardHeader>
                <CardTitle className="text-foreground">{category.category}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {category.items.map((doc) => (
                    <Card key={doc.name} className="relative overflow-hidden">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div className="rounded-lg bg-primary/10 p-2">
                            <doc.icon className="h-5 w-5 text-primary" />
                          </div>
                          <Badge className={typeColors[doc.type]}>
                            {doc.type}
                          </Badge>
                        </div>
                        <CardTitle className="text-base text-foreground">{doc.name}</CardTitle>
                        <CardDescription className="text-sm">
                          {doc.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-2">
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1 bg-transparent"
                            onClick={() => handleView(doc)}
                          >
                            <ExternalLink className="mr-2 h-4 w-4" />
                            View
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDownload(doc)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="forms" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">Onboarding Forms</CardTitle>
              <CardDescription>
                Required forms for customer onboarding
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {documents
                  .flatMap((c) => c.items)
                  .filter((d) => d.type === "form")
                  .map((doc) => (
                    <div
                      key={doc.name}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-primary/10 p-2">
                          <doc.icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{doc.name}</p>
                          <p className="text-sm text-muted-foreground">{doc.description}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleView(doc)}
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Open
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDownload(doc)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="guides" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">Guides & Specifications</CardTitle>
              <CardDescription>
                Reference materials and technical specifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {documents
                  .flatMap((c) => c.items)
                  .filter((d) => d.type === "guide" || d.type === "spec" || d.type === "checklist")
                  .map((doc) => (
                    <div
                      key={doc.name}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-primary/10 p-2">
                          <doc.icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{doc.name}</p>
                          <p className="text-sm text-muted-foreground">{doc.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={typeColors[doc.type]}>
                          {doc.type}
                        </Badge>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleView(doc)}
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          View
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDownload(doc)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="legal" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">Legal Documents</CardTitle>
              <CardDescription>
                Compliance and legal agreements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {documents
                  .flatMap((c) => c.items)
                  .filter((d) => d.type === "legal")
                  .map((doc) => (
                    <div
                      key={doc.name}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-primary/10 p-2">
                          <doc.icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{doc.name}</p>
                          <p className="text-sm text-muted-foreground">{doc.description}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleView(doc)}
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Review
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDownload(doc)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

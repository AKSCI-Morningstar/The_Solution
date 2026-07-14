import { UploadForm } from "@/features/ingestion/components";

export default function IngestionUploadPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-8">
      <div>
        <h1 className="text-foreground text-2xl font-bold tracking-tight">Upload Document</h1>
        <p className="text-muted-foreground text-sm">
          Supported formats: PDF, DOCX, TXT, Markdown, CSV, and images (metadata only).
        </p>
      </div>
      <div className="max-w-xl">
        <UploadForm />
      </div>
    </div>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SupportingDocumentRef {
  extractedEntityId: string;
  documentId: string;
  documentVersionId: string;
  page: number | null;
  section: string | null;
  confidence: number;
}

interface ConflictingEvidenceItem {
  attribute: string;
  canonicalValue: unknown;
  extractedValue: unknown;
  extractedEntityId: string;
  documentId: string;
}

export interface EvidencePanelProps {
  supportingDocumentRefs: SupportingDocumentRef[];
  conflictingEvidence: ConflictingEvidenceItem[];
  missingEvidence: string[];
}

export function EvidencePanel({
  supportingDocumentRefs,
  conflictingEvidence,
  missingEvidence,
}: EvidencePanelProps) {
  return (
    <div className="flex flex-col gap-4">
      {missingEvidence.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Missing evidence</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            {missingEvidence.map((field, index) => (
              <span key={index} className="text-destructive text-sm">
                {field}
              </span>
            ))}
          </CardContent>
        </Card>
      )}

      {conflictingEvidence.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Conflicting evidence</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {conflictingEvidence.map((item, index) => (
              <div key={index} className="border-border rounded-md border p-2 text-sm">
                <span className="text-foreground font-medium">{item.attribute}</span>
                <div className="text-muted-foreground text-xs">
                  Canonical: <code>{JSON.stringify(item.canonicalValue)}</code> vs. Extracted:{" "}
                  <code>{JSON.stringify(item.extractedValue)}</code> (document {item.documentId})
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Supporting documents</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {supportingDocumentRefs.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No linked extraction records for this subject.
            </p>
          ) : (
            supportingDocumentRefs.map((ref, index) => (
              <div key={index} className="border-border rounded-md border p-2 text-sm">
                <span className="text-foreground">Document {ref.documentId}</span>
                <div className="text-muted-foreground text-xs">
                  {ref.section ? `Section: ${ref.section}` : ""}
                  {ref.page !== null ? ` Page: ${ref.page}` : ""} Confidence:{" "}
                  {Math.round(ref.confidence * 100)}%
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

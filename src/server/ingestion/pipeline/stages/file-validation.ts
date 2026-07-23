import { config } from "@/shared/config";
import type { ValidationIssueDraft } from "../types";

export interface FileValidationInput {
  buffer: Buffer;
  extension: string;
  sizeBytes: number;
}

export function validateFile(input: FileValidationInput): ValidationIssueDraft[] {
  const issues: ValidationIssueDraft[] = [];

  if (input.sizeBytes === 0) {
    issues.push({
      severity: "ERROR",
      code: "MALFORMED_DOCUMENT",
      message: "File is empty",
      stage: "FILE_VALIDATION",
    });
  }

  if (input.sizeBytes > config.ingestionMaxFileSizeBytes) {
    issues.push({
      severity: "ERROR",
      code: "MALFORMED_DOCUMENT",
      message: `File size ${input.sizeBytes} bytes exceeds the maximum of ${config.ingestionMaxFileSizeBytes} bytes`,
      stage: "FILE_VALIDATION",
      context: { sizeBytes: input.sizeBytes, maxBytes: config.ingestionMaxFileSizeBytes },
    });
  }

  return issues;
}

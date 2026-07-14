import { config } from "@/shared/config";
import { SUPPORTED_EXTENSIONS } from "../../constants";
import { signatureMatchesExtension } from "../../file-signature";
import type { ValidationIssueDraft } from "../types";

export interface FileValidationInput {
  buffer: Buffer;
  extension: string;
  sizeBytes: number;
}

export function validateFile(input: FileValidationInput): ValidationIssueDraft[] {
  const issues: ValidationIssueDraft[] = [];
  const extension = input.extension.toLowerCase().replace(/^\./, "");

  if (!SUPPORTED_EXTENSIONS.includes(extension as (typeof SUPPORTED_EXTENSIONS)[number])) {
    issues.push({
      severity: "ERROR",
      code: "UNSUPPORTED_FORMAT",
      message: `File extension ".${extension}" is not a supported input format`,
      stage: "FILE_VALIDATION",
      context: { extension },
    });
    return issues;
  }

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

  if (input.sizeBytes > 0 && !signatureMatchesExtension(input.buffer, extension)) {
    issues.push({
      severity: "ERROR",
      code: "MALFORMED_DOCUMENT",
      message: `File content does not match the claimed extension ".${extension}"`,
      stage: "FILE_VALIDATION",
      context: { extension },
    });
  }

  return issues;
}

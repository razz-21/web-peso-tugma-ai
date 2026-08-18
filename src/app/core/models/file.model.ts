import { z } from 'zod';

/**
 * A stored file's metadata, as returned by the generic `/files` API. Files are
 * linked to an owning record (an applicant, a company, ...) by `foreign_id`,
 * so the same model backs attachments across the app.
 */
export const FileReadSchema = z.object({
  id: z.string(),
  foreign_id: z.string(),
  filename: z.string(),
  size: z.number(),
  content_type: z.string(),
  uploaded_by: z.string().nullish(),
  uploaded_at: z.string(),
});

export const FileListSchema = z.object({
  items: z.array(FileReadSchema),
});

export type FileRead = z.infer<typeof FileReadSchema>;
export type FileList = z.infer<typeof FileListSchema>;

/** Upload rules mirrored from the backend (`files_service`). */
export const FILE_MAX_BYTES = 10 * 1024 * 1024;

export const ALLOWED_FILE_TYPES: readonly string[] = [
  'application/pdf',
  'application/x-pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
];

/** `accept` attribute value for file pickers, covering the allowed types. */
export const FILE_ACCEPT = '.pdf,.jpg,.jpeg,.png,.webp,.gif,.doc,.docx,.xls,.xlsx,.txt,.csv';

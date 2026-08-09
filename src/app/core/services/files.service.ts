import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { FileList, FileListSchema, FileRead, FileReadSchema } from '../models/file.model';

/**
 * Client for the generic `/files` API. Files are keyed by `foreignId` — the id
 * of the record they belong to — so this service is not applicant-specific and
 * can back attachments for any resource.
 */
@Injectable({ providedIn: 'root' })
export class FilesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/v1/files`;

  /** List every file linked to an owning record, newest first. */
  async list(foreignId: string): Promise<FileRead[]> {
    const params = new HttpParams().set('foreign_id', foreignId);
    const body = await firstValueFrom(this.http.get<FileList>(this.baseUrl, { params }));
    return FileListSchema.parse(body).items;
  }

  /** Upload a file and link it to the owning record. */
  async upload(foreignId: string, file: File): Promise<FileRead> {
    const form = new FormData();
    form.append('foreign_id', foreignId);
    form.append('file', file);
    const body = await firstValueFrom(this.http.post<FileRead>(this.baseUrl, form));
    return FileReadSchema.parse(body);
  }

  async delete(id: string): Promise<void> {
    await firstValueFrom(this.http.delete<void>(`${this.baseUrl}/${id}`));
  }

  /** Fetch a file's bytes through the authenticated download proxy. */
  async fetchBlob(id: string): Promise<Blob> {
    return firstValueFrom(
      this.http.get(`${this.baseUrl}/${id}/download`, { responseType: 'blob' }),
    );
  }

  /**
   * Fetch the bytes through the authenticated download proxy and trigger a
   * browser download with the original filename.
   */
  async download(file: Pick<FileRead, 'id' | 'filename'>): Promise<void> {
    const blob = await this.fetchBlob(file.id);
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = file.filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }
}

import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuditLogList, AuditLogListSchema, ListAuditLogsParams } from '../models/audit-log.model';

@Injectable({ providedIn: 'root' })
export class AuditLogsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/v1/audit-logs`;

  async list(params: ListAuditLogsParams = {}): Promise<AuditLogList> {
    let httpParams = new HttpParams();
    if (params.limit != null) {
      httpParams = httpParams.set('limit', params.limit);
    }
    if (params.offset != null) {
      httpParams = httpParams.set('offset', params.offset);
    }
    if (params.entity) {
      httpParams = httpParams.set('entity', params.entity);
    }
    if (params.q) {
      httpParams = httpParams.set('q', params.q);
    }

    const body = await firstValueFrom(
      this.http.get<AuditLogList>(this.baseUrl, { params: httpParams }),
    );
    return AuditLogListSchema.parse(body);
  }
}

import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { DirectionService } from '../../../core/direction.service';
import { TPipe } from '../../../core/i18n/t.pipe';
import { ErrorState } from '../../../shared/error-state';
import { LoadingSkeleton } from '../../../shared/loading-skeleton';
import { PageHeader } from '../../../shared/page-header';
import { ResearchCandidate, ResearchEvidence } from '../partnership.models';
import { usePartnershipPermissions } from '../partnership.permissions';
import { PartnershipsApi } from '../partnerships.api';
import { partnershipErrorMessage } from '../partnership.util';

@Component({
  selector: 'app-research-candidate-page',
  imports: [RouterLink, MatButtonModule, PageHeader, ErrorState, LoadingSkeleton, TPipe],
  template: `
    <app-page-header
      [title]="candidate()?.discoveredName || ('partnerships.researchCandidate' | t)"
      [subtitle]="'partnerships.researchCandidateSubtitle' | t"
    >
      <a mat-stroked-button routerLink="/partnerships/research">{{ 'common.back' | t }}</a>
    </app-page-header>

    @if (loading()) {
      <app-loading-skeleton [rows]="8" [label]="'partnerships.researchLoading' | t" />
    } @else if (errorMessage(); as message) {
      <app-error-state
        [title]="'partnerships.researchErrorTitle' | t"
        [message]="message"
        (retry)="load()"
      />
    } @else if (candidate(); as row) {
      <section class="status-row ra-card">
        <span class="chip">{{ row.verificationStatus }}</span>
        <span class="chip">{{ row.researchStatus }}</span>
        <span class="chip">{{ row.dataQuality }}</span>
        <span class="chip">{{ row.duplicateStatus }}</span>
      </section>

      <section class="ra-card block">
        <h2>{{ 'partnerships.researchInstitution' | t }}</h2>
        <dl class="facts">
          <div>
            <dt>{{ 'partnerships.governorate' | t }}</dt>
            <dd>{{ display(row.governorate) }}</dd>
          </div>
          <div>
            <dt>{{ 'partnerships.city' | t }}</dt>
            <dd>{{ display(row.city) }}</dd>
          </div>
          <div class="span-2">
            <dt>{{ 'partnerships.address' | t }}</dt>
            <dd>{{ display(row.address) }}</dd>
          </div>
          <div>
            <dt>{{ 'partnerships.phone' | t }}</dt>
            <dd>{{ display(row.phone || row.mobile) }}</dd>
          </div>
          <div>
            <dt>{{ 'partnerships.email' | t }}</dt>
            <dd>{{ display(row.email) }}</dd>
          </div>
          <div>
            <dt>{{ 'partnerships.whatsapp' | t }}</dt>
            <dd>{{ display(row.whatsapp) }}</dd>
          </div>
          <div>
            <dt>{{ 'partnerships.researchEnrichmentAttempted' | t }}</dt>
            <dd>{{ row.enrichmentAttempted ? 'Yes' : 'No' }}</dd>
          </div>
          <div class="span-2 link-row">
            <dt>{{ 'partnerships.researchOfficialWebsite' | t }}</dt>
            <dd>
              @if (websiteUrl(row); as url) {
                <a
                  mat-stroked-button
                  class="link-btn"
                  [href]="url"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {{ 'partnerships.researchOpenWebsite' | t }}
                </a>
              } @else {
                <span class="muted">—</span>
              }
            </dd>
          </div>
          <div class="span-2 link-row">
            <dt>{{ 'partnerships.researchGoogleMaps' | t }}</dt>
            <dd>
              @if (row.googleMapsUrl) {
                <a
                  mat-stroked-button
                  class="link-btn"
                  [href]="row.googleMapsUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {{ 'partnerships.researchOpenMaps' | t }}
                </a>
              } @else {
                <span class="muted">—</span>
              }
            </dd>
          </div>
        </dl>
      </section>

      <section class="ra-card block">
        <h2>{{ 'partnerships.researchDiscoverySource' | t }}</h2>
        <div class="source-line">
          <span class="chip">{{ display(row.discoverySource?.label || row.sourceName || row.sourceType) }}</span>
          @if (row.discoverySource?.url || row.sourceUrl; as srcUrl) {
            <a
              mat-stroked-button
              class="link-btn"
              [href]="srcUrl"
              target="_blank"
              rel="noopener noreferrer"
            >
              {{ 'partnerships.researchSourceLink' | t }}
            </a>
          }
        </div>

        <h3>{{ 'partnerships.researchEvidenceSources' | t }}</h3>
        @if (row.evidenceSources?.length) {
          <ul class="sources">
            @for (src of row.evidenceSources; track src.label) {
              <li>
                <span>✓ {{ src.label }}</span>
                @if (src.url) {
                  <a
                    mat-stroked-button
                    class="link-btn sm"
                    [href]="src.url"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {{ 'partnerships.researchSourceLink' | t }}
                  </a>
                }
              </li>
            }
          </ul>
        } @else {
          <p class="muted">—</p>
        }
      </section>

      @if (fieldEvidence(row).length) {
        <section class="ra-card block">
          <h2>{{ 'partnerships.researchEvidence' | t }}</h2>
          <ul class="evidence">
            @for (item of fieldEvidence(row); track item.id) {
              <li>
                <div>
                  <strong>{{ item.field }}</strong>
                  <span class="muted"> · {{ item.confidence }}</span>
                </div>
                <div>{{ item.value }}</div>
                @if (item.sourceUrl) {
                  <a
                    mat-stroked-button
                    class="link-btn sm"
                    [href]="item.sourceUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {{ sourceHost(item.sourceUrl) }}
                  </a>
                }
              </li>
            }
          </ul>
        </section>
      }

      @if (row.matchedInstitutionId || (permissions.canWrite() && row.researchStatus !== 'IMPORTED')) {
        <section class="ra-card block actions-block">
          @if (row.matchedInstitutionId) {
            <a
              mat-stroked-button
              [routerLink]="['/partnerships/institutions', row.matchedInstitutionId]"
            >
              {{ 'partnerships.researchViewInstitution' | t }}
            </a>
          }
          @if (permissions.canWrite() && row.researchStatus !== 'IMPORTED') {
            <button mat-stroked-button type="button" (click)="verify()">
              {{ 'partnerships.researchVerify' | t }}
            </button>
            <button mat-stroked-button type="button" (click)="reject()">
              {{ 'partnerships.researchReject' | t }}
            </button>
            <button mat-stroked-button type="button" (click)="duplicate()">
              {{ 'partnerships.researchMarkDuplicate' | t }}
            </button>
            <button mat-flat-button color="primary" type="button" (click)="importToCrm()">
              {{ 'partnerships.researchImportCrm' | t }}
            </button>
          }
        </section>
      }
    }
  `,
  styles: `
    .status-row {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      padding: 0.85rem 1.15rem;
      margin-bottom: 1rem;
    }

    .block {
      padding: 1.15rem 1.25rem;
      margin-bottom: 1rem;
    }

    .block h2 {
      margin: 0 0 0.85rem;
      font-size: 1.05rem;
    }

    .block h3 {
      margin: 1.1rem 0 0.65rem;
      font-size: 0.95rem;
    }

    .facts {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0.85rem 1.25rem;
      margin: 0;
    }

    .facts .span-2 {
      grid-column: 1 / -1;
    }

    dt {
      font-size: 0.8rem;
      color: var(--ra-muted, #6b7280);
      margin: 0;
    }

    dd {
      margin: 0.25rem 0 0;
      font-size: 0.95rem;
      word-break: break-word;
    }

    .link-row dd {
      margin-top: 0.4rem;
    }

    .link-btn {
      min-width: 0 !important;
      padding-inline: 12px !important;
      line-height: 32px !important;
      white-space: nowrap;
    }

    .link-btn.sm {
      line-height: 28px !important;
      padding-inline: 10px !important;
      font-size: 0.82rem;
    }

    .chip {
      display: inline-block;
      max-width: 100%;
      padding: 3px 10px;
      border-radius: 999px;
      border: 1px solid var(--ra-border, #e5e7eb);
      font-size: 0.78rem;
      background: var(--ra-surface, #fff);
    }

    .muted {
      color: var(--ra-muted, #6b7280);
    }

    .source-line {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.65rem;
    }

    .sources,
    .evidence {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      gap: 0.65rem;
    }

    .sources li,
    .evidence li {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.5rem 0.75rem;
      padding: 0.65rem 0.75rem;
      border: 1px solid var(--ra-border, #e5e7eb);
      border-radius: 10px;
      background: var(--ra-surface, #fff);
    }

    .evidence li {
      align-items: flex-start;
      flex-direction: column;
    }

    .actions-block {
      display: flex;
      flex-wrap: wrap;
      gap: 0.65rem;
    }

    @media (max-width: 720px) {
      .facts {
        grid-template-columns: 1fr;
      }

      .facts .span-2 {
        grid-column: auto;
      }
    }
  `,
})
export class ResearchCandidatePage {
  private readonly api = inject(PartnershipsApi);
  private readonly route = inject(ActivatedRoute);
  readonly i18n = inject(DirectionService);
  readonly permissions = usePartnershipPermissions();
  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly candidate = signal<ResearchCandidate | null>(null);

  constructor() {
    this.load();
  }

  load(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.loading.set(false);
      this.errorMessage.set(this.i18n.t('errors.connection'));
      return;
    }
    this.loading.set(true);
    this.api.getResearchCandidate(id).subscribe({
      next: (row) => {
        this.candidate.set(row);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.errorMessage.set(partnershipErrorMessage(error, this.i18n.t('errors.connection')));
      },
    });
  }

  fieldEvidence(row: ResearchCandidate): ResearchEvidence[] {
    const skip = new Set([
      'enrichmentAttempted',
      'discoverySource',
      'evidenceSource',
      'searchResult',
      'snippet',
      'hasCoding',
      'hasRobotics',
      'hasStem',
      'hasAi',
      'hasTechClub',
      'hasAfterSchool',
      'hasSummerCamp',
      'hasMakerspace',
    ]);
    return (row.evidence ?? []).filter((e) => !skip.has(e.field) && !e.field.endsWith('_conflict'));
  }

  sourceHost(url: string): string {
    try {
      return new URL(url).hostname.replace(/^www\./, '');
    } catch {
      return url;
    }
  }

  websiteUrl(row: ResearchCandidate): string | null {
    const raw = (row.officialWebsite || row.website || '').trim();
    return raw || null;
  }

  display(value: string | null | undefined): string {
    return value?.trim() ? value : '—';
  }

  verify(): void {
    const id = this.candidate()?.id;
    if (!id) return;
    this.api.verifyResearchCandidate(id).subscribe({
      next: (row) => this.candidate.set(row),
      error: (error: unknown) => {
        this.errorMessage.set(partnershipErrorMessage(error, this.i18n.t('errors.connection')));
      },
    });
  }

  reject(): void {
    const id = this.candidate()?.id;
    if (!id) return;
    this.api.rejectResearchCandidate(id).subscribe({
      next: (row) => this.candidate.set(row),
      error: (error: unknown) => {
        this.errorMessage.set(partnershipErrorMessage(error, this.i18n.t('errors.connection')));
      },
    });
  }

  duplicate(): void {
    const id = this.candidate()?.id;
    if (!id) return;
    this.api.markResearchDuplicate(id, {}).subscribe({
      next: (row) => this.candidate.set(row),
      error: (error: unknown) => {
        this.errorMessage.set(partnershipErrorMessage(error, this.i18n.t('errors.connection')));
      },
    });
  }

  importToCrm(): void {
    const id = this.candidate()?.id;
    if (!id) return;
    this.api.importResearchCandidate(id).subscribe({
      next: (result) => this.candidate.set(result.candidate),
      error: (error: unknown) => {
        this.errorMessage.set(partnershipErrorMessage(error, this.i18n.t('errors.connection')));
      },
    });
  }
}

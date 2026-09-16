import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, computed, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { DirectionService } from '../../core/direction.service';
import { EmptyState } from '../../shared/empty-state';
import { reportUi } from './report.labels';
import { ReportApi } from './report.api';
import { ReportLocale, StudentProgressReport } from './report.models';

@Component({
  selector: 'app-student-report-preview',
  imports: [RouterLink, MatButtonModule, MatProgressSpinnerModule, EmptyState],
  template: `
    <div class="wrap" [attr.dir]="dir()">
      @if (loading()) {
        <div class="loading"><mat-spinner diameter="28" /></div>
      } @else if (error(); as message) {
        <app-empty-state [title]="copy().emptyTitle" [message]="message" />
      } @else if (report(); as current) {
        <div class="toolbar">
          <div>
            <p class="kicker">{{ copy().previewTitle }}</p>
            <h2>{{ current.title }}</h2>
          </div>
          <div class="actions">
            @if (showOpenLink()) {
              <a mat-stroked-button [routerLink]="['/students', current.studentId, 'report']">
                {{ copy().openFull }}
              </a>
            }
            <button mat-stroked-button type="button" [disabled]="busy()" (click)="generatePdf()">
              {{ busy() ? copy().generating : copy().generatePdf }}
            </button>
            <button
              mat-flat-button
              color="primary"
              type="button"
              [disabled]="busy()"
              (click)="downloadPdf()"
            >
              {{ copy().downloadPdf }}
            </button>
          </div>
        </div>

        <article class="paper" [attr.dir]="dir()">
          <header class="brand">
            <div class="identity">
              <img src="/brand/icon.svg" width="44" height="44" alt="ROOTACA" />
              <div class="wordmark" dir="ltr">
                <strong>ROOTACA</strong>
                <span>ACADEMY</span>
              </div>
            </div>
            <div class="report-meta">
              <p>{{ current.title }}</p>
              <span>{{ current.generatedAt.slice(0, 10) }}</span>
            </div>
          </header>

          <section>
            <h3>{{ copy().sections.student }}</h3>
            <dl>
              @for (field of current.student.fields; track field.label) {
                <div>
                  <dt>{{ field.label }}</dt>
                  <dd dir="auto">{{ field.value }}</dd>
                </div>
              }
            </dl>
          </section>

          <section>
            <h3>{{ copy().sections.currentLevel }}</h3>
            @if (current.currentLevel; as level) {
              <p class="lead">{{ level.name }}</p>
              <p dir="auto">{{ level.description }}</p>
            } @else {
              <p class="muted">{{ copy().empty.currentLevel }}</p>
            }
          </section>

          <section>
            <h3>{{ copy().sections.assessment }}</h3>
            @if (current.assessment; as assessment) {
              <p class="lead">{{ copy().overall }} {{ assessment.overallScore }}/100</p>
              <p>{{ assessment.summary }}</p>
              <ul class="meters">
                @for (item of assessment.categories; track item.name) {
                  <li>
                    <div class="meta">
                      <strong>{{ item.name }}</strong>
                      <span>{{ item.score }}</span>
                    </div>
                    <div class="bar"><span [style.width.%]="item.score"></span></div>
                  </li>
                }
              </ul>
            } @else {
              <p class="muted">{{ copy().empty.assessment }}</p>
            }
          </section>

          <section>
            <h3>{{ copy().sections.skills }}</h3>
            @if (current.skills.length === 0) {
              <p class="muted">{{ copy().empty.skills }}</p>
            } @else {
              <ul class="meters">
                @for (item of current.skills; track item.name) {
                  <li>
                    <div class="meta">
                      <strong>{{ item.name }}</strong>
                      <span>{{ item.score }}</span>
                    </div>
                    <div class="bar"><span [style.width.%]="item.score"></span></div>
                  </li>
                }
              </ul>
            }
          </section>

          <section>
            <h3>{{ copy().sections.recommendedPath }}</h3>
            @if (current.recommendedPath; as path) {
              <p class="lead">{{ path.name }}</p>
              <p>{{ path.description }}</p>
              @if (path.reasons.length > 0) {
                <p class="sub">{{ copy().reasons }}</p>
                <ul>
                  @for (reason of path.reasons; track reason) {
                    <li>{{ reason }}</li>
                  }
                </ul>
              }
              @if (path.alternativeName) {
                <p class="muted">{{ copy().alternative }}: {{ path.alternativeName }}</p>
              }
            } @else {
              <p class="muted">{{ copy().empty.recommendedPath }}</p>
            }
          </section>

          <section>
            <h3>{{ copy().sections.roadmap }}</h3>
            @if (current.roadmap; as roadmap) {
              <p class="lead">{{ roadmap.pathName }} · {{ roadmap.levelName }}</p>
              <p>
                {{ copy().overall }} {{ roadmap.overallPercent }}% · {{ copy().completed }}
                {{ roadmap.completedCount }}/{{ roadmap.itemCount }} · {{ copy().inProgress }}
                {{ roadmap.inProgressCount }} · {{ copy().blocked }} {{ roadmap.blockedCount }}
              </p>
              <ul class="meters">
                @for (phase of roadmap.phases; track phase.title) {
                  <li>
                    <div class="meta">
                      <strong>{{ phase.title }}</strong>
                      <span>{{ phase.percent }}%</span>
                    </div>
                    <div class="bar"><span [style.width.%]="phase.percent"></span></div>
                  </li>
                }
              </ul>
            } @else {
              <p class="muted">{{ copy().empty.roadmap }}</p>
            }
          </section>

          <section>
            <h3>{{ copy().sections.kpis }}</h3>
            <p class="lead">
              {{ copy().overall }} {{ current.kpis.overallPercent }}% ·
              {{ current.kpis.overallStatusLabel }}
            </p>
            @if (current.kpis.items.length === 0) {
              <p class="muted">{{ copy().empty.kpis }}</p>
            } @else {
              <ul class="meters">
                @for (item of current.kpis.items; track item.name) {
                  <li>
                    <div class="meta">
                      <strong>{{ item.name }}</strong>
                      <span>{{ item.progressPercent }}% · {{ item.statusLabel }}</span>
                    </div>
                    <div class="bar"><span [style.width.%]="item.progressPercent"></span></div>
                  </li>
                }
              </ul>
            }
          </section>

          <section>
            <h3>{{ copy().sections.projects }}</h3>
            <p class="lead">
              {{ copy().overall }} {{ current.projects.overallPercent }}% · {{ copy().assigned }}
              {{ current.projects.assignedCount }} · {{ copy().completed }}
              {{ current.projects.completedCount }}
            </p>
            @if (current.projects.items.length === 0) {
              <p class="muted">{{ copy().empty.projects }}</p>
            } @else {
              <ul class="meters">
                @for (item of current.projects.items; track item.name) {
                  <li>
                    <div class="meta">
                      <strong>{{ item.name }}</strong>
                      <span>{{ item.progressPercent }}% · {{ item.statusLabel }}</span>
                    </div>
                    <div class="bar"><span [style.width.%]="item.progressPercent"></span></div>
                  </li>
                }
              </ul>
            }
          </section>

          <section>
            <h3>{{ copy().sections.achievements }}</h3>
            <ul>
              @for (
                item of listOrEmpty(current.achievements, copy().empty.achievements);
                track item
              ) {
                <li>{{ item }}</li>
              }
            </ul>
          </section>

          <section>
            <h3>{{ copy().sections.areasForImprovement }}</h3>
            <ul>
              @for (
                item of listOrEmpty(current.areasForImprovement, copy().empty.areasForImprovement);
                track item
              ) {
                <li>{{ item }}</li>
              }
            </ul>
          </section>

          <section>
            <h3>{{ copy().sections.nextGoals }}</h3>
            <ul>
              @for (item of listOrEmpty(current.nextGoals, copy().empty.nextGoals); track item) {
                <li>{{ item }}</li>
              }
            </ul>
          </section>
        </article>

        @if (pdfUrl(); as url) {
          <iframe class="pdf" [src]="url" title="Student progress PDF"></iframe>
        }
      }
    </div>
  `,
  styles: `
    .wrap {
      display: grid;
      gap: 16px;
      padding: 8px 0 0;
    }

    .loading {
      display: flex;
      justify-content: center;
      padding: 24px 0;
    }

    .toolbar,
    .actions,
    .meta {
      display: flex;
      justify-content: space-between;
      gap: 12px;
    }

    .toolbar {
      flex-wrap: wrap;
      align-items: flex-start;
    }

    .actions {
      flex-wrap: wrap;
    }

    .kicker {
      margin: 0;
      font-size: 0.72rem;
      color: #7a8a83;
    }

    .wrap[dir='ltr'] .kicker {
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    h2,
    h3,
    p {
      margin: 0;
    }

    h2 {
      color: #141e1a;
      font-size: 1.35rem;
    }

    .paper {
      padding: 0 0 28px;
      border-radius: 22px;
      background: #f4fbf8;
      color: #141e1a;
      box-shadow: 0 16px 40px rgb(20 30 26 / 8%);
      border: 1px solid #d5ddda;
      overflow: hidden;
    }

    .brand {
      display: flex;
      justify-content: space-between;
      flex-wrap: wrap;
      align-items: center;
      gap: 16px;
      padding: 18px 22px;
      margin: 0 0 8px;
      background: linear-gradient(135deg, #06382d, #0b4a3a 48%, #0e5c48);
      box-shadow: inset 0 -3px 0 #2fdb9a;
    }

    .identity {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .identity img {
      display: block;
      border-radius: 12px;
    }

    .wordmark {
      display: grid;
      gap: 4px;
    }

    .wordmark strong {
      font-size: 1.12rem;
      letter-spacing: 0.22em;
      color: #f4fbf8;
    }

    .wordmark span {
      font-size: 0.72rem;
      letter-spacing: 0.28em;
      text-transform: uppercase;
      color: #2fdb9a;
    }

    .report-meta p {
      font-weight: 700;
      color: #f4fbf8;
    }

    .report-meta span {
      color: color-mix(in srgb, #f4fbf8 70%, transparent);
    }

    section {
      padding: 18px 22px;
      border-bottom: 1px solid #e6eeea;
    }

    section:last-child {
      border-bottom: 0;
      padding-bottom: 0;
    }

    .muted,
    dt,
    .sub {
      color: #7a8a83;
    }

    h3 {
      margin-bottom: 10px;
      color: #0b4a3a;
      font-size: 0.95rem;
    }

    .paper[dir='ltr'] h3 {
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }

    .lead {
      font-weight: 700;
      margin-bottom: 6px;
    }

    dl {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px 20px;
      margin: 0;
    }

    dd {
      margin: 4px 0 0;
      font-weight: 600;
    }

    ul {
      margin: 8px 0 0;
      padding: 0 1.1em;
    }

    .meters {
      list-style: none;
      padding: 0;
      display: grid;
      gap: 10px;
    }

    .bar {
      height: 8px;
      border-radius: 999px;
      background: #e8f2ee;
      overflow: hidden;
    }

    .bar span {
      display: block;
      height: 100%;
      background: linear-gradient(90deg, #0c6b56, #0b4a3a);
    }

    .paper[dir='rtl'] .bar span {
      margin-inline-start: auto;
    }

    .pdf {
      width: 100%;
      min-height: 640px;
      border: 1px solid #d5ddda;
      border-radius: 16px;
      background: #f3f7f5;
    }

    @media (max-width: 720px) {
      dl {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class StudentReportPreview {
  private readonly api = inject(ReportApi);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly direction = inject(DirectionService).direction;
  private objectUrl: string | null = null;

  readonly studentId = input.required<string>();
  readonly showOpenLink = input(false);
  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  readonly report = signal<StudentProgressReport | null>(null);
  readonly pdfUrl = signal<SafeResourceUrl | null>(null);
  readonly locale = computed<ReportLocale>(() => (this.direction() === 'rtl' ? 'ar' : 'en'));
  readonly dir = computed(() => this.direction());
  readonly copy = computed(() => reportUi(this.locale()));

  constructor() {
    this.destroyRef.onDestroy(() => this.revokePdf());

    effect((onCleanup) => {
      const studentId = this.studentId();
      const locale = this.locale();
      this.loading.set(true);
      this.revokePdf();
      const sub = this.api.getPreview(studentId, locale).subscribe({
        next: (report) => {
          this.report.set(report);
          this.error.set(null);
          this.loading.set(false);
        },
        error: (error: unknown) => {
          this.report.set(null);
          this.error.set(this.toMessage(error));
          this.loading.set(false);
        },
      });
      onCleanup(() => sub.unsubscribe());
    });
  }

  generatePdf(): void {
    this.loadPdf(false);
  }

  downloadPdf(): void {
    this.loadPdf(true);
  }

  listOrEmpty(items: string[], empty: string): string[] {
    return items.length > 0 ? items : [empty];
  }

  private loadPdf(download: boolean): void {
    const current = this.report();
    if (!current) {
      return;
    }
    this.busy.set(true);
    this.api.getPdf(current.studentId, this.locale()).subscribe({
      next: (blob) => {
        this.busy.set(false);
        if (download) {
          this.saveBlob(blob, current.fileName);
          return;
        }
        this.revokePdf();
        this.objectUrl = URL.createObjectURL(blob);
        this.pdfUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(this.objectUrl));
      },
      error: (error: unknown) => {
        this.busy.set(false);
        this.snackBar.open(this.toMessage(error), 'OK', { duration: 4000 });
      },
    });
  }

  private saveBlob(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  }

  private revokePdf(): void {
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = null;
    }
    this.pdfUrl.set(null);
  }

  private toMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse && error.status === 404) {
      return this.copy().notFound;
    }
    return this.copy().loadError;
  }
}

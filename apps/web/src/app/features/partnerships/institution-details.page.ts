import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { DirectionService } from '../../core/direction.service';
import { TPipe } from '../../core/i18n/t.pipe';
import { EmptyState } from '../../shared/empty-state';
import { ErrorState } from '../../shared/error-state';
import { LoadingSkeleton } from '../../shared/loading-skeleton';
import { PageHeader } from '../../shared/page-header';
import { ACTIVITY_TYPES, FOLLOWUP_PRIORITIES, LEAD_PRIORITIES, LEAD_STATUSES, enumLabel } from './partnership.labels';
import {
  Activity,
  Contact,
  FollowUp,
  Institution,
  Lead,
  LeadStatus,
  Note,
  TimelineItem,
} from './partnership.models';
import { ProposalListItem } from './proposals/proposal.models';
import { SowListItem } from './sows/sow.models';
import { DeliveryListItem } from './delivery/delivery.models';
import { ReportListItem } from './reports/report.models';
import { OpportunityListItem } from './renewals/opportunity.models';
import { usePartnershipPermissions } from './partnership.permissions';
import { PartnershipsApi } from './partnerships.api';
import { partnershipErrorMessage } from './partnership.util';
import {
  PartnershipBreadcrumb,
  PartnershipBreadcrumbs,
  partnershipJourneyCrumbs,
} from './shared/partnership-breadcrumbs';

@Component({
  selector: 'app-institution-details-page',
  imports: [
    DatePipe,
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTabsModule,
    PageHeader,
    EmptyState,
    ErrorState,
    LoadingSkeleton,
    PartnershipBreadcrumbs,
    TPipe,
  ],
  templateUrl: './institution-details.page.html',
  styleUrl: './institution-details.page.scss',
})
export class InstitutionDetailsPage {
  private readonly api = inject(PartnershipsApi);
  private readonly route = inject(ActivatedRoute);
  private readonly snackBar = inject(MatSnackBar);
  private readonly fb = inject(FormBuilder);
  readonly i18n = inject(DirectionService);
  readonly permissions = usePartnershipPermissions();
  readonly label = enumLabel;
  readonly activityTypes = ACTIVITY_TYPES;
  readonly leadStatuses = LEAD_STATUSES;
  readonly leadPriorities = LEAD_PRIORITIES;
  readonly followUpPriorities = FOLLOWUP_PRIORITIES;

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly institution = signal<Institution | null>(null);
  readonly contacts = signal<Contact[]>([]);
  readonly leads = signal<Lead[]>([]);
  readonly followUps = signal<FollowUp[]>([]);
  readonly notes = signal<Note[]>([]);
  readonly proposals = signal<ProposalListItem[]>([]);
  readonly sows = signal<SowListItem[]>([]);
  readonly deliveries = signal<DeliveryListItem[]>([]);
  readonly reports = signal<ReportListItem[]>([]);
  readonly opportunities = signal<OpportunityListItem[]>([]);
  readonly timeline = signal<TimelineItem[]>([]);
  readonly panel = signal<'none' | 'contact' | 'activity' | 'followup' | 'note' | 'lead'>('none');

  readonly breadcrumbs = computed<PartnershipBreadcrumb[]>(() => {
    const current = this.institution();
    if (!current) {
      return [];
    }
    return partnershipJourneyCrumbs(
      (key) => this.i18n.t(key),
      'institutions',
      'nav.institutions',
      '/partnerships/institutions',
      current.name || this.i18n.t('partnerships.breadcrumbInstitution'),
    );
  });

  readonly contactForm = this.fb.nonNullable.group({
    firstName: ['', Validators.required],
    lastName: [''],
    jobTitle: [''],
    email: [''],
    phone: [''],
    mobile: [''],
    isPrimary: [false],
    isDecisionMaker: [false],
  });

  readonly activityForm = this.fb.nonNullable.group({
    activityType: ['NOTE' as string, Validators.required],
    subject: ['', Validators.required],
    description: [''],
    activityDate: [new Date().toISOString().slice(0, 16)],
  });

  readonly followUpForm = this.fb.nonNullable.group({
    title: ['', Validators.required],
    description: [''],
    dueDate: [new Date().toISOString().slice(0, 10), Validators.required],
    priority: ['MEDIUM' as string],
  });

  readonly noteForm = this.fb.nonNullable.group({
    content: ['', Validators.required],
  });

  readonly leadForm = this.fb.nonNullable.group({
    status: ['NEW' as LeadStatus],
    priority: ['UNKNOWN' as string],
    nextAction: [''],
    nextActionDate: [''],
    qualificationReason: [''],
  });

  constructor() {
    this.reload();
  }

  reload(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    const emptyPage = { items: [], total: 0, page: 1, pageSize: 20, pageCount: 0 };
    forkJoin({
      institution: this.api.getInstitution(id),
      contacts: this.api.listContacts({ institutionId: id, pageSize: 100 }),
      leads: this.api.listLeads({ institutionId: id, pageSize: 100 }),
      followUps: this.api.listFollowUps({ institutionId: id, pageSize: 100 }),
      notes: this.api.listNotes(id, 1, 100),
      proposals: this.api
        .listProposals({ institutionId: id, pageSize: 20 })
        .pipe(catchError(() => of(emptyPage))),
      sows: this.api
        .listSows({ institutionId: id, pageSize: 20 })
        .pipe(catchError(() => of(emptyPage))),
      deliveries: this.api
        .listDeliveries({ institutionId: id, pageSize: 20 })
        .pipe(catchError(() => of(emptyPage))),
      reports: this.api
        .listReports({ institutionId: id, pageSize: 20 })
        .pipe(catchError(() => of(emptyPage))),
      opportunities: this.api
        .listOpportunities({ institutionId: id, pageSize: 20 })
        .pipe(catchError(() => of(emptyPage))),
      timeline: this.api
        .getTimeline(id)
        .pipe(catchError(() => of({ items: [] as TimelineItem[] }))),
    }).subscribe({
      next: (data) => {
        this.institution.set(data.institution);
        this.contacts.set(data.contacts.items);
        this.leads.set(data.leads.items);
        this.followUps.set(data.followUps.items);
        this.notes.set(data.notes.items);
        this.proposals.set(data.proposals.items);
        this.sows.set(data.sows.items);
        this.deliveries.set(data.deliveries.items);
        this.reports.set(data.reports.items);
        this.opportunities.set(data.opportunities.items);
        this.timeline.set(data.timeline.items);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.error.set(partnershipErrorMessage(error, this.i18n.t('partnerships.loadError')));
      },
    });
  }

  meta(row: Institution): string {
    return [this.label(row.institutionType), row.city, row.governorate, this.label(row.status)]
      .filter((part) => part && part !== '—')
      .join(' · ');
  }

  locationLine(row: Institution): string {
    return [row.district, row.city, row.governorate].filter((part) => !!part).join(', ') || '—';
  }

  techFlags(row: Institution): string[] {
    const flags: string[] = [];
    if (row.hasCoding) flags.push(this.i18n.t('partnerships.techCoding'));
    if (row.hasRobotics) flags.push(this.i18n.t('partnerships.techRobotics'));
    if (row.hasStem) flags.push(this.i18n.t('partnerships.techStem'));
    if (row.hasAi) flags.push(this.i18n.t('partnerships.techAi'));
    if (row.hasTechClub) flags.push(this.i18n.t('partnerships.techClub'));
    if (row.hasAfterSchool) flags.push(this.i18n.t('partnerships.techAfterSchool'));
    if (row.hasSummerCamp) flags.push(this.i18n.t('partnerships.techSummerCamp'));
    if (row.hasMakerspace) flags.push(this.i18n.t('partnerships.techMakerspace'));
    return flags;
  }

  softDelete(): void {
    const id = this.institution()?.id;
    if (!id || !confirm(this.i18n.t('partnerships.deleteConfirm'))) {
      return;
    }
    this.api.softDeleteInstitution(id).subscribe({
      next: () => {
        this.snackBar.open(this.i18n.t('partnerships.deleted'), this.i18n.t('common.ok'), {
          duration: 2500,
        });
        this.reload();
      },
      error: (error: unknown) =>
        this.snackBar.open(
          partnershipErrorMessage(error, this.i18n.t('partnerships.saveFailed')),
          this.i18n.t('common.ok'),
          { duration: 4000 },
        ),
    });
  }

  restore(): void {
    const id = this.institution()?.id;
    if (!id) {
      return;
    }
    this.api.restoreInstitution(id).subscribe({
      next: () => {
        this.snackBar.open(this.i18n.t('partnerships.restored'), this.i18n.t('common.ok'), {
          duration: 2500,
        });
        this.reload();
      },
      error: (error: unknown) =>
        this.snackBar.open(
          partnershipErrorMessage(error, this.i18n.t('partnerships.saveFailed')),
          this.i18n.t('common.ok'),
          { duration: 4000 },
        ),
    });
  }

  submitContact(): void {
    const institutionId = this.institution()?.id;
    if (!institutionId || this.contactForm.invalid) {
      return;
    }
    const value = this.contactForm.getRawValue();
    this.api
      .createContact({
        institutionId,
        firstName: value.firstName.trim(),
        lastName: value.lastName.trim() || undefined,
        jobTitle: value.jobTitle.trim() || undefined,
        email: value.email.trim() || undefined,
        phone: value.phone.trim() || undefined,
        mobile: value.mobile.trim() || undefined,
        isPrimary: value.isPrimary,
        isDecisionMaker: value.isDecisionMaker,
      })
      .subscribe({
        next: () => {
          this.panel.set('none');
          this.contactForm.reset({ isPrimary: false, isDecisionMaker: false });
          this.toastSaved();
          this.reload();
        },
        error: (error: unknown) => this.toastError(error),
      });
  }

  submitActivity(): void {
    const institutionId = this.institution()?.id;
    if (!institutionId || this.activityForm.invalid) {
      return;
    }
    const value = this.activityForm.getRawValue();
    this.api
      .createActivity({
        institutionId,
        activityType: value.activityType as Activity['activityType'],
        subject: value.subject.trim(),
        description: value.description.trim() || undefined,
        activityDate: value.activityDate
          ? new Date(value.activityDate).toISOString()
          : undefined,
      })
      .subscribe({
        next: () => {
          this.panel.set('none');
          this.toastSaved();
          this.reload();
        },
        error: (error: unknown) => this.toastError(error),
      });
  }

  submitFollowUp(): void {
    const institutionId = this.institution()?.id;
    if (!institutionId || this.followUpForm.invalid) {
      return;
    }
    const value = this.followUpForm.getRawValue();
    this.api
      .createFollowUp({
        institutionId,
        title: value.title.trim(),
        description: value.description.trim() || undefined,
        dueDate: value.dueDate,
        priority: value.priority as FollowUp['priority'],
      })
      .subscribe({
        next: () => {
          this.panel.set('none');
          this.toastSaved();
          this.reload();
        },
        error: (error: unknown) => this.toastError(error),
      });
  }

  submitNote(): void {
    const institutionId = this.institution()?.id;
    if (!institutionId || this.noteForm.invalid) {
      return;
    }
    this.api.createNote(institutionId, { content: this.noteForm.controls.content.value.trim() }).subscribe({
      next: () => {
        this.panel.set('none');
        this.noteForm.reset();
        this.toastSaved();
        this.reload();
      },
      error: (error: unknown) => this.toastError(error),
    });
  }

  submitLead(): void {
    const institutionId = this.institution()?.id;
    if (!institutionId) {
      return;
    }
    const value = this.leadForm.getRawValue();
    this.api
      .createLead({
        institutionId,
        status: value.status,
        priority: value.priority as Lead['priority'],
        nextAction: value.nextAction.trim() || undefined,
        nextActionDate: value.nextActionDate || undefined,
        qualificationReason: value.qualificationReason.trim() || undefined,
      })
      .subscribe({
        next: () => {
          this.panel.set('none');
          this.toastSaved();
          this.reload();
        },
        error: (error: unknown) => this.toastError(error),
      });
  }

  completeFollowUp(id: string): void {
    this.api.updateFollowUp(id, { complete: true }).subscribe({
      next: () => {
        this.toastSaved();
        this.reload();
      },
      error: (error: unknown) => this.toastError(error),
    });
  }

  deleteNote(id: string): void {
    this.api.deleteNote(id).subscribe({
      next: () => {
        this.toastSaved();
        this.reload();
      },
      error: (error: unknown) => this.toastError(error),
    });
  }

  pendingFollowUps(): FollowUp[] {
    return this.followUps().filter((item) => item.status === 'PENDING');
  }

  completedFollowUps(): FollowUp[] {
    return this.followUps().filter((item) => item.status === 'COMPLETED');
  }

  private toastSaved(): void {
    this.snackBar.open(this.i18n.t('partnerships.saveSuccess'), this.i18n.t('common.ok'), {
      duration: 2500,
    });
  }

  private toastError(error: unknown): void {
    this.snackBar.open(
      partnershipErrorMessage(error, this.i18n.t('partnerships.saveFailed')),
      this.i18n.t('common.ok'),
      { duration: 4000 },
    );
  }
}

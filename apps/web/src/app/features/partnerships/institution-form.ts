import { Component, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { TPipe } from '../../core/i18n/t.pipe';
import {
  CURRICULA,
  EDUCATION_LEVELS,
  INSTITUTION_CATEGORIES,
  INSTITUTION_GENDERS,
  INSTITUTION_STATUSES,
  INSTITUTION_TYPES,
  LEAD_PRIORITIES,
  PARTNERSHIP_TYPES,
  enumLabel,
} from './partnership.labels';
import { Institution, InstitutionWritePayload } from './partnership.models';

@Component({
  selector: 'app-institution-form',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    TPipe,
  ],
  templateUrl: './institution-form.html',
  styleUrl: './institution-form.scss',
})
export class InstitutionForm {
  private readonly fb = inject(FormBuilder);

  readonly initial = input<Institution | null>(null);
  readonly saveLabel = input('Save');
  readonly submitting = input(false);
  readonly saved = output<InstitutionWritePayload>();
  readonly cancelled = output<void>();

  readonly types = INSTITUTION_TYPES;
  readonly categories = INSTITUTION_CATEGORIES;
  readonly curricula = CURRICULA;
  readonly levels = EDUCATION_LEVELS;
  readonly genders = INSTITUTION_GENDERS;
  readonly statuses = INSTITUTION_STATUSES;
  readonly priorities = LEAD_PRIORITIES;
  readonly partnershipTypes = PARTNERSHIP_TYPES;
  readonly label = enumLabel;

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    arabicName: [''],
    englishName: [''],
    institutionType: ['' as string],
    institutionCategory: ['' as string],
    curriculum: ['' as string],
    educationLevel: ['' as string],
    gender: ['' as string],
    ageRange: [''],
    governorate: [''],
    city: [''],
    district: [''],
    fullAddress: [''],
    phone: [''],
    mobile: [''],
    whatsapp: [''],
    generalEmail: [''],
    admissionsEmail: [''],
    contactEmail: [''],
    website: [''],
    facebook: [''],
    instagram: [''],
    linkedin: [''],
    youtube: [''],
    tiktok: [''],
    googleMapsUrl: [''],
    hasCoding: [false],
    hasRobotics: [false],
    hasStem: [false],
    hasAi: [false],
    hasTechClub: [false],
    hasAfterSchool: [false],
    hasSummerCamp: [false],
    hasMakerspace: [false],
    partnershipType: ['' as string],
    leadPriority: ['UNKNOWN' as string],
    leadPriorityReason: [''],
    status: ['PROSPECT' as string],
    notes: [''],
  });

  readonly hydrated = signal(false);

  constructor() {
    effect(() => {
      const value = this.initial();
      if (!value) {
        this.hydrated.set(true);
        return;
      }
      this.form.patchValue({
        name: value.name,
        arabicName: value.arabicName ?? '',
        englishName: value.englishName ?? '',
        institutionType: value.institutionType ?? '',
        institutionCategory: value.institutionCategory ?? '',
        curriculum: value.curriculum ?? '',
        educationLevel: value.educationLevel ?? '',
        gender: value.gender ?? '',
        ageRange: value.ageRange ?? '',
        governorate: value.governorate ?? '',
        city: value.city ?? '',
        district: value.district ?? '',
        fullAddress: value.fullAddress ?? '',
        phone: value.phone ?? '',
        mobile: value.mobile ?? '',
        whatsapp: value.whatsapp ?? '',
        generalEmail: value.generalEmail ?? '',
        admissionsEmail: value.admissionsEmail ?? '',
        contactEmail: value.contactEmail ?? '',
        website: value.website ?? '',
        facebook: value.facebook ?? '',
        instagram: value.instagram ?? '',
        linkedin: value.linkedin ?? '',
        youtube: value.youtube ?? '',
        tiktok: value.tiktok ?? '',
        googleMapsUrl: value.googleMapsUrl ?? '',
        hasCoding: value.hasCoding,
        hasRobotics: value.hasRobotics,
        hasStem: value.hasStem,
        hasAi: value.hasAi,
        hasTechClub: value.hasTechClub,
        hasAfterSchool: value.hasAfterSchool,
        hasSummerCamp: value.hasSummerCamp,
        hasMakerspace: value.hasMakerspace,
        partnershipType: value.partnershipType ?? '',
        leadPriority: value.leadPriority,
        leadPriorityReason: value.leadPriorityReason ?? '',
        status: value.status,
        notes: value.notes ?? '',
      });
      this.hydrated.set(true);
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    const optional = (value: string) => (value.trim() ? value.trim() : undefined);
    const optionalEnum = <T extends string>(value: string) =>
      value ? (value as T) : undefined;

    this.saved.emit({
      name: raw.name.trim(),
      arabicName: optional(raw.arabicName),
      englishName: optional(raw.englishName),
      institutionType: optionalEnum(raw.institutionType),
      institutionCategory: optionalEnum(raw.institutionCategory),
      curriculum: optionalEnum(raw.curriculum),
      educationLevel: optionalEnum(raw.educationLevel),
      gender: optionalEnum(raw.gender),
      ageRange: optional(raw.ageRange),
      governorate: optional(raw.governorate),
      city: optional(raw.city),
      district: optional(raw.district),
      fullAddress: optional(raw.fullAddress),
      phone: optional(raw.phone),
      mobile: optional(raw.mobile),
      whatsapp: optional(raw.whatsapp),
      generalEmail: optional(raw.generalEmail),
      admissionsEmail: optional(raw.admissionsEmail),
      contactEmail: optional(raw.contactEmail),
      website: optional(raw.website),
      facebook: optional(raw.facebook),
      instagram: optional(raw.instagram),
      linkedin: optional(raw.linkedin),
      youtube: optional(raw.youtube),
      tiktok: optional(raw.tiktok),
      googleMapsUrl: optional(raw.googleMapsUrl),
      hasCoding: raw.hasCoding,
      hasRobotics: raw.hasRobotics,
      hasStem: raw.hasStem,
      hasAi: raw.hasAi,
      hasTechClub: raw.hasTechClub,
      hasAfterSchool: raw.hasAfterSchool,
      hasSummerCamp: raw.hasSummerCamp,
      hasMakerspace: raw.hasMakerspace,
      partnershipType: optionalEnum(raw.partnershipType),
      leadPriority: optionalEnum(raw.leadPriority) ?? 'UNKNOWN',
      leadPriorityReason: optional(raw.leadPriorityReason),
      status: optionalEnum(raw.status) ?? 'PROSPECT',
      notes: raw.notes.trim(),
    });
  }
}

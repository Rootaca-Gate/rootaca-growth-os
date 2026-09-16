import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-student-avatar',
  template: `<span class="avatar" aria-hidden="true">{{ initials() }}</span>`,
  styles: `
    .avatar {
      display: inline-grid;
      place-items: center;
      width: 36px;
      height: 36px;
      border-radius: 12px;
      background: var(--ra-accent-soft);
      color: var(--ra-accent);
      font-size: 0.78rem;
      font-weight: 700;
      flex: 0 0 auto;
    }
  `,
})
export class StudentAvatar {
  readonly name = input.required<string>();

  readonly initials = computed(() => {
    const parts = this.name().trim().split(/\s+/).slice(0, 2);
    return parts.map((part) => part.charAt(0).toUpperCase()).join('') || 'S';
  });
}

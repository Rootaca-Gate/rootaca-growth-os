import { Component, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-search-input',
  imports: [MatIconModule, MatButtonModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SearchInput),
      multi: true,
    },
  ],
  template: `
    <label class="ra-search" [class.ra-search--focused]="focused()" [class.ra-search--disabled]="disabled()">
      @if (label()) {
        <span class="ra-search__label">{{ label() }}</span>
      }
      <div class="ra-search__field">
        <mat-icon class="ra-search__icon" aria-hidden="true">search</mat-icon>
        <input
          class="ra-search__input"
          type="search"
          [id]="inputId()"
          [value]="value()"
          [placeholder]="placeholder()"
          [disabled]="disabled()"
          [attr.aria-label]="ariaLabel() || placeholder() || label() || 'Search'"
          autocomplete="off"
          (input)="onInput($event)"
          (focus)="focused.set(true)"
          (blur)="onBlur()"
        />
        @if (value()) {
          <button
            type="button"
            class="ra-search__clear"
            [attr.aria-label]="clearLabel()"
            (click)="clear()"
          >
            <mat-icon>close</mat-icon>
          </button>
        }
      </div>
    </label>
  `,
  styles: `
    :host {
      display: block;
      width: 100%;
    }

    .ra-search {
      display: grid;
      gap: var(--ra-label-gap, 7px);
    }

    .ra-search__label {
      font-size: var(--ra-label, 0.8125rem);
      font-weight: 500;
      color: var(--ra-muted);
    }

    .ra-search__field {
      position: relative;
      display: flex;
      align-items: center;
      min-height: var(--ra-control-h, 44px);
      height: var(--ra-control-h, 44px);
      padding-inline: 12px;
      border: 1px solid var(--ra-border);
      border-radius: var(--ra-radius-sm, 10px);
      background: var(--ra-surface, #fff);
      transition:
        border-color 160ms ease,
        box-shadow 160ms ease;
    }

    .ra-search--focused .ra-search__field {
      border-color: var(--ra-accent);
      box-shadow: var(--ra-focus-ring);
    }

    .ra-search--disabled .ra-search__field {
      opacity: 0.6;
      background: var(--ra-surface-muted, #f7f9f7);
      cursor: not-allowed;
    }

    .ra-search__icon {
      flex: 0 0 auto;
      width: 20px;
      height: 20px;
      font-size: 20px;
      color: var(--ra-placeholder, #8a9a91);
      margin-inline-end: 8px;
    }

    .ra-search__input {
      flex: 1 1 auto;
      min-width: 0;
      height: 100%;
      border: 0;
      outline: 0;
      background: transparent;
      color: var(--ra-text);
      font: inherit;
      font-size: var(--ra-body-sm, 0.875rem);
      padding: 0;
      -webkit-appearance: none;
      appearance: none;
    }

    .ra-search__input::placeholder {
      color: var(--ra-placeholder, #8a9a91);
      opacity: 1;
    }

    .ra-search__input::-webkit-search-cancel-button,
    .ra-search__input::-webkit-search-decoration {
      -webkit-appearance: none;
      appearance: none;
    }

    .ra-search__clear {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex: 0 0 auto;
      width: 28px;
      height: 28px;
      margin: 0;
      margin-inline-start: 4px;
      padding: 0;
      border: 0;
      border-radius: 8px;
      background: transparent;
      color: var(--ra-muted);
      cursor: pointer;
      transition: background 140ms ease, color 140ms ease;
    }

    .ra-search__clear:hover {
      background: var(--ra-surface-muted, #f7f9f7);
      color: var(--ra-text);
    }

    .ra-search__clear mat-icon {
      width: 18px;
      height: 18px;
      font-size: 18px;
    }
  `,
})
export class SearchInput implements ControlValueAccessor {
  readonly placeholder = input('');
  readonly label = input('');
  readonly ariaLabel = input('');
  readonly clearLabel = input('Clear search');
  readonly inputId = input(`ra-search-${Math.random().toString(36).slice(2, 9)}`);

  readonly value = signal('');
  readonly focused = signal(false);
  readonly disabled = signal(false);

  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  writeValue(value: string | null): void {
    this.value.set(value ?? '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  onInput(event: Event): void {
    const next = (event.target as HTMLInputElement).value;
    this.value.set(next);
    this.onChange(next);
  }

  onBlur(): void {
    this.focused.set(false);
    this.onTouched();
  }

  clear(): void {
    if (this.disabled()) {
      return;
    }
    this.value.set('');
    this.onChange('');
    this.onTouched();
  }
}

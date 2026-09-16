import { Injectable, effect, inject } from '@angular/core';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { DirectionService } from '../direction.service';

@Injectable()
export class AppPaginatorIntl extends MatPaginatorIntl {
  private readonly i18n = inject(DirectionService);

  constructor() {
    super();
    effect(() => {
      this.i18n.locale();
      this.itemsPerPageLabel = this.i18n.t('paginator.itemsPerPage');
      this.nextPageLabel = this.i18n.t('paginator.next');
      this.previousPageLabel = this.i18n.t('paginator.previous');
      this.firstPageLabel = this.i18n.t('paginator.first');
      this.lastPageLabel = this.i18n.t('paginator.last');
      this.changes.next();
    });
  }

  override getRangeLabel = (page: number, pageSize: number, length: number): string => {
    if (length === 0 || pageSize === 0) {
      return `0 ${this.i18n.t('common.of')} ${length}`;
    }
    const start = page * pageSize;
    const end = Math.min(start + pageSize, length);
    return `${start + 1} – ${end} ${this.i18n.t('common.of')} ${length}`;
  };
}

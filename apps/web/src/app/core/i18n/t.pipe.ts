import { Pipe, PipeTransform, inject } from '@angular/core';
import { DirectionService } from '../direction.service';

@Pipe({
  name: 't',
  pure: false,
})
export class TPipe implements PipeTransform {
  private readonly i18n = inject(DirectionService);

  transform(key: string, params?: Record<string, string | number>): string {
    return this.i18n.t(key, params);
  }
}

import { Component } from '@angular/core';

@Component({
  selector: 'app-filter-bar',
  template: `
    <section class="ra-toolbar" role="search">
      <div class="ra-toolbar__search">
        <ng-content select="[search]" />
      </div>
      <div class="ra-toolbar__filters">
        <ng-content />
      </div>
    </section>
  `,
  styles: `
    :host {
      display: block;
    }
  `,
})
export class FilterBar {}

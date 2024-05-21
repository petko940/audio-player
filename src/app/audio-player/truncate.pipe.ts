import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'truncate'
})
export class TruncatePipe implements PipeTransform {

  transform(value: string, maxLength: number = 40): string {
    value = value.slice(0, value.length - 4);
    if (value.length <= maxLength) {
      return value;
    } else {
      const truncatedString = value.substring(0, maxLength - 3);
      return truncatedString + '...';
    }
  }

}

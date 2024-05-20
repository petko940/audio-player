import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'truncate'
})
export class TruncatePipe implements PipeTransform {

  transform(value: string, maxLength: number = 35): string {
    if (value.length <= maxLength) {
      return value;
    } else {
      const truncatedString = value.substring(0, maxLength - 3);
      return truncatedString + '...';
    }
  }

}

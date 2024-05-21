import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'secondsToMmSs'
})
export class SecondsToMmSsPipe implements PipeTransform {

  transform(value: number): string {
    const minutes: number = Math.floor(value / 60);
    const seconds: number = Math.floor(value % 60);

    return `${this.padNumber(minutes)}:${this.padNumber(seconds)}`;
  }

  private padNumber(number: number): string {
    return number < 10 ? `0${number}` : `${number}`;
  }

}

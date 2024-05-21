import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { TruncatePipe } from './audio-player/truncate.pipe';
import { AudioPlayerComponent } from './audio-player/audio-player.component';
import { FormsModule } from '@angular/forms';
import { SecondsToMmSsPipe } from './audio-player/seconds-to-mm-ss.pipe';

@NgModule({
  declarations: [
    AppComponent,
    TruncatePipe,
    AudioPlayerComponent,
    SecondsToMmSsPipe
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }

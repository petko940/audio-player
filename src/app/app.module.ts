import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { PlaylistComponent } from './playlist/playlist.component';
import { ControlComponent } from './control/control.component';
import { VolumeComponent } from './volume/volume.component';

@NgModule({
  declarations: [
    AppComponent,
    PlaylistComponent,
    ControlComponent,
    VolumeComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }

import { AfterViewChecked, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import AOS from 'aos';


@Component({
    selector: 'app-audio-player',
    templateUrl: './audio-player.component.html',
    styleUrl: './audio-player.component.css'
})
export class AudioPlayerComponent implements OnInit, AfterViewChecked {
    @ViewChild('audioPlayer', { static: false }) audioPlayer!: ElementRef<HTMLAudioElement>;
    audioFiles: Array<{ name: string, url: string }> = [];
    currentSongIndex: number = -1;
    filesLoaded: boolean = false;
    currentSongNamePlay: string = "";
    isPlaying: boolean = false;
    progress: number = 0;
    progressInterval: any;
    volume: number = 0.1;
    songDuration: number = 0;
    currentTimeSong: number = 0;
 
    ngOnInit(): void {
        AOS.init();
        this.addPlayEventListener();
    }

    ngAfterViewChecked(): void {
        AOS.refresh();
        if (this.audioPlayer && !this.audioPlayer.nativeElement.hasAttribute('data-listener-added')) {
            this.audioPlayer.nativeElement.addEventListener('play', this.startUpdatingProgress.bind(this));
            this.audioPlayer.nativeElement.setAttribute('data-listener-added', 'true');
        }
    }

    addPlayEventListener(): void {
        if (this.audioPlayer) {
            this.audioPlayer.nativeElement.addEventListener('play', this.startUpdatingProgress.bind(this));
        }
    }

    loadFolder(event: any): void {
        const files = event.target.files;
        if (files && files.length > 0) {
            this.audioFiles = [];
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                if (file.type.startsWith('audio')) {
                    const fileURL = URL.createObjectURL(file);
                    this.audioFiles.push({ name: file.name, url: fileURL });
                }
            }
            this.filesLoaded = true;
            AOS.refresh();
        }
    }

    togglePlayPause(): void {
        const audio = this.audioPlayer.nativeElement;
        if (this.isPlaying) {
            audio.pause();
            this.isPlaying = false;
            this.stopUpdatingProgress();
        } else {
            if (audio.src === "") {
                this.playSong(0);
            } else {
                audio.play().then(() => {
                    this.isPlaying = true;
                    this.startUpdatingProgress();
                }).catch(error => {
                    this.isPlaying = false;
                });
            }
        }
    }

    playSong(index: number): void {
        this.currentSongIndex = index;
        const selectedSong = this.audioFiles[index];
        const audio = this.audioPlayer.nativeElement;
        this.currentSongNamePlay = selectedSong.name.slice(0, -4);

        audio.src = selectedSong.url;
        audio.load();

        audio.play().then(() => {
            this.isPlaying = true;
            this.songDuration = audio.duration;
        }).catch(error => {
            this.isPlaying = false;
        });

    }

    stopSong(): void {
        const audio = this.audioPlayer.nativeElement;
        audio.pause();
        audio.currentTime = 0;
        this.progress = 0
        this.isPlaying = false;
    }

    playNextSong(): void {
        if (this.audioFiles.length === 0) return;
        this.currentSongIndex = (this.currentSongIndex + 1) % this.audioFiles.length;
        this.playSong(this.currentSongIndex);
    }

    playPreviousSong(): void {
        if (this.audioFiles.length === 0) return;
        this.currentSongIndex = (this.currentSongIndex - 1 + this.audioFiles.length) % this.audioFiles.length;
        this.playSong(this.currentSongIndex);
    }

    startUpdatingProgress(): void {
        if (!this.progressInterval) {
            this.progressInterval = setInterval(() => {
                this.updateProgress();
            }, 1000);
        }
    }

    stopUpdatingProgress(): void {
        clearInterval(this.progressInterval);
        this.progressInterval = null;
    }

    updateProgress(): void {
        const audio = this.audioPlayer.nativeElement;
        if (audio.duration > 0) {
            this.progress = (audio.currentTime / audio.duration) * 100;
            this.currentTimeSong = audio.currentTime;
        }
    }

    seek(event: MouseEvent): void {
        const progressContainer = event.target as HTMLElement;
        const rect = progressContainer.getBoundingClientRect();
        const offsetX = event.clientX - rect.left;
        const width = rect.width;
        const clickPositionPercentage = (offsetX / width);
        const audio = this.audioPlayer.nativeElement;
        audio.currentTime = audio.duration * clickPositionPercentage;
        this.updateProgress();
        this.currentTimeSong = audio.currentTime;
    }

    adjustVolume(): void {
        this.audioPlayer.nativeElement.volume = this.volume;
    }

    adjustVolumeWithScroll(event: WheelEvent): void {
        event.preventDefault();

        const delta = Math.sign(event.deltaY);
        const step = 0.05;

        let newVolume = this.volume - (delta * step);
        newVolume = Math.min(Math.max(newVolume, 0), 1);

        this.volume = newVolume;
        this.adjustVolume();
    }

    updateCurrentTime(): void {
        const audio = this.audioPlayer.nativeElement;
        this.currentTimeSong = audio.currentTime;
    }

    isCurrentSong(index: number): boolean {
        return index === this.currentSongIndex && this.isPlaying;
    }

}
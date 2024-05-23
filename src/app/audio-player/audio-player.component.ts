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

    @ViewChild('canvas', { static: false }) canvas!: ElementRef<HTMLCanvasElement>;
    audioContext!: AudioContext | null;
    analyser!: AnalyserNode | null;
    dataArray!: Uint8Array;
    bufferLength!: number;
    canvasContext!: CanvasRenderingContext2D;
    animationFrameId!: number;


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
        event.preventDefault();
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
            cancelAnimationFrame(this.animationFrameId);
        } else {
            if (audio.src === "") {
                this.playSong(0);
            } else {
                audio.play().then(() => {
                    this.isPlaying = true;
                    this.startUpdatingProgress();
                    this.startVisualizer();
                }).catch(error => {
                    this.isPlaying = false;
                    cancelAnimationFrame(this.animationFrameId);
                });
            }
        }
    }

    playSong(index: number): void {
        if (this.isPlaying) {
            this.stopSong();
        }

        this.currentSongIndex = index;
        const selectedSong = this.audioFiles[index];
        const audio = this.audioPlayer.nativeElement;
        this.currentSongNamePlay = selectedSong.name.slice(0, -4);

        audio.src = selectedSong.url;
        audio.load();

        audio.volume = this.volume;

        audio.play().then(() => {
            this.isPlaying = true;
            this.songDuration = audio.duration;
            if (!this.analyser) {
                this.initVisualizer();
            } else {
                this.startVisualizer();
            }
            this.isPlaying = true;
        }).catch(error => {
            this.isPlaying = false;
            cancelAnimationFrame(this.animationFrameId);
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

    initVisualizer(): void {
        if (!this.audioContext) {
            this.audioContext = new AudioContext();
        }

        this.analyser = this.audioContext.createAnalyser();
        const source = this.audioContext.createMediaElementSource(this.audioPlayer.nativeElement);
        source.connect(this.analyser);
        this.analyser.connect(this.audioContext.destination);

        this.analyser.fftSize = 1024;
        this.bufferLength = this.analyser.frequencyBinCount;
        this.dataArray = new Uint8Array(this.bufferLength);

        const canvas = this.canvas.nativeElement;
        this.canvasContext = canvas.getContext('2d')!;

        this.startVisualizer();
    }

    startVisualizer(): void {
        const draw = () => {
            if (!this.canvas || !this.canvas.nativeElement) {
                return;
            }

            this.animationFrameId = requestAnimationFrame(draw);

            this.analyser?.getByteFrequencyData(this.dataArray);

            const canvas = this.canvas.nativeElement;
            const width = canvas.width;
            const height = canvas.height;

            this.canvasContext.clearRect(0, 0, width, height);

            const barWidth = (width / this.bufferLength) * 2.5;
            let barHeight;
            let x = 0;

            const gradient = this.canvasContext.createLinearGradient(0, 0, 0, height);
            gradient.addColorStop(0, 'red');
            gradient.addColorStop(1, 'green');

            for (let i = 0; i < this.bufferLength; i++) {
                barHeight = this.dataArray[i];

                this.canvasContext.fillStyle = gradient;
                this.canvasContext.fillRect(x, height - barHeight / 2, barWidth, barHeight / 2);

                x += barWidth + 1;
            }
        };

        draw();
    }

    resetPlaylist() {
        this.audioFiles = [];
        this.filesLoaded = false;
        this.stopSong();
        this.currentSongNamePlay = '';
        this.currentSongIndex = -1;
        this.currentTimeSong = 0;
        this.songDuration = 0;
        cancelAnimationFrame(this.animationFrameId);
        this.analyser?.disconnect();
        this.analyser = null;
        this.audioContext?.close();
        this.audioContext = null;
        this.stopUpdatingProgress();
        AOS.refresh();
    }
}
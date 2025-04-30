import { reactive, reactiveRecord } from "../utils/reactive";
import PlayerService from "./player.ts"

class MyStream {
    private static _myStream: MediaStream | null;
    static isSelfMuted = reactive<boolean>(false);

    private static async createStream(selectedDeviceId: string): Promise<MediaStream> {
        return navigator.mediaDevices.getUserMedia({
            audio: selectedDeviceId
                ? { deviceId: { exact: selectedDeviceId } }
                : true,
        });
    }

    static get() {
        if (!this._myStream) throw new Error("tried getting myStream before initialization")
        return this._myStream
    }

    static async update(selectedDeviceId: string) {
        const myStream = this._myStream

        if (myStream && myStream.getAudioTracks()[0])
            myStream.getAudioTracks()[0].stop()

        this._myStream = await this.createStream(selectedDeviceId)
    }

    static toggleMuteSelf() {
        const myStream = this.get()
        const track = myStream.getAudioTracks()[0];

        track.enabled = !track.enabled;

        const current = this.isSelfMuted.get();
        this.isSelfMuted.set(!current);
    }
}

class AudioService {
    static audioStreams = reactiveRecord<MediaStream>({})

    static async onSelectedDeviceChange(selectedDeviceId: string) {
        await MyStream.update(selectedDeviceId)
    }

    static addAudioStream(name: string, stream: MediaStream) {
        if (name)
            this.audioStreams.patch(name, stream)
    }

    static removeAudioStream(name: string) {
        if (name)
            this.audioStreams.delete(name)
    }

    static toggleMute(playerName: string) {
        if (playerName === PlayerService.getPlayerName())
            return MyStream.toggleMuteSelf()

        const current = this.audioStreams.get()
        const playerStream = current[playerName]

        if (!playerStream)
            throw new Error(`player ${playerName} not found`)

        const track = playerStream.getAudioTracks()[0];
        track.enabled = !track.enabled;

        this.audioStreams.set(current)
    }
}

export {
    AudioService, MyStream
}
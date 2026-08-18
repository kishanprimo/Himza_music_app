import ffmpeg from 'fluent-ffmpeg';
import ffprobeStatic from 'ffprobe-static';

ffmpeg.setFfprobePath(ffprobeStatic.path);

export const getAudioDuration = (filePath: string): Promise<number> => {
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(filePath, (err, metadata) => {
            if (err) return reject(err);
            const durationInSeconds = metadata.format.duration || 0;
            const durationInMinutes = durationInSeconds / 60;
            resolve(parseFloat(durationInMinutes.toFixed(2)));
        });
    });
};

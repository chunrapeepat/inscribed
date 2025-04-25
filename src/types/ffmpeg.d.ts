declare module "ffmpeg.js" {
  interface FFmpegMemoryFileSystem {
    name: string;
    data: Uint8Array;
  }

  interface FFmpegResult {
    MEMFS: FFmpegMemoryFileSystem[];
    exitCode: number;
    stderr: string;
    stdout: string;
  }

  interface FFmpegOptions {
    MEMFS?: FFmpegMemoryFileSystem[];
    arguments?: string[];
    stdin?: (() => void) | null;
    onExit?: (code: number, output: string) => void;
    print?: (message: string) => void;
    printErr?: (message: string) => void;
  }

  export default function ffmpeg(options: FFmpegOptions): FFmpegResult;
}

// Add declaration for ffmpeg-mp4 variant
declare module "ffmpeg.js/ffmpeg-mp4" {
  import { FFmpegOptions, FFmpegResult } from "ffmpeg.js";
  export default function ffmpeg(options: FFmpegOptions): FFmpegResult;
}

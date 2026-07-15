import { init as initPngDecode, decode as decodePng } from '@jsquash/png/decode.js';
// @jsquash/png는 이 wasm 파일 옆에 wasm-bindgen이 생성한 자체 .wasm.d.ts(named export)를 두는데,
// 그건 이 프로젝트가 쓰는 방식(WebAssembly.Module 직접 주입)과 맞지 않아 충돌한다.
// ?module 접미사로 그 특정 선언과 경로를 다르게 만들고 대신 src/types/wasm.d.ts의
// 와일드카드 선언(default export = WebAssembly.Module)을 적용받는다.
import pngWasm from '@jsquash/png/codec/pkg/squoosh_png_bg.wasm?module';

import mozjpegDecFactory, { MozJPEGModule } from '@jsquash/jpeg/codec/dec/mozjpeg_dec.js';
import { initEmscriptenModule as initJpegModule } from '@jsquash/jpeg/utils.js';
import jpegDecWasm from '@jsquash/jpeg/codec/dec/mozjpeg_dec.wasm';

import webpEncFactory, { WebPModule, EncodeOptions as WebpEncodeOptions } from '@jsquash/webp/codec/enc/webp_enc.js';
import { initEmscriptenModule as initWebpModule } from '@jsquash/webp/utils.js';
import { defaultOptions as webpDefaultOptions } from '@jsquash/webp/meta.js';
import webpEncWasm from '@jsquash/webp/codec/enc/webp_enc.wasm';

import { HttpError } from '../http/HttpError';
import { MAX_IMAGE_DIMENSION } from '../config/constants';

/**
 * PNG/JPEG를 디코딩해 WebP로 인코딩하는 파이프라인.
 *
 * jSquash(@jsquash/*)는 WASM 코덱을 fetch()로 로드하는 것이 기본값인데,
 * Cloudflare Workers에는 파일시스템/상대 fetch가 없어 그대로는 동작하지 않는다.
 * 대신 Wrangler가 `*.wasm` import를 미리 컴파일된 WebAssembly.Module로 번들링해주는
 * 점을 이용해, 각 코덱의 저수준 인스턴스화 함수에 그 모듈을 직접 주입한다
 * (PNG는 wasm-bindgen 스타일의 init(module), JPEG/WebP는 Emscripten 스타일의
 * initEmscriptenModule(factory, module)). 이렇게 하면 네트워크 요청이 전혀 발생하지 않는다.
 *
 * 인코딩은 WASM 실행이라 CPU 시간이 상당히 들 수 있으므로, 픽셀 크기를 제한해
 * Workers CPU 시간 제한(wrangler.toml [limits] cpu_ms)을 넘기지 않도록 방어한다.
 */

let pngInitPromise: Promise<unknown> | null = null;
function ensurePngReady(): Promise<unknown> {
  if (!pngInitPromise) pngInitPromise = initPngDecode(pngWasm);
  return pngInitPromise;
}

let jpegModulePromise: Promise<MozJPEGModule> | null = null;
function getJpegModule(): Promise<MozJPEGModule> {
  if (!jpegModulePromise) jpegModulePromise = initJpegModule(mozjpegDecFactory, jpegDecWasm);
  return jpegModulePromise;
}

let webpModulePromise: Promise<WebPModule> | null = null;
function getWebpModule(): Promise<WebPModule> {
  if (!webpModulePromise) webpModulePromise = initWebpModule(webpEncFactory, webpEncWasm);
  return webpModulePromise;
}

type DetectedFormat = 'png' | 'jpeg' | 'webp' | 'unknown';

function detectFormat(bytes: Uint8Array): DetectedFormat {
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return 'png';
  }
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'jpeg';
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return 'webp';
  }
  return 'unknown';
}

async function decodePngImage(buffer: ArrayBuffer): Promise<ImageData> {
  await ensurePngReady();
  return decodePng(buffer);
}

async function decodeJpegImage(buffer: ArrayBuffer): Promise<ImageData> {
  const module = await getJpegModule();
  const result = module.decode(new Uint8Array(buffer), false);
  if (!result) throw new HttpError(400, 'JPEG 이미지를 읽을 수 없습니다.');
  return result;
}

async function encodeWebpImage(image: ImageData, options: Partial<WebpEncodeOptions> = {}): Promise<ArrayBuffer> {
  const module = await getWebpModule();
  const merged: WebpEncodeOptions = { ...webpDefaultOptions, ...options };
  const result = module.encode(image.data, image.width, image.height, merged);
  if (!result) throw new HttpError(500, 'WebP 인코딩에 실패했습니다.');
  // WASM 선형 메모리에서 나온 결과이므로 SharedArrayBuffer일 수 없다(jSquash 자체 encode()도 동일하게 처리).
  return result.buffer as ArrayBuffer;
}

export interface ProcessedImage {
  bytes: ArrayBuffer;
  contentType: 'image/webp';
}

export class ImageProcessor {
  /** 임의의 PNG/JPEG/WebP 바이트를 받아 WebP로 정규화한다. 이미 WebP면 그대로 통과시킨다. */
  static async toWebp(input: ArrayBuffer): Promise<ProcessedImage> {
    const bytes = new Uint8Array(input);
    const format = detectFormat(bytes);

    if (format === 'webp') {
      return { bytes: input, contentType: 'image/webp' };
    }

    let imageData: ImageData;
    if (format === 'png') {
      imageData = await decodePngImage(input);
    } else if (format === 'jpeg') {
      imageData = await decodeJpegImage(input);
    } else {
      throw new HttpError(415, '지원하지 않는 이미지 형식입니다. PNG, JPEG, WebP 파일만 업로드할 수 있습니다.');
    }

    if (imageData.width < 1 || imageData.height < 1) {
      throw new HttpError(400, '이미지를 읽을 수 없습니다.');
    }
    if (imageData.width > MAX_IMAGE_DIMENSION || imageData.height > MAX_IMAGE_DIMENSION) {
      throw new HttpError(
        413,
        `이미지 크기는 가로/세로 각각 최대 ${MAX_IMAGE_DIMENSION}px까지 지원합니다. 크기를 줄여 다시 업로드해주세요.`,
      );
    }

    const encoded = await encodeWebpImage(imageData);
    return { bytes: encoded, contentType: 'image/webp' };
  }
}

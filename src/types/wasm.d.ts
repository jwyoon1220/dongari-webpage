/**
 * Wrangler는 `**\/*.wasm` import를 CompiledWasm 모듈 규칙으로 번들링해
 * fetch 없이 바로 사용 가능한 WebAssembly.Module 인스턴스를 default export로 제공한다.
 * (Cloudflare Workers에는 파일시스템/상대 fetch가 없으므로 이 경로로만 WASM을 로드할 수 있다.)
 *
 * `@jsquash/png`가 wasm-bindgen으로 생성한 squoosh_png_bg.wasm.d.ts는 이 프로젝트가 쓰는
 * 방식(WebAssembly.Module을 직접 주입)과 맞지 않는 별도의 named export 타입을 선언해두어
 * 충돌한다. 그 파일과 이름이 겹치지 않도록 `?module` 접미사를 붙여 import하고(Wrangler가
 * `**\/*.wasm?module`도 동일하게 CompiledWasm으로 처리함), 이 와일드카드로 타입을 잡는다.
 */
declare module '*.wasm' {
  const module: WebAssembly.Module;
  export default module;
}

declare module '*.wasm?module' {
  const module: WebAssembly.Module;
  export default module;
}

/**
 * jSquash의 .d.ts들은 브라우저 "dom" lib에 있는 전역 ImageData를 전제로 하는데,
 * 이 프로젝트는 Workers 런타임 타깃이라 lib에 dom을 포함하지 않는다. jSquash 자체가
 * Cloudflare Workers에서 런타임에 폴리필하는 형태({data, width, height})와 구조적으로
 * 맞는 최소 타입만 선언해 둔다.
 *
 * 주의: 이 파일은 import/export가 없는 "스크립트" 파일이어야 위 declare module들과
 * 아래 interface가 전역 앰비언트 선언으로 적용된다. export {}를 추가해 모듈 파일로
 * 바꾸면 declare module들이 이 파일 안에서만 유효한 지역 선언으로 취급되어 깨진다.
 */
interface ImageData {
  readonly data: Uint8ClampedArray;
  readonly width: number;
  readonly height: number;
}

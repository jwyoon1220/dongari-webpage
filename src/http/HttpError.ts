/** 컨트롤러에서 던지는, 사용자에게 그대로 노출해도 안전한 상태 코드+메시지 오류 */
export class HttpError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}

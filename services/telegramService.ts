// ═══════════════════════════════════════════════════════════
// 📱 텔레그램 봇 알림 서비스
// ═══════════════════════════════════════════════════════════

const BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
const CHAT_ID = import.meta.env.VITE_TELEGRAM_CHAT_ID;

/**
 * 텔레그램으로 메시지 전송
 */
export async function sendTelegramMessage(message: string): Promise<boolean> {
    if (!BOT_TOKEN || !CHAT_ID) {
        console.warn('텔레그램 설정 없음, 알림 스킵');
        return false;
    }

    try {
        const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: CHAT_ID,
                text: message,
                parse_mode: 'HTML'
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        console.log('📱 텔레그램 알림 전송됨');
        return true;
    } catch (e: any) {
        console.error('텔레그램 전송 실패:', e);
        return false;
    }
}

// ═══════════════════════════════════════════════════════════
// 📊 알림 헬퍼 함수들
// ═══════════════════════════════════════════════════════════

/**
 * 발행 완료 알림
 */
export function notifyPublishSuccess(title: string, siteUrl: string): Promise<boolean> {
    const message = `✅ <b>발행 완료</b>

📝 ${title}
🌐 ${siteUrl}
⏰ ${new Date().toLocaleString('ko-KR')}`;

    return sendTelegramMessage(message);
}

/**
 * 발행 실패 알림
 */
export function notifyPublishFailed(title: string, error: string): Promise<boolean> {
    const message = `❌ <b>발행 실패</b>

📝 ${title}
⚠️ ${error}
⏰ ${new Date().toLocaleString('ko-KR')}`;

    return sendTelegramMessage(message);
}

/**
 * 배치 시작 알림
 */
export function notifyBatchStart(count: number): Promise<boolean> {
    const message = `🚀 <b>배치 발행 시작</b>

📊 총 ${count}개 글 생성 예정
⏰ ${new Date().toLocaleString('ko-KR')}`;

    return sendTelegramMessage(message);
}

/**
 * 배치 완료 알림
 */
export function notifyBatchComplete(success: number, failed: number): Promise<boolean> {
    const message = `🎉 <b>배치 발행 완료</b>

✅ 성공: ${success}개
❌ 실패: ${failed}개
⏰ ${new Date().toLocaleString('ko-KR')}`;

    return sendTelegramMessage(message);
}

/**
 * 일시정지 알림
 */
export function notifyPaused(): Promise<boolean> {
    return sendTelegramMessage(`⏸️ <b>일시정지됨</b>

재개하려면 /resume 명령을 사용하세요.`);
}

/**
 * 재개 알림
 */
export function notifyResumed(): Promise<boolean> {
    return sendTelegramMessage(`▶️ <b>재개됨</b>

발행이 계속됩니다.`);
}

/**
 * 상태 보고
 */
export function notifyStatus(status: {
    isPaused: boolean;
    queueLength: number;
    completedCount: number;
    failedCount: number;
    currentItem?: string;
}): Promise<boolean> {
    const statusEmoji = status.isPaused ? '⏸️ 일시정지' : '▶️ 진행중';
    const message = `📊 <b>현재 상태</b>

${statusEmoji}
📝 대기: ${status.queueLength}개
✅ 완료: ${status.completedCount}개
❌ 실패: ${status.failedCount}개
${status.currentItem ? `🔄 처리중: ${status.currentItem}` : ''}
⏰ ${new Date().toLocaleString('ko-KR')}`;

    return sendTelegramMessage(message);
}

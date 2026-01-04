// ═══════════════════════════════════════════════════════════
// ☁️ Supabase 클라우드 동기화 서비스
// ═══════════════════════════════════════════════════════════

import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { AppSettings } from '../types';

// Supabase 클라이언트 초기화
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// ═══════════════════════════════════════════════════════════
// 🔐 인증 함수들
// ═══════════════════════════════════════════════════════════

const ADMIN_EMAIL = 'admin@wp-please.local';

/**
 * 비밀번호로 로그인 (회원가입 자동 처리)
 */
export async function loginWithPassword(password: string): Promise<{ success: boolean; error?: string }> {
    try {
        // 먼저 로그인 시도
        const { data, error } = await supabase.auth.signInWithPassword({
            email: ADMIN_EMAIL,
            password: password
        });

        if (data.user) {
            console.log('✅ 로그인 성공');
            return { success: true };
        }

        // 로그인 실패 시 회원가입 시도 (최초 1회)
        if (error?.message?.includes('Invalid login credentials')) {
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                email: ADMIN_EMAIL,
                password: password
            });

            if (signUpData.user) {
                console.log('✅ 회원가입 + 로그인 성공');
                return { success: true };
            }

            return { success: false, error: signUpError?.message || '회원가입 실패' };
        }

        return { success: false, error: error?.message || '로그인 실패' };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

/**
 * 로그아웃
 */
export async function logout(): Promise<void> {
    await supabase.auth.signOut();
    console.log('👋 로그아웃 완료');
}

/**
 * 현재 사용자 가져오기
 */
export async function getCurrentUser(): Promise<User | null> {
    const { data } = await supabase.auth.getSession();
    return data.session?.user ?? null;
}

// ═══════════════════════════════════════════════════════════
// 📦 설정 동기화 함수들
// ═══════════════════════════════════════════════════════════

/**
 * 클라우드에서 설정 불러오기
 */
export async function loadSettingsFromCloud(userId: string): Promise<AppSettings | null> {
    try {
        const { data, error } = await supabase
            .from('user_settings')
            .select('settings')
            .eq('user_id', userId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                // 데이터 없음 - 정상
                return null;
            }
            throw error;
        }

        console.log('☁️ 클라우드에서 설정 불러옴');
        return data?.settings as AppSettings;
    } catch (e: any) {
        console.error('클라우드 설정 로드 실패:', e);
        return null;
    }
}

/**
 * 클라우드에 설정 저장
 */
export async function saveSettingsToCloud(userId: string, settings: AppSettings): Promise<boolean> {
    try {
        const { error } = await supabase
            .from('user_settings')
            .upsert({
                user_id: userId,
                settings: settings,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'user_id'
            });

        if (error) throw error;

        console.log('☁️ 클라우드에 설정 저장됨');
        return true;
    } catch (e: any) {
        console.error('클라우드 설정 저장 실패:', e);
        return false;
    }
}

// ═══════════════════════════════════════════════════════════
// 🎮 원격 명령 함수들 (텔레그램 제어용)
// ═══════════════════════════════════════════════════════════

export interface RemoteCommand {
    id: string;
    command: 'pause' | 'resume' | 'status';
    created_at: string;
    processed: boolean;
}

/**
 * 미처리 명령 가져오기
 */
export async function getPendingCommands(userId: string): Promise<RemoteCommand[]> {
    try {
        const { data, error } = await supabase
            .from('remote_commands')
            .select('*')
            .eq('user_id', userId)
            .eq('processed', false)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data || [];
    } catch (e) {
        return [];
    }
}

/**
 * 명령 처리 완료 표시
 */
export async function markCommandProcessed(commandId: string): Promise<void> {
    await supabase
        .from('remote_commands')
        .update({ processed: true })
        .eq('id', commandId);
}

/**
 * 상태 업데이트 (텔레그램 봇이 읽을 수 있도록)
 */
export async function updateBotStatus(userId: string, status: {
    isPaused: boolean;
    queueLength: number;
    completedCount: number;
    failedCount: number;
    currentItem?: string;
}): Promise<void> {
    try {
        await supabase
            .from('bot_status')
            .upsert({
                user_id: userId,
                ...status,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'user_id'
            });
    } catch (e) {
        console.error('상태 업데이트 실패:', e);
    }
}

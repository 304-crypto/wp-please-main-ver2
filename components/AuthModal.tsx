import React, { useState } from 'react';
import { loginWithPassword } from '../services/supabaseService';

// ═══════════════════════════════════════════════════════════
// 🔐 간단 비밀번호 인증 모달
// ═══════════════════════════════════════════════════════════

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLoginSuccess: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isFirstTime, setIsFirstTime] = useState(true);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password.length < 6) {
            setError('비밀번호는 최소 6자 이상이어야 합니다.');
            return;
        }

        setIsLoading(true);
        setError('');

        const result = await loginWithPassword(password);

        if (result.success) {
            onLoginSuccess();
            onClose();
            setPassword('');
        } else {
            setError(result.error || '로그인 실패');
            setIsFirstTime(false);
        }

        setIsLoading(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl flex items-center justify-center z-[700] p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                {/* 헤더 */}
                <div className="p-8 text-center bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                    <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                        <i className="fa-solid fa-lock text-4xl"></i>
                    </div>
                    <h2 className="text-2xl font-black">로그인</h2>
                    <p className="text-white/80 text-sm mt-2">
                        {isFirstTime ? '비밀번호를 설정하면 자동 회원가입됩니다' : '비밀번호를 입력하세요'}
                    </p>
                </div>

                {/* 폼 */}
                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">
                            비밀번호
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="6자 이상 입력"
                            autoFocus
                            className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none font-bold text-lg focus:border-indigo-100 focus:bg-white transition-all text-center tracking-widest"
                        />
                    </div>

                    {error && (
                        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-center">
                            <p className="text-sm font-bold text-rose-600">{error}</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading || password.length < 6}
                        className="w-full py-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-black text-lg shadow-lg shadow-indigo-200 hover:from-indigo-700 hover:to-purple-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <span className="flex items-center justify-center gap-3">
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                확인 중...
                            </span>
                        ) : (
                            <span className="flex items-center justify-center gap-2">
                                <i className="fa-solid fa-right-to-bracket"></i>
                                {isFirstTime ? '시작하기' : '로그인'}
                            </span>
                        )}
                    </button>

                    <p className="text-xs text-slate-400 text-center">
                        💡 모든 기기에서 같은 비밀번호로 로그인하면<br />설정이 자동으로 동기화됩니다
                    </p>
                </form>

                {/* 닫기 버튼 */}
                <div className="px-8 pb-8">
                    <button
                        onClick={onClose}
                        className="w-full py-4 bg-slate-100 text-slate-500 rounded-2xl font-bold text-sm hover:bg-slate-200 transition-all"
                    >
                        나중에 (로컬 저장 모드)
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AuthModal;

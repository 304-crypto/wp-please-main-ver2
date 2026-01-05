/**
 * Rate Limiter for API calls
 * Prevents excessive API usage that could lead to account suspension
 */

export class RateLimiter {
    private callTimestamps: number[] = [];
    private readonly maxCallsPerMinute: number;
    private readonly maxCallsPerHour: number;

    constructor(maxCallsPerMinute = 10, maxCallsPerHour = 100) {
        this.maxCallsPerMinute = maxCallsPerMinute;
        this.maxCallsPerHour = maxCallsPerHour;
    }

    /**
     * Check if a new API call is allowed
     * @returns true if allowed, false if rate limit exceeded
     */
    canMakeCall(): boolean {
        const now = Date.now();
        const oneMinuteAgo = now - 60 * 1000;
        const oneHourAgo = now - 60 * 60 * 1000;

        // Remove old timestamps
        this.callTimestamps = this.callTimestamps.filter(
            timestamp => timestamp > oneHourAgo
        );

        // Check minute limit
        const callsInLastMinute = this.callTimestamps.filter(
            timestamp => timestamp > oneMinuteAgo
        ).length;

        if (callsInLastMinute >= this.maxCallsPerMinute) {
            console.warn(`⚠️ Rate limit: ${callsInLastMinute} calls in last minute (max: ${this.maxCallsPerMinute})`);
            return false;
        }

        // Check hour limit
        if (this.callTimestamps.length >= this.maxCallsPerHour) {
            console.warn(`⚠️ Rate limit: ${this.callTimestamps.length} calls in last hour (max: ${this.maxCallsPerHour})`);
            return false;
        }

        return true;
    }

    /**
     * Record a new API call
     */
    recordCall(): void {
        this.callTimestamps.push(Date.now());
    }

    /**
     * Get time until next call is allowed (in milliseconds)
     * @returns milliseconds to wait, or 0 if call is allowed
     */
    getWaitTime(): number {
        if (this.canMakeCall()) {
            return 0;
        }

        const now = Date.now();
        const oneMinuteAgo = now - 60 * 1000;

        const recentCalls = this.callTimestamps.filter(
            timestamp => timestamp > oneMinuteAgo
        );

        if (recentCalls.length >= this.maxCallsPerMinute) {
            const oldestCallInMinute = Math.min(...recentCalls);
            return oldestCallInMinute + 60 * 1000 - now;
        }

        return 60 * 1000; // Wait 1 minute by default
    }

    /**
     * Reset all limits (for testing)
     */
    reset(): void {
        this.callTimestamps = [];
    }
}

// Global rate limiter instance
export const apiRateLimiter = new RateLimiter(10, 100);

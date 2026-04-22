//! Reusable async retry utility with exponential backoff.
//!
//! Designed for wrapping transient I/O operations (object storage, HTTP calls, etc.)
//! that may fail with temporary errors like "dispatch failure", timeouts, or connection resets.
//!
//! The retry functions are generic over error types — they only require `Display`
//! so that the error message can be inspected for transient patterns. This avoids
//! coupling to any specific error framework (e.g. `AppError`).
//!
//! # Example
//!
//! ```rust,ignore
//! use common::core::retry::{RetryPolicy, retry_async};
//!
//! let policy = RetryPolicy::default(); // 3 retries, 200ms base, 5s max
//!
//! let bytes = retry_async(&policy, "download_object", || async {
//!     storage.download_object(&path).await
//! }).await?;
//! ```

use neocrates::tracing;
use std::fmt::Display;
use std::future::Future;
use std::time::Duration;

/// Configuration for retry behavior with exponential backoff.
#[derive(Debug, Clone)]
pub struct RetryPolicy {
    /// Maximum number of retry attempts (0 means no retries, just the initial attempt).
    pub max_retries: u32,
    /// Base delay in milliseconds for the first retry.
    pub base_delay_ms: u64,
    /// Maximum delay cap in milliseconds.
    pub max_delay_ms: u64,
    /// Optional jitter factor (0.0 = no jitter, 1.0 = full jitter). Defaults to 0.
    /// When > 0, actual delay = delay * (1 - jitter * pseudo_random), reducing thundering-herd effects.
    pub jitter: f64,
}

impl Default for RetryPolicy {
    fn default() -> Self {
        Self {
            max_retries: 3,
            base_delay_ms: 200,
            max_delay_ms: 5_000,
            jitter: 0.0,
        }
    }
}

impl RetryPolicy {
    /// Create a policy for storage I/O operations (download/upload).
    ///
    /// Uses moderate retry count with short initial backoff, suitable for
    /// transient "dispatch failure" and connection reset errors.
    pub fn storage_io() -> Self {
        Self {
            max_retries: 3,
            base_delay_ms: 300,
            max_delay_ms: 5_000,
            jitter: 0.0,
        }
    }

    /// Create a policy with no retries — useful for testing or non-idempotent operations.
    pub fn no_retry() -> Self {
        Self {
            max_retries: 0,
            base_delay_ms: 0,
            max_delay_ms: 0,
            jitter: 0.0,
        }
    }

    /// Compute the backoff delay for a given attempt number (1-based).
    fn backoff_delay(&self, attempt: u32) -> Duration {
        let base = self.base_delay_ms.max(1);
        let max_delay = self.max_delay_ms.max(base);
        // Exponential: base * 2^(attempt-1), capped at max_delay
        let exponent = (attempt.saturating_sub(1)).min(16);
        let delay_ms = base
            .saturating_mul(2u64.saturating_pow(exponent))
            .min(max_delay);

        if self.jitter > 0.0 {
            // Simple deterministic pseudo-jitter based on attempt number.
            // For true randomness, use rand crate — but we keep deps minimal.
            let jitter_factor = 1.0 - (self.jitter * pseudo_jitter_fraction(attempt));
            let jittered = (delay_ms as f64 * jitter_factor).max(1.0) as u64;
            Duration::from_millis(jittered)
        } else {
            Duration::from_millis(delay_ms)
        }
    }
}

/// Simple deterministic pseudo-jitter: returns a value in [0.0, 1.0) based on attempt.
/// Not cryptographically random, but sufficient to spread retry waves.
fn pseudo_jitter_fraction(attempt: u32) -> f64 {
    // Use a simple hash-like transformation (Knuth multiplicative hash)
    let x = attempt.wrapping_mul(2654435761);
    (x % 1000) as f64 / 1000.0
}

/// Check if an error message string indicates a transient failure.
///
/// This inspects the lowercased error text for patterns known to be
/// transient in HTTP/network clients (reqwest, hyper, h2, DNS, etc.).
pub fn is_transient_message(msg: &str) -> bool {
    let msg = msg.to_lowercase();
    msg.contains("dispatch failure")
        || msg.contains("error sending request for url")
        || msg.contains("dispatch dropped")
        || msg.contains("connection reset")
        || msg.contains("connection refused")
        || msg.contains("connection closed")
        || msg.contains("broken pipe")
        || msg.contains("timed out")
        || msg.contains("timeout")
        || msg.contains("temporarily unavailable")
        || msg.contains("try again")
        || msg.contains("eof")
        || msg.contains("incomplete message")
        || msg.contains("connection aborted")
        || msg.contains("dns error")
        || msg.contains("name resolution")
        || msg.contains("pool is closed")
        || msg.contains("hyper::error")
        || msg.contains("h2 error")
        || msg.contains("goaway")
        || msg.contains("stream closed")
}

/// Classify whether an error is likely transient and worth retrying,
/// based on its `Display` representation.
pub fn is_transient_error<E: Display>(err: &E) -> bool {
    let msg = err.to_string();
    is_transient_message(&msg)
}

/// Execute an async operation with automatic retries and exponential backoff.
///
/// The operation is retried only when the error is classified as transient by
/// [`is_transient_error`]. Non-transient errors are returned immediately.
///
/// # Type Parameters
/// * `T` — Success value type.
/// * `E` — Error type (must implement `Display` for transient-classification).
/// * `F` — Closure that produces the future.
/// * `Fut` — The future type returned by the closure.
///
/// # Arguments
/// * `policy` — Retry configuration (max attempts, delays).
/// * `label` — Human-readable label for log messages (e.g. `"download_object"`).
/// * `operation` — A closure that produces a `Future<Output = Result<T, E>>`.
///   Must be callable multiple times (i.e. each call creates a fresh attempt).
///
/// # Returns
/// The successful result `T`, or the last error if all attempts are exhausted.
pub async fn retry_async<T, E, F, Fut>(
    policy: &RetryPolicy,
    label: &str,
    operation: F,
) -> Result<T, E>
where
    E: Display,
    F: Fn() -> Fut,
    Fut: Future<Output = Result<T, E>>,
{
    let mut attempt: u32 = 0;

    loop {
        match operation().await {
            Ok(value) => {
                if attempt > 0 {
                    tracing::info!(
                        "retry succeeded: label={} after {} attempt(s)",
                        label,
                        attempt + 1,
                    );
                }
                return Ok(value);
            }
            Err(err) => {
                if attempt < policy.max_retries && is_transient_error(&err) {
                    attempt += 1;
                    let delay = policy.backoff_delay(attempt);
                    tracing::warn!(
                        "retry transient error: label={} attempt={}/{} delay_ms={} err={}",
                        label,
                        attempt,
                        policy.max_retries,
                        delay.as_millis(),
                        err,
                    );
                    neocrates::tokio::time::sleep(delay).await;
                    continue;
                }

                // Non-transient or retries exhausted
                if attempt > 0 {
                    tracing::error!(
                        "retry exhausted: label={} attempts={} err={}",
                        label,
                        attempt + 1,
                        err,
                    );
                }
                return Err(err);
            }
        }
    }
}

/// Execute an async operation with retries, using a custom predicate to decide retryability.
///
/// This variant allows callers to supply their own `should_retry` function instead
/// of relying on the built-in [`is_transient_error`] heuristic.
///
/// # Arguments
/// * `policy` — Retry configuration.
/// * `label` — Human-readable label for log messages.
/// * `should_retry` — Predicate returning `true` if the given error warrants a retry.
/// * `operation` — Async closure producing the fallible result.
pub async fn retry_async_with<T, E, F, Fut, P>(
    policy: &RetryPolicy,
    label: &str,
    should_retry: P,
    operation: F,
) -> Result<T, E>
where
    E: Display,
    F: Fn() -> Fut,
    Fut: Future<Output = Result<T, E>>,
    P: Fn(&E) -> bool,
{
    let mut attempt: u32 = 0;

    loop {
        match operation().await {
            Ok(value) => {
                if attempt > 0 {
                    tracing::info!(
                        "retry succeeded: label={} after {} attempt(s)",
                        label,
                        attempt + 1,
                    );
                }
                return Ok(value);
            }
            Err(err) => {
                if attempt < policy.max_retries && should_retry(&err) {
                    attempt += 1;
                    let delay = policy.backoff_delay(attempt);
                    tracing::warn!(
                        "retry transient error: label={} attempt={}/{} delay_ms={} err={}",
                        label,
                        attempt,
                        policy.max_retries,
                        delay.as_millis(),
                        err,
                    );
                    neocrates::tokio::time::sleep(delay).await;
                    continue;
                }

                if attempt > 0 {
                    tracing::error!(
                        "retry exhausted: label={} attempts={} err={}",
                        label,
                        attempt + 1,
                        err,
                    );
                }
                return Err(err);
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fmt;
    use std::sync::atomic::{AtomicU32, Ordering};

    /// Minimal test error type that implements Display — avoids dependency on AppError.
    #[derive(Debug, Clone)]
    struct TestError(String);

    impl fmt::Display for TestError {
        fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
            write!(f, "{}", self.0)
        }
    }

    // ── RetryPolicy unit tests ──────────────────────────────────────────

    #[test]
    fn test_backoff_delay_exponential() {
        let policy = RetryPolicy {
            max_retries: 5,
            base_delay_ms: 100,
            max_delay_ms: 10_000,
            jitter: 0.0,
        };

        // attempt 1 → 100 * 2^0 = 100ms
        assert_eq!(policy.backoff_delay(1), Duration::from_millis(100));
        // attempt 2 → 100 * 2^1 = 200ms
        assert_eq!(policy.backoff_delay(2), Duration::from_millis(200));
        // attempt 3 → 100 * 2^2 = 400ms
        assert_eq!(policy.backoff_delay(3), Duration::from_millis(400));
        // attempt 4 → 100 * 2^3 = 800ms
        assert_eq!(policy.backoff_delay(4), Duration::from_millis(800));
        // attempt 5 → 100 * 2^4 = 1600ms
        assert_eq!(policy.backoff_delay(5), Duration::from_millis(1600));
    }

    #[test]
    fn test_backoff_delay_capped_at_max() {
        let policy = RetryPolicy {
            max_retries: 10,
            base_delay_ms: 500,
            max_delay_ms: 2_000,
            jitter: 0.0,
        };

        // attempt 1 → 500ms
        assert_eq!(policy.backoff_delay(1), Duration::from_millis(500));
        // attempt 2 → 1000ms
        assert_eq!(policy.backoff_delay(2), Duration::from_millis(1000));
        // attempt 3 → 2000ms (cap)
        assert_eq!(policy.backoff_delay(3), Duration::from_millis(2000));
        // attempt 4 → still capped at 2000ms
        assert_eq!(policy.backoff_delay(4), Duration::from_millis(2000));
    }

    #[test]
    fn test_backoff_delay_with_jitter_is_less_or_equal() {
        let policy = RetryPolicy {
            max_retries: 3,
            base_delay_ms: 1000,
            max_delay_ms: 10_000,
            jitter: 0.5,
        };

        for attempt in 1..=5 {
            let no_jitter = RetryPolicy {
                jitter: 0.0,
                ..policy.clone()
            }
            .backoff_delay(attempt);
            let with_jitter = policy.backoff_delay(attempt);
            assert!(
                with_jitter <= no_jitter,
                "jittered delay {} should be <= base delay {} for attempt {}",
                with_jitter.as_millis(),
                no_jitter.as_millis(),
                attempt,
            );
        }
    }

    #[test]
    fn test_default_policy() {
        let policy = RetryPolicy::default();
        assert_eq!(policy.max_retries, 3);
        assert_eq!(policy.base_delay_ms, 200);
        assert_eq!(policy.max_delay_ms, 5_000);
    }

    #[test]
    fn test_storage_io_policy() {
        let policy = RetryPolicy::storage_io();
        assert_eq!(policy.max_retries, 3);
        assert_eq!(policy.base_delay_ms, 300);
    }

    #[test]
    fn test_no_retry_policy() {
        let policy = RetryPolicy::no_retry();
        assert_eq!(policy.max_retries, 0);
    }

    // ── is_transient_message tests ──────────────────────────────────────

    #[test]
    fn test_is_transient_message_dispatch_failure() {
        assert!(is_transient_message("dispatch failure"));
        assert!(is_transient_message("Error: dispatch failure occurred"));
        assert!(is_transient_message("DISPATCH FAILURE"));
    }

    #[test]
    fn test_is_transient_message_connection_errors() {
        assert!(is_transient_message("connection reset by peer"));
        assert!(is_transient_message("connection refused"));
        assert!(is_transient_message("Connection closed before data"));
        assert!(is_transient_message("broken pipe"));
    }

    #[test]
    fn test_is_transient_message_timeout() {
        assert!(is_transient_message("request timed out"));
        assert!(is_transient_message("operation timeout"));
    }

    #[test]
    fn test_is_transient_message_http2() {
        assert!(is_transient_message("h2 error: stream closed"));
        assert!(is_transient_message("received goaway"));
    }

    #[test]
    fn test_is_not_transient_message() {
        assert!(!is_transient_message("not found"));
        assert!(!is_transient_message("permission denied"));
        assert!(!is_transient_message("validation error: name too long"));
        assert!(!is_transient_message("题库不存在"));
    }

    // ── is_transient_error (generic) tests ──────────────────────────────

    #[test]
    fn test_is_transient_error_with_test_error() {
        let transient = TestError("dispatch failure".into());
        assert!(is_transient_error(&transient));

        let permanent = TestError("not found".into());
        assert!(!is_transient_error(&permanent));
    }

    #[test]
    fn test_is_transient_error_with_string() {
        // String implements Display
        let transient = String::from("connection reset by peer");
        assert!(is_transient_error(&transient));

        let permanent = String::from("bad request");
        assert!(!is_transient_error(&permanent));
    }

    // ── retry_async tests ───────────────────────────────────────────────

    #[tokio::test]
    async fn test_retry_async_succeeds_first_try() {
        let call_count = AtomicU32::new(0);
        let policy = RetryPolicy::no_retry();

        let result: Result<i32, TestError> = retry_async(&policy, "test_ok", || {
            call_count.fetch_add(1, Ordering::SeqCst);
            async { Ok(42) }
        })
        .await;

        assert_eq!(result.unwrap(), 42);
        assert_eq!(call_count.load(Ordering::SeqCst), 1);
    }

    #[tokio::test]
    async fn test_retry_async_non_transient_fails_immediately() {
        let call_count = AtomicU32::new(0);
        let policy = RetryPolicy {
            max_retries: 3,
            base_delay_ms: 1,
            max_delay_ms: 10,
            jitter: 0.0,
        };

        let result: Result<i32, TestError> = retry_async(&policy, "test_non_transient", || {
            call_count.fetch_add(1, Ordering::SeqCst);
            async { Err(TestError("题库不存在".into())) }
        })
        .await;

        assert!(result.is_err());
        // Should NOT retry non-transient errors
        assert_eq!(call_count.load(Ordering::SeqCst), 1);
    }

    #[tokio::test]
    async fn test_retry_async_transient_retries_then_succeeds() {
        let call_count = AtomicU32::new(0);
        let policy = RetryPolicy {
            max_retries: 3,
            base_delay_ms: 1,
            max_delay_ms: 10,
            jitter: 0.0,
        };

        let result: Result<i32, TestError> = retry_async(&policy, "test_transient_ok", || {
            let count = call_count.fetch_add(1, Ordering::SeqCst);
            async move {
                if count < 2 {
                    Err(TestError("dispatch failure".into()))
                } else {
                    Ok(99)
                }
            }
        })
        .await;

        assert_eq!(result.unwrap(), 99);
        assert_eq!(call_count.load(Ordering::SeqCst), 3); // 2 failures + 1 success
    }

    #[tokio::test]
    async fn test_retry_async_transient_exhausted() {
        let call_count = AtomicU32::new(0);
        let policy = RetryPolicy {
            max_retries: 2,
            base_delay_ms: 1,
            max_delay_ms: 5,
            jitter: 0.0,
        };

        let result: Result<i32, TestError> = retry_async(&policy, "test_exhausted", || {
            call_count.fetch_add(1, Ordering::SeqCst);
            async { Err(TestError("connection reset by peer".into())) }
        })
        .await;

        assert!(result.is_err());
        // 1 initial + 2 retries = 3 total attempts
        assert_eq!(call_count.load(Ordering::SeqCst), 3);
    }

    // ── retry_async_with (custom predicate) tests ───────────────────────

    #[tokio::test]
    async fn test_retry_async_with_custom_predicate() {
        let call_count = AtomicU32::new(0);
        let policy = RetryPolicy {
            max_retries: 5,
            base_delay_ms: 1,
            max_delay_ms: 5,
            jitter: 0.0,
        };

        // Custom predicate: only retry errors containing "temporary"
        let result: Result<&str, TestError> = retry_async_with(
            &policy,
            "test_custom",
            |err: &TestError| err.0.contains("temporary"),
            || {
                let count = call_count.fetch_add(1, Ordering::SeqCst);
                async move {
                    if count < 1 {
                        Err(TestError("temporary glitch".into()))
                    } else {
                        Ok("recovered")
                    }
                }
            },
        )
        .await;

        assert_eq!(result.unwrap(), "recovered");
        assert_eq!(call_count.load(Ordering::SeqCst), 2);
    }

    #[tokio::test]
    async fn test_retry_async_with_custom_predicate_no_match() {
        let call_count = AtomicU32::new(0);
        let policy = RetryPolicy {
            max_retries: 5,
            base_delay_ms: 1,
            max_delay_ms: 5,
            jitter: 0.0,
        };

        let result: Result<i32, TestError> = retry_async_with(
            &policy,
            "test_custom_no_match",
            |err: &TestError| err.0.contains("temporary"),
            || {
                call_count.fetch_add(1, Ordering::SeqCst);
                async { Err(TestError("permanent failure".into())) }
            },
        )
        .await;

        assert!(result.is_err());
        // Should not retry — predicate didn't match
        assert_eq!(call_count.load(Ordering::SeqCst), 1);
    }

    #[tokio::test]
    async fn test_retry_async_zero_max_retries_no_retry() {
        let call_count = AtomicU32::new(0);
        let policy = RetryPolicy::no_retry();

        let result: Result<i32, TestError> = retry_async(&policy, "test_no_retry", || {
            call_count.fetch_add(1, Ordering::SeqCst);
            async { Err(TestError("dispatch failure".into())) }
        })
        .await;

        assert!(result.is_err());
        // Even though the error is transient, max_retries=0 means no retries
        assert_eq!(call_count.load(Ordering::SeqCst), 1);
    }
}

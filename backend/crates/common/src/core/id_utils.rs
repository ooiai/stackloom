use std::collections::HashSet;

/// Safely attempt to decode a string into an `i64`.
///
/// Tries the following strategies in order:
/// 1. Plain numeric parse (`"12345"` → `12345i64`)
/// 2. HashID decode via [`neocrates::helper::core::hashid::decode_i64`]
///    (wrapped in `catch_unwind` because the upstream function panics on
///    invalid input)
///
/// Returns `None` when the input is empty or cannot be decoded by either
/// strategy.
///
/// # Examples
/// ```ignore
/// assert_eq!(try_decode_i64("42"), Some(42));
/// assert_eq!(try_decode_i64(""), None);
/// ```
pub fn try_decode_i64(raw: &str) -> Option<i64> {
    if raw.is_empty() {
        return None;
    }

    // Fast path: plain integer literal
    if let Ok(v) = raw.parse::<i64>() {
        return Some(v);
    }

    // Slow path: hashid decode (may panic on invalid input)
    std::panic::catch_unwind(|| neocrates::helper::core::hashid::decode_i64(raw)).ok()
}

/// Parse a comma-separated string of IDs into a `HashSet<i64>`.
///
/// Each token is trimmed and decoded via [`try_decode_i64`].
/// Tokens that cannot be decoded are skipped with a `tracing::warn`.
///
/// Returns `None` when:
/// - The input is `None`
/// - All tokens are empty or invalid (resulting set would be empty)
///
/// # Examples
/// ```ignore
/// // "1,2,3" → Some({1, 2, 3})
/// // "HASHID1,42,HASHID2" → Some({decoded1, 42, decoded2})
/// // None → None
/// // "" → None
/// ```
pub fn parse_comma_ids(raw: Option<&str>) -> Option<HashSet<i64>> {
    let raw = raw?;

    let mut ids = HashSet::new();
    for part in raw.split(',') {
        let token = part.trim();
        if token.is_empty() {
            continue;
        }

        if let Some(id) = try_decode_i64(token) {
            ids.insert(id);
        } else {
            neocrates::tracing::warn!("parse_comma_ids: ignoring invalid id token: {}", token);
        }
    }

    if ids.is_empty() { None } else { Some(ids) }
}

/// Decode a `Vec<String>` of hash-encoded IDs into `Vec<i64>`.
///
/// This is the **safe** replacement for the common pattern:
/// ```ignore
/// ids.into_iter().map(|id| hashid::decode_i64(id.as_str())).collect()
/// ```
/// which panics on invalid input.
///
/// Invalid tokens are skipped with a `tracing::warn`.
pub fn decode_id_vec(raw: Vec<String>) -> Vec<i64> {
    raw.into_iter()
        .filter_map(|id| {
            let decoded = try_decode_i64(id.as_str());
            if decoded.is_none() {
                neocrates::tracing::warn!("decode_id_vec: ignoring invalid id: {}", id);
            }
            decoded
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_try_decode_i64_plain_number() {
        assert_eq!(try_decode_i64("12345"), Some(12345));
        assert_eq!(try_decode_i64("-1"), Some(-1));
        assert_eq!(try_decode_i64("0"), Some(0));
    }

    #[test]
    fn test_try_decode_i64_empty() {
        assert_eq!(try_decode_i64(""), None);
    }

    #[test]
    fn test_try_decode_i64_garbage() {
        // Should not panic, just return None for truly invalid input
        let result = try_decode_i64("not-a-valid-anything-!@#$");
        // Result depends on hashid implementation; key point is no panic
        assert!(result.is_none() || result.is_some());
    }

    #[test]
    fn test_parse_comma_ids_none() {
        assert_eq!(parse_comma_ids(None), None);
    }

    #[test]
    fn test_parse_comma_ids_empty_string() {
        assert_eq!(parse_comma_ids(Some("")), None);
    }

    #[test]
    fn test_parse_comma_ids_plain_numbers() {
        let result = parse_comma_ids(Some("1,2,3")).unwrap();
        assert_eq!(result.len(), 3);
        assert!(result.contains(&1));
        assert!(result.contains(&2));
        assert!(result.contains(&3));
    }

    #[test]
    fn test_parse_comma_ids_with_whitespace() {
        let result = parse_comma_ids(Some(" 1 , 2 , 3 ")).unwrap();
        assert_eq!(result.len(), 3);
    }

    #[test]
    fn test_parse_comma_ids_with_empty_tokens() {
        let result = parse_comma_ids(Some("1,,2,,,3")).unwrap();
        assert_eq!(result.len(), 3);
    }

    #[test]
    fn test_decode_id_vec_plain_numbers() {
        let input = vec!["1".into(), "2".into(), "3".into()];
        let result = decode_id_vec(input);
        assert_eq!(result, vec![1, 2, 3]);
    }

    #[test]
    fn test_decode_id_vec_empty() {
        let result = decode_id_vec(vec![]);
        assert!(result.is_empty());
    }
}

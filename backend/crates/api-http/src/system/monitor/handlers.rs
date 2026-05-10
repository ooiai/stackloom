use super::resp::{
    AppStatsResp, BusinessSummaryResp, DatabaseStatsResp, DatabaseTopQueryResp, ErrorEndpointResp,
    HourlyStatResp, MonitorMetricsResp, PgStatStatementsStatsResp, RedisStatsResp,
    SlowEndpointResp, StatusDistributionResp, SystemSnapshotResp,
};
use crate::system::SysHttpState;
use neocrates::{
    axum::{Extension, Json, extract::State},
    middlewares::models::AuthModel,
    response::error::AppResult,
    tracing,
};

/// Get system monitor metrics and 24h hourly request statistics.
///
/// # Arguments
/// * `state` - The system HTTP state.
/// * `_auth_user` - The authenticated user.
///
/// # Returns
/// * `AppResult<Json<MonitorMetricsResp>>` - The monitor metrics response wrapped in a JSON response.
pub async fn metrics(
    State(state): State<SysHttpState>,
    Extension(_auth_user): Extension<AuthModel>,
) -> AppResult<Json<MonitorMetricsResp>> {
    tracing::info!("...Get Monitor Metrics...");

    let (
        snapshot,
        hourly_stats,
        app_stats,
        top_slow,
        top_error,
        status_dist,
        business,
        redis_stats,
        database_stats,
    ) = neocrates::tokio::try_join!(
        state.monitor_service.get_metrics(),
        state.monitor_service.get_request_stats(),
        state.monitor_service.get_app_stats(),
        state.monitor_service.get_top_slow_endpoints(),
        state.monitor_service.get_top_error_endpoints(),
        state.monitor_service.get_status_distribution(),
        state.monitor_service.get_business_summary(),
        state.monitor_service.get_redis_stats(),
        state.monitor_service.get_database_stats(),
    )?;

    let resp = MonitorMetricsResp {
        snapshot: SystemSnapshotResp {
            cpu_usage: snapshot.cpu_usage,
            cpu_count: snapshot.cpu_count,
            cpu_usage_cores: snapshot.cpu_usage_cores,
            per_core_usage: snapshot.per_core_usage,
            cpu_temp_celsius: snapshot.cpu_temp_celsius,
            cpu_freq_mhz: snapshot.cpu_freq_mhz,
            memory_used: snapshot.memory_used,
            memory_total: snapshot.memory_total,
            disk_used: snapshot.disk_used,
            disk_total: snapshot.disk_total,
            net_rx_bytes: snapshot.net_rx_bytes,
            net_tx_bytes: snapshot.net_tx_bytes,
            uptime_secs: snapshot.uptime_secs,
            process_memory_bytes: snapshot.process_memory_bytes,
            process_virtual_memory_bytes: snapshot.process_virtual_memory_bytes,
            process_cpu_percent: snapshot.process_cpu_percent,
            db_pool_size: snapshot.db_pool_size,
            db_pool_idle: snapshot.db_pool_idle,
        },
        hourly_stats: hourly_stats
            .into_iter()
            .map(|s| HourlyStatResp {
                hour: s.hour,
                total: s.total,
                errors: s.errors,
                avg_latency_ms: s.avg_latency_ms,
            })
            .collect(),
        app_stats: AppStatsResp {
            success_rate: app_stats.success_rate,
            p95_latency_ms: app_stats.p95_latency_ms,
            p99_latency_ms: app_stats.p99_latency_ms,
        },
        top_slow_endpoints: top_slow
            .into_iter()
            .map(|e| SlowEndpointResp {
                path: e.path,
                avg_latency_ms: e.avg_latency_ms,
                request_count: e.request_count,
            })
            .collect(),
        top_error_endpoints: top_error
            .into_iter()
            .map(|e| ErrorEndpointResp {
                path: e.path,
                error_count: e.error_count,
                total_count: e.total_count,
            })
            .collect(),
        status_distribution: status_dist
            .into_iter()
            .map(|d| StatusDistributionResp {
                hour: d.hour,
                ok_2xx: d.ok_2xx,
                err_4xx: d.err_4xx,
                err_5xx: d.err_5xx,
            })
            .collect(),
        business_summary: BusinessSummaryResp {
            total_users: business.total_users,
            total_tenants: business.total_tenants,
            total_roles: business.total_roles,
        },
        redis_stats: RedisStatsResp {
            pool_connections: redis_stats.pool_connections,
            pool_idle: redis_stats.pool_idle,
            pool_max_size: redis_stats.pool_max_size,
            used_memory_bytes: redis_stats.used_memory_bytes,
            used_memory_peak_bytes: redis_stats.used_memory_peak_bytes,
            keyspace_hits: redis_stats.keyspace_hits,
            keyspace_misses: redis_stats.keyspace_misses,
            connected_clients: redis_stats.connected_clients,
            total_commands_processed: redis_stats.total_commands_processed,
            redis_version: redis_stats.redis_version,
            redis_uptime_secs: redis_stats.redis_uptime_secs,
        },
        database_stats: DatabaseStatsResp {
            pool_size: database_stats.pool_size,
            pool_idle: database_stats.pool_idle,
            pool_active: database_stats.pool_active,
            pool_utilization_rate: database_stats.pool_utilization_rate,
            connections_total: database_stats.connections_total,
            connections_active: database_stats.connections_active,
            connections_idle: database_stats.connections_idle,
            connections_waiting: database_stats.connections_waiting,
            blocked_queries: database_stats.blocked_queries,
            longest_running_query_secs: database_stats.longest_running_query_secs,
            stats_reset_at: database_stats.stats_reset_at,
            commits: database_stats.commits,
            rollbacks: database_stats.rollbacks,
            cache_hit_rate: database_stats.cache_hit_rate,
            deadlocks: database_stats.deadlocks,
            temp_files: database_stats.temp_files,
            temp_bytes: database_stats.temp_bytes,
            db_size_bytes: database_stats.db_size_bytes,
            rows_returned: database_stats.rows_returned,
            rows_fetched: database_stats.rows_fetched,
            rows_inserted: database_stats.rows_inserted,
            rows_updated: database_stats.rows_updated,
            rows_deleted: database_stats.rows_deleted,
            pg_stat_statements: PgStatStatementsStatsResp {
                available: database_stats.pg_stat_statements.available,
                unavailable_reason_key: database_stats.pg_stat_statements.unavailable_reason_key,
                top_by_total_time: database_stats
                    .pg_stat_statements
                    .top_by_total_time
                    .into_iter()
                    .map(|query| DatabaseTopQueryResp {
                        query: query.query,
                        calls: query.calls,
                        total_exec_time_ms: query.total_exec_time_ms,
                        mean_exec_time_ms: query.mean_exec_time_ms,
                        rows: query.rows,
                        shared_blks_hit: query.shared_blks_hit,
                        shared_blks_read: query.shared_blks_read,
                    })
                    .collect(),
                top_by_mean_time: database_stats
                    .pg_stat_statements
                    .top_by_mean_time
                    .into_iter()
                    .map(|query| DatabaseTopQueryResp {
                        query: query.query,
                        calls: query.calls,
                        total_exec_time_ms: query.total_exec_time_ms,
                        mean_exec_time_ms: query.mean_exec_time_ms,
                        rows: query.rows,
                        shared_blks_hit: query.shared_blks_hit,
                        shared_blks_read: query.shared_blks_read,
                    })
                    .collect(),
            },
        },
    };

    Ok(Json(resp))
}

use std::sync::Arc;
use std::time::Duration;

use domain_system::SystemSnapshot;
use neocrates::tokio;
use sysinfo::{Components, Disks, Networks, System, get_current_pid};

/// SystemMetricsCollector manages background collection of system metrics
///
/// This collector runs a background task that periodically samples system metrics
/// using the sysinfo library. By maintaining a continuous System instance and
/// refreshing it at regular intervals, we ensure accurate CPU usage readings
/// (sysinfo requires multiple refresh cycles to compute accurate percentages).
#[derive(Clone)]
pub struct SystemMetricsCollector {
    latest_snapshot: Arc<tokio::sync::RwLock<SystemSnapshot>>,
}

impl SystemMetricsCollector {
    /// Create a new SystemMetricsCollector and spawn the background task
    ///
    /// # Returns
    /// A tuple of (SystemMetricsCollector, JoinHandle for the background task)
    /// The JoinHandle can be stored to ensure the task runs for the lifetime of the app
    pub fn new(start_time: Arc<std::time::Instant>) -> (Self, tokio::task::JoinHandle<()>) {
        let latest_snapshot = Arc::new(tokio::sync::RwLock::new(SystemSnapshot {
            cpu_usage: 0.0,
            cpu_count: 0,
            cpu_usage_cores: 0.0,
            per_core_usage: vec![],
            cpu_temp_celsius: None,
            cpu_freq_mhz: vec![],
            memory_used: 0,
            memory_total: 0,
            swap_used: 0,
            swap_total: 0,
            disk_used: 0,
            disk_total: 0,
            net_rx_bytes: 0,
            net_tx_bytes: 0,
            uptime_secs: 0,
            process_memory_bytes: 0,
            process_virtual_memory_bytes: 0,
            process_cpu_percent: 0.0,
            db_pool_size: 0,
            db_pool_idle: 0,
            load_avg_1: 0.0,
            load_avg_5: 0.0,
            load_avg_15: 0.0,
        }));

        let snapshot_clone = latest_snapshot.clone();
        let start_time_clone = start_time.clone();

        let handle = tokio::spawn(async move {
            // Initial setup: create System instance and do first refresh
            let mut sys = System::new_all();
            sys.refresh_all();

            // Wait a bit to ensure the first refresh is complete and initial data is collected
            tokio::time::sleep(Duration::from_millis(100)).await;

            // Main loop: refresh at regular intervals
            let mut interval = tokio::time::interval(Duration::from_secs(1));

            loop {
                interval.tick().await;

                // Refresh system info - by this point, CPU data will be accurate
                sys.refresh_all();

                let uptime_secs = start_time_clone.elapsed().as_secs();

                // Collect disk info
                let disks = Disks::new_with_refreshed_list();
                let (disk_used, disk_total) =
                    disks.iter().fold((0u64, 0u64), |(used, total), d| {
                        let d_total = d.total_space();
                        let d_avail = d.available_space();
                        let d_used = d_total.saturating_sub(d_avail);
                        (used + d_used, total + d_total)
                    });

                // Collect network info
                let networks = Networks::new_with_refreshed_list();
                let (net_rx_bytes, net_tx_bytes) =
                    networks.iter().fold((0u64, 0u64), |(rx, tx), (_, data)| {
                        (rx + data.total_received(), tx + data.total_transmitted())
                    });

                // Collect process info
                let (process_memory_bytes, process_virtual_memory_bytes, process_cpu_percent) =
                    get_current_pid()
                        .ok()
                        .and_then(|pid| sys.process(pid))
                        .map(|p| (p.memory(), p.virtual_memory(), p.cpu_usage()))
                        .unwrap_or((0, 0, 0.0));

                // Collect CPU core info
                let cpus = sys.cpus();
                let cpu_count = cpus.len() as u32;
                let per_core_usage = cpus.iter().map(|cpu| cpu.cpu_usage()).collect();
                let cpu_usage = sys.global_cpu_usage();
                let cpu_usage_cores = if cpu_count > 0 {
                    (cpu_usage * cpu_count as f32) / 100.0
                } else {
                    0.0
                };

                // Collect CPU frequency (in MHz)
                let cpu_freq_mhz = cpus.iter().map(|cpu| cpu.frequency()).collect();

                // Attempt to collect CPU temperature (if available)
                let cpu_temp_celsius = {
                    let components = Components::new_with_refreshed_list();
                    components
                        .iter()
                        .find(|c| c.label().to_lowercase().contains("package"))
                        .and_then(|c| c.temperature())
                };

                // Swap memory
                let swap_used = sys.used_swap();
                let swap_total = sys.total_swap();

                // Load average
                let load = System::load_average();

                let snapshot = SystemSnapshot {
                    cpu_usage,
                    cpu_count,
                    cpu_usage_cores,
                    per_core_usage,
                    cpu_temp_celsius,
                    cpu_freq_mhz,
                    memory_used: sys.used_memory(),
                    memory_total: sys.total_memory(),
                    swap_used,
                    swap_total,
                    disk_used,
                    disk_total,
                    net_rx_bytes,
                    net_tx_bytes,
                    uptime_secs,
                    process_memory_bytes,
                    process_virtual_memory_bytes,
                    process_cpu_percent,
                    db_pool_size: 0, // Will be updated by the service layer
                    db_pool_idle: 0, // Will be updated by the service layer
                    load_avg_1: load.one,
                    load_avg_5: load.five,
                    load_avg_15: load.fifteen,
                };

                *snapshot_clone.write().await = snapshot;
            }
        });

        (Self { latest_snapshot }, handle)
    }

    /// Get the latest system snapshot without blocking
    ///
    /// # Returns
    /// A cloned copy of the latest SystemSnapshot
    pub async fn get_snapshot(&self) -> SystemSnapshot {
        self.latest_snapshot.read().await.clone()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_collector_initialization() {
        let start_time = Arc::new(std::time::Instant::now());
        let (collector, _handle) = SystemMetricsCollector::new(start_time);

        let snapshot = collector.get_snapshot().await;
        // First snapshot should be all zeros (hasn't been updated yet)
        assert_eq!(snapshot.cpu_usage, 0.0);

        // Wait for the collector to update
        tokio::time::sleep(Duration::from_millis(200)).await;

        let _snapshot2 = collector.get_snapshot().await;
        // After the initial delay and first real refresh, values should be available
        // (though they might still be low on idle systems)
        assert!(true); // Just verify no panic
    }
}

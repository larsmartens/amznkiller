package eu.hxreborn.amznkiller.ui.state

import androidx.compose.runtime.Immutable

@Immutable
data class DashboardUiState(
    val isInitialized: Boolean = false,
    val isXposedActive: Boolean = false,
    val frameworkVersion: String? = null,
    val isRefreshing: Boolean = false,
    val isRefreshFailed: Boolean = false,
    val isStale: Boolean = true,
    val lastFetched: Long = 0L,
    val selectorCount: Int = 0,
    val injectionEnabled: Boolean = true,
    val lastRefreshOutcome: SelectorSyncOutcome? = null,
)

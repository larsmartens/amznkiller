package eu.hxreborn.amznkiller.ui.state

import androidx.compose.runtime.Immutable

sealed interface DashboardUiState {
    data object Loading : DashboardUiState

    @Immutable
    data class Ready(
        val isXposedActive: Boolean,
        val frameworkVersion: String?,
        val isRefreshing: Boolean,
        val isRefreshFailed: Boolean,
        val isStale: Boolean,
        val lastFetched: Long,
        val selectorCount: Int,
        val injectionEnabled: Boolean,
        val lastRefreshOutcome: SelectorSyncOutcome?,
    ) : DashboardUiState
}

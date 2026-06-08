package eu.hxreborn.amznkiller.ui.screen.settings

import android.app.ActivityManager
import android.content.Intent
import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyListScope
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.BarChart
import androidx.compose.material.icons.outlined.Block
import androidx.compose.material.icons.outlined.CloudSync
import androidx.compose.material.icons.outlined.DarkMode
import androidx.compose.material.icons.outlined.Feedback
import androidx.compose.material.icons.outlined.FormatPaint
import androidx.compose.material.icons.outlined.Gavel
import androidx.compose.material.icons.outlined.Link
import androidx.compose.material.icons.outlined.Palette
import androidx.compose.material.icons.outlined.Timeline
import androidx.compose.material.icons.outlined.TouchApp
import androidx.compose.material.icons.outlined.TrendingUp
import androidx.compose.material.icons.rounded.BugReport
import androidx.compose.material.icons.rounded.DeveloperMode
import androidx.compose.material.icons.rounded.Info
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.LargeTopAppBar
import androidx.compose.material3.LocalTextStyle
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.RadioButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.Stable
import androidx.compose.runtime.derivedStateOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.input.nestedscroll.nestedScroll
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.pluralStringResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.core.content.getSystemService
import androidx.core.net.toUri
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import eu.hxreborn.amznkiller.BuildConfig
import eu.hxreborn.amznkiller.R
import eu.hxreborn.amznkiller.prefs.ForceDarkMode
import eu.hxreborn.amznkiller.prefs.Prefs
import eu.hxreborn.amznkiller.ui.component.BalloonsOverlay
import eu.hxreborn.amznkiller.ui.preview.FakeAppViewModel
import eu.hxreborn.amznkiller.ui.preview.PreviewLightDark
import eu.hxreborn.amznkiller.ui.preview.PreviewWrapper
import eu.hxreborn.amznkiller.ui.state.SettingsUiState.Loading
import eu.hxreborn.amznkiller.ui.state.SettingsUiState.Ready
import eu.hxreborn.amznkiller.ui.theme.AmznKillerSurfaceDefaults
import eu.hxreborn.amznkiller.ui.theme.Tokens
import eu.hxreborn.amznkiller.ui.util.shapeForPosition
import eu.hxreborn.amznkiller.ui.viewmodel.AppViewModel
import me.zhanghai.compose.preference.ProvidePreferenceLocals
import me.zhanghai.compose.preference.SwitchPreference
import me.zhanghai.compose.preference.preference
import me.zhanghai.compose.preference.preferenceCategory
import android.R as AndroidR

private const val REPO_URL = "https://github.com/larsmartens/amznkiller"
private const val SHAREHOLDER_TAPS = 7

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(
    viewModel: AppViewModel,
    contentPadding: PaddingValues = PaddingValues(0.dp),
    onNavigateToLicenses: () -> Unit = {},
) {
    val uiState by viewModel.settingsUiState.collectAsStateWithLifecycle()
    val prefs =
        when (val s = uiState) {
            Loading -> return
            is Ready -> s
        }
    val context = LocalContext.current
    val scrollBehavior = TopAppBarDefaults.exitUntilCollapsedScrollBehavior()
    var showThemeDialog by remember { mutableStateOf(false) }
    var showUrlDialog by remember { mutableStateOf(false) }
    var showRangeDialog by remember { mutableStateOf(false) }
    var showChartModeDialog by remember { mutableStateOf(false) }
    var showForceDarkModeDialog by remember { mutableStateOf(false) }
    val shareholderEgg = rememberShareholderEgg()

    if (showUrlDialog) {
        SelectorUrlDialog(
            currentUrl = prefs.selectorUrl,
            onSave = { url ->
                viewModel.savePref(Prefs.SELECTOR_URL, url)
                showUrlDialog = false
            },
            onDismiss = { showUrlDialog = false },
        )
    }

    if (showRangeDialog) {
        ChartRangeDialog(
            currentRange = prefs.chartDefaultRange,
            onSelect = { range ->
                viewModel.savePref(Prefs.CHART_DEFAULT_RANGE, range)
                showRangeDialog = false
            },
            onDismiss = { showRangeDialog = false },
        )
    }

    if (showChartModeDialog) {
        ChartModeDialog(
            currentMode = prefs.chartMode,
            onSelect = { mode ->
                viewModel.savePref(Prefs.CHART_MODE, mode)
                showChartModeDialog = false
                context
                    .getSystemService<ActivityManager>()
                    ?.killBackgroundProcesses("com.amazon.mShop.android.shopping")
            },
            onDismiss = { showChartModeDialog = false },
        )
    }

    if (showThemeDialog) {
        ThemeDialog(
            currentConfig = prefs.darkThemeConfig,
            onSelect = { config ->
                viewModel.savePref(Prefs.DARK_THEME_CONFIG, config.name.lowercase())
                showThemeDialog = false
            },
            onDismiss = { showThemeDialog = false },
        )
    }

    if (showForceDarkModeDialog) {
        ForceDarkModeDialog(
            currentMode = prefs.forceDarkMode,
            onSelect = { mode ->
                viewModel.savePref(Prefs.FORCE_DARK_MODE, mode.prefValue)
                showForceDarkModeDialog = false
            },
            onDismiss = { showForceDarkModeDialog = false },
        )
    }

    Scaffold(
        modifier = Modifier.nestedScroll(scrollBehavior.nestedScrollConnection),
        contentWindowInsets = WindowInsets(0, 0, 0, 0),
        topBar = {
            LargeTopAppBar(
                title = {
                    val isExpandedSlot = LocalTextStyle.current.fontSize >= MaterialTheme.typography.headlineMedium.fontSize
                    Text(
                        text = stringResource(R.string.tab_settings),
                        style =
                            if (isExpandedSlot) {
                                MaterialTheme.typography.headlineLarge.copy(
                                    lineHeight = Tokens.ExpandedTitleLineHeight,
                                )
                            } else {
                                LocalTextStyle.current
                            },
                        maxLines = if (isExpandedSlot) Tokens.EXPANDED_TITLE_MAX_LINES else 1,
                    )
                },
                scrollBehavior = scrollBehavior,
            )
        },
    ) { innerPadding ->
        val surface = AmznKillerSurfaceDefaults.cardContainerColor

        ProvidePreferenceLocals {
            LazyColumn(
                modifier = Modifier.fillMaxSize().padding(horizontal = Tokens.ScreenHorizontalPadding),
                contentPadding =
                    PaddingValues(
                        top = innerPadding.calculateTopPadding(),
                        bottom = contentPadding.calculateBottomPadding() + Tokens.SpacingLg,
                    ),
            ) {
                preferenceCategory(
                    key = "category_appearance",
                    title = { Text(stringResource(R.string.settings_appearance)) },
                )

                val appearanceItemCount = 2
                val themeShape = shapeForPosition(appearanceItemCount, 0)
                preference(
                    modifier = Modifier.preferenceModifier(surface, themeShape),
                    key = "theme",
                    icon = { Icon(Icons.Outlined.Palette, contentDescription = null) },
                    title = { PreferenceTitle(R.string.settings_theme) },
                    summary = { Text(stringResource(R.string.settings_theme_summary)) },
                    onClick = { showThemeDialog = true },
                )

                item { Spacer(Modifier.height(Tokens.PreferenceItemGap)) }

                val dynamicColorShape = shapeForPosition(appearanceItemCount, 1)
                switchPreference(
                    modifier = Modifier.preferenceModifier(surface, dynamicColorShape),
                    key = "dynamic_color",
                    value = prefs.useDynamicColor,
                    icon = { Icon(Icons.Outlined.FormatPaint, contentDescription = null) },
                    title = { PreferenceTitle(R.string.settings_dynamic_color) },
                    summary = { Text(stringResource(R.string.settings_dynamic_color_summary)) },
                    onValueChange = { viewModel.savePref(Prefs.USE_DYNAMIC_COLOR, it) },
                )

                preferenceCategory(
                    key = "category_ad_blocking",
                    title = { Text(stringResource(R.string.settings_ad_blocking)) },
                )

                val adBlockItemCount = 3
                val filteringShape = shapeForPosition(adBlockItemCount, 0)
                switchPreference(
                    modifier = Modifier.preferenceModifier(surface, filteringShape),
                    key = "css_injection",
                    value = prefs.injectionEnabled,
                    icon = { Icon(Icons.Outlined.Block, contentDescription = null) },
                    title = { PreferenceTitle(R.string.settings_content_filtering) },
                    summary = { Text(stringResource(R.string.settings_content_filtering_summary)) },
                    onValueChange = { viewModel.savePref(Prefs.INJECTION_ENABLED, it) },
                )

                item { Spacer(Modifier.height(Tokens.PreferenceItemGap)) }

                val syncShape = shapeForPosition(adBlockItemCount, 1)
                switchPreference(
                    modifier = Modifier.preferenceModifier(surface, syncShape),
                    key = "auto_update",
                    value = prefs.autoUpdate,
                    icon = { Icon(Icons.Outlined.CloudSync, contentDescription = null) },
                    title = { PreferenceTitle(R.string.settings_background_sync) },
                    summary = { Text(stringResource(R.string.settings_background_sync_summary)) },
                    onValueChange = { viewModel.savePref(Prefs.AUTO_UPDATE, it) },
                )

                item { Spacer(Modifier.height(Tokens.PreferenceItemGap)) }

                val filterSourcesShape = shapeForPosition(adBlockItemCount, 2)
                preference(
                    modifier = Modifier.preferenceModifier(surface, filterSourcesShape),
                    key = "filter_sources",
                    icon = { Icon(Icons.Outlined.Link, contentDescription = null) },
                    title = { PreferenceTitle(R.string.settings_filter_sources) },
                    summary = { Text(stringResource(R.string.settings_filter_sources_summary)) },
                    onClick = { showUrlDialog = true },
                )

                preferenceCategory(
                    key = "category_shopping_display",
                    title = { Text(stringResource(R.string.settings_shopping_display)) },
                )

                val displayItemCount = 5
                val chartsShape = shapeForPosition(displayItemCount, 0)
                switchPreference(
                    modifier = Modifier.preferenceModifier(surface, chartsShape),
                    key = "price_charts",
                    value = prefs.priceChartsEnabled,
                    icon = { Icon(Icons.Outlined.TrendingUp, contentDescription = null) },
                    title = { PreferenceTitle(R.string.settings_marketplace_insights) },
                    summary = { Text(stringResource(R.string.settings_marketplace_insights_summary)) },
                    onValueChange = { viewModel.savePref(Prefs.PRICE_CHARTS_ENABLED, it) },
                )

                item { Spacer(Modifier.height(Tokens.PreferenceItemGap)) }

                val chartModeShape = shapeForPosition(displayItemCount, 1)
                preference(
                    modifier =
                        Modifier
                            .padding(horizontal = 8.dp)
                            .background(color = surface, shape = chartModeShape)
                            .clip(chartModeShape),
                    key = "chart_mode",
                    icon = {
                        Icon(
                            imageVector = Icons.Outlined.BarChart,
                            contentDescription = null,
                        )
                    },
                    title = {
                        Text(
                            text = stringResource(R.string.settings_chart_mode),
                            style = MaterialTheme.typography.bodyLarge,
                        )
                    },
                    summary = {
                        val modeLabel =
                            when (prefs.chartMode) {
                                "custom" -> stringResource(R.string.settings_chart_mode_custom)
                                "keepa_overlay" -> stringResource(R.string.settings_chart_mode_keepa_overlay)
                                else -> stringResource(R.string.settings_chart_mode_static)
                            }
                        Text(text = modeLabel)
                    },
                    onClick = { showChartModeDialog = true },
                )

                item { Spacer(Modifier.height(Tokens.PreferenceItemGap)) }

                val chartRangeShape = shapeForPosition(displayItemCount, 2)
                preference(
                    modifier =
                        Modifier
                            .padding(horizontal = 8.dp)
                            .background(color = surface, shape = chartRangeShape)
                            .clip(chartRangeShape),
                    key = "chart_default_range",
                    icon = {
                        Icon(
                            imageVector = Icons.Outlined.Timeline,
                            contentDescription = null,
                        )
                    },
                    title = {
                        Text(
                            text = stringResource(R.string.settings_chart_default_range),
                            style = MaterialTheme.typography.bodyLarge,
                        )
                    },
                    summary = {
                        val rangeLabel =
                            when (prefs.chartDefaultRange) {
                                "30" -> "1 Month"
                                "90" -> "3 Months"
                                "365" -> "1 Year"
                                else -> "All Time"
                            }
                        Text(text = rangeLabel)
                    },
                    onClick = { showRangeDialog = true },
                )

                item { Spacer(Modifier.height(2.dp)) }

                val interactiveShape = shapeForPosition(displayItemCount, 3)
                switchPreference(
                    modifier =
                        Modifier
                            .padding(horizontal = 8.dp)
                            .background(color = surface, shape = interactiveShape)
                            .clip(interactiveShape),
                    key = "chart_interactive",
                    value = prefs.chartInteractiveEnabled,
                    icon = {
                        Icon(
                            imageVector = Icons.Outlined.TouchApp,
                            contentDescription = null,
                        )
                    },
                    title = {
                        Text(
                            text = stringResource(R.string.settings_chart_interactive),
                            style = MaterialTheme.typography.bodyLarge,
                        )
                    },
                    summary = {
                        Text(
                            text = stringResource(R.string.settings_chart_interactive_summary),
                        )
                    },
                    onValueChange = { viewModel.savePref(Prefs.CHART_INTERACTIVE_ENABLED, it) },
                )

                item { Spacer(Modifier.height(2.dp)) }

                val darkModeShape = shapeForPosition(displayItemCount, 4)
                preference(
                    modifier = Modifier.padding(horizontal = 8.dp).background(color = surface, shape = darkModeShape).clip(darkModeShape),
                    key = "force_dark_mode",
                    icon = {
                        Icon(
                            imageVector = Icons.Outlined.DarkMode,
                            contentDescription = null,
                        )
                    },
                    title = {
                        Text(
                            text = stringResource(R.string.settings_dark_mode),
                            style = MaterialTheme.typography.bodyLarge,
                        )
                    },
                    summary = {
                        Text(
                            text =
                                buildAnnotatedString {
                                    append(stringResource(R.string.settings_dark_mode_summary))
                                    append("\n")
                                    append(
                                        when (prefs.forceDarkMode) {
                                            ForceDarkMode.OFF -> stringResource(R.string.settings_force_dark_off)
                                            ForceDarkMode.FOLLOW_SYSTEM -> stringResource(R.string.settings_force_dark_follow_system)
                                            ForceDarkMode.ON -> stringResource(R.string.settings_force_dark_on)
                                        },
                                    )
                                    append("\n")
                                    withStyle(SpanStyle(fontWeight = FontWeight.Bold)) {
                                        append("Note: ")
                                    }
                                    append("Requires Android 15 or higher to work properly")
                                },
                        )
                    },
                    onClick = { showForceDarkModeDialog = true },
                )

                preferenceCategory(
                    key = "category_advanced",
                    title = { Text(stringResource(R.string.settings_advanced)) },
                )

                val advancedItemCount = 3
                val hideLauncherShape = shapeForPosition(advancedItemCount, 0)
                switchPreference(
                    modifier = Modifier.preferenceModifier(surface, hideLauncherShape),
                    key = "hide_launcher_icon",
                    value = prefs.isLauncherIconHidden,
                    icon = {
                        Icon(
                            imageVector = Icons.Outlined.Block,
                            contentDescription = null,
                        )
                    },
                    title = {
                        Text(
                            text = stringResource(R.string.settings_hide_launcher_icon),
                            style = MaterialTheme.typography.bodyLarge,
                        )
                    },
                    summary = {
                        Text(text = stringResource(R.string.settings_hide_launcher_icon_summary))
                    },
                    onValueChange = { viewModel.setLauncherIconHidden(it) },
                )

                item { Spacer(Modifier.height(Tokens.PreferenceItemGap)) }

                val webviewDebugShape = shapeForPosition(advancedItemCount, 1)
                switchPreference(
                    modifier = Modifier.preferenceModifier(surface, webviewDebugShape),
                    key = "webview_debugging",
                    value = prefs.webviewDebugging,
                    icon = { Icon(Icons.Rounded.DeveloperMode, contentDescription = null) },
                    title = { PreferenceTitle(R.string.settings_webview_debugging) },
                    summary = { Text(stringResource(R.string.settings_webview_debugging_summary)) },
                    onValueChange = { viewModel.savePref(Prefs.WEBVIEW_DEBUGGING, it) },
                )

                item { Spacer(Modifier.height(Tokens.PreferenceItemGap)) }

                val debugShape = shapeForPosition(advancedItemCount, 2)
                switchPreference(
                    modifier = Modifier.preferenceModifier(surface, debugShape),
                    key = "debug_logs",
                    value = prefs.debugLogs,
                    icon = { Icon(Icons.Rounded.BugReport, contentDescription = null) },
                    title = { PreferenceTitle(R.string.settings_debug_logs) },
                    summary = { Text(stringResource(R.string.settings_debug_logs_summary)) },
                    onValueChange = { viewModel.savePref(Prefs.DEBUG_LOGS, it) },
                )

                preferenceCategory(
                    key = "category_about",
                    title = { Text(stringResource(R.string.settings_about)) },
                )

                val aboutItemCount = 4
                val versionShape = shapeForPosition(aboutItemCount, 0)
                preference(
                    modifier = Modifier.preferenceModifier(surface, versionShape),
                    key = "app_version",
                    icon = { Icon(Icons.Rounded.Info, contentDescription = null) },
                    title = { PreferenceTitle(R.string.settings_app_version) },
                    summary = { Text("v${BuildConfig.VERSION_NAME} (${BuildConfig.VERSION_CODE})") },
                    onClick = shareholderEgg.onVersionTap,
                )

                item { Spacer(Modifier.height(Tokens.PreferenceItemGap)) }

                val gitRepoShape = shapeForPosition(aboutItemCount, 1)
                preference(
                    modifier = Modifier.preferenceModifier(surface, gitRepoShape),
                    key = "git_repo",
                    icon = { Icon(painterResource(R.drawable.ic_github_24), contentDescription = null) },
                    title = { PreferenceTitle(R.string.settings_git_repo) },
                    summary = { Text(stringResource(R.string.settings_git_repo_summary)) },
                    onClick = {
                        context.startActivity(Intent(Intent.ACTION_VIEW, REPO_URL.toUri()))
                    },
                )

                item { Spacer(Modifier.height(Tokens.PreferenceItemGap)) }

                val licensesShape = shapeForPosition(aboutItemCount, 2)
                preference(
                    modifier = Modifier.preferenceModifier(surface, licensesShape),
                    key = "licenses",
                    icon = { Icon(Icons.Outlined.Gavel, contentDescription = null) },
                    title = { PreferenceTitle(R.string.settings_licenses) },
                    summary = { Text(stringResource(R.string.settings_licenses_summary)) },
                    onClick = onNavigateToLicenses,
                )

                item { Spacer(Modifier.height(Tokens.PreferenceItemGap)) }

                val issueShape = shapeForPosition(aboutItemCount, 3)
                preference(
                    modifier = Modifier.preferenceModifier(surface, issueShape),
                    key = "report_issue",
                    icon = { Icon(Icons.Outlined.Feedback, contentDescription = null) },
                    title = { PreferenceTitle(R.string.settings_report_issue) },
                    summary = { Text(stringResource(R.string.settings_report_issue_summary)) },
                    onClick = {
                        context.startActivity(Intent(Intent.ACTION_VIEW, "$REPO_URL/issues/new/choose".toUri()))
                    },
                )
            }
        }
    }

    if (shareholderEgg.showBalloons) {
        BalloonsOverlay(onDismiss = shareholderEgg.onDismissBalloons)
    }
}

@Stable
private class ShareholderEggState(
    showBalloonsProvider: () -> Boolean,
    val onDismissBalloons: () -> Unit,
    val onVersionTap: () -> Unit,
) {
    val showBalloons: Boolean by derivedStateOf(showBalloonsProvider)
}

@Composable
private fun rememberShareholderEgg(): ShareholderEggState {
    val context = LocalContext.current
    val alreadyMsg = stringResource(R.string.easter_shareholder_already)
    val countdownLabels =
        (1 until SHAREHOLDER_TAPS - 2).map { n ->
            pluralStringResource(R.plurals.easter_shareholder_countdown, n, n)
        }

    var tapCount by rememberSaveable { mutableIntStateOf(0) }
    var alreadyShareholder by rememberSaveable { mutableStateOf(false) }
    var showBalloons by remember { mutableStateOf(false) }
    val countdownToast = remember { mutableStateOf<Toast?>(null) }

    fun showToast(text: CharSequence) {
        countdownToast.value?.cancel()
        countdownToast.value = Toast.makeText(context, text, Toast.LENGTH_SHORT).also { it.show() }
    }

    DisposableEffect(Unit) {
        onDispose { countdownToast.value?.cancel() }
    }

    return remember {
        ShareholderEggState(
            showBalloonsProvider = { showBalloons },
            onDismissBalloons = { showBalloons = false },
            onVersionTap = onVersionTap@{
                when {
                    showBalloons -> {
                        return@onVersionTap
                    }

                    alreadyShareholder -> {
                        showToast(alreadyMsg)
                    }

                    else -> {
                        tapCount += 1
                        val remaining = SHAREHOLDER_TAPS - tapCount
                        if (remaining == 0) {
                            countdownToast.value?.cancel()
                            tapCount = 0
                            alreadyShareholder = true
                            showBalloons = true
                        } else if (remaining in 1..countdownLabels.size) {
                            showToast(countdownLabels[remaining - 1])
                        }
                    }
                }
            },
        )
    }
}

@Composable
private fun ChartRangeDialog(
    currentRange: String,
    onSelect: (String) -> Unit,
    onDismiss: () -> Unit,
) {
    val options = listOf("all", "365", "90", "30")
    val labels = listOf("All Time", "1 Year", "3 Months", "1 Month")

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(stringResource(R.string.settings_chart_default_range)) },
        text = {
            Column(modifier = Modifier.selectableGroup()) {
                options.forEachIndexed { index, option ->
                    Row(
                        modifier =
                            Modifier
                                .fillMaxWidth()
                                .height(56.dp)
                                .selectable(
                                    selected = option == currentRange,
                                    onClick = { onSelect(option) },
                                    role = Role.RadioButton,
                                ).padding(horizontal = 16.dp),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        RadioButton(
                            selected = option == currentRange,
                            onClick = null,
                        )
                        Spacer(modifier = Modifier.padding(start = 16.dp))
                        Text(
                            text = labels[index],
                            style = MaterialTheme.typography.bodyLarge,
                        )
                    }
                }
            }
        },
        confirmButton = {
            TextButton(onClick = onDismiss) {
                Text(stringResource(AndroidR.string.cancel))
            }
        },
    )
}

@Composable
private fun ChartModeDialog(
    currentMode: String,
    onSelect: (String) -> Unit,
    onDismiss: () -> Unit,
) {
    val options = listOf("static", "custom", "keepa_overlay")
    val labels =
        listOf(
            stringResource(R.string.settings_chart_mode_static),
            stringResource(R.string.settings_chart_mode_custom),
            stringResource(R.string.settings_chart_mode_keepa_overlay),
        )

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(stringResource(R.string.settings_chart_mode)) },
        text = {
            Column(modifier = Modifier.selectableGroup()) {
                options.forEachIndexed { index, option ->
                    Row(
                        modifier =
                            Modifier
                                .fillMaxWidth()
                                .height(56.dp)
                                .selectable(
                                    selected = option == currentMode,
                                    onClick = { onSelect(option) },
                                    role = Role.RadioButton,
                                ).padding(horizontal = 16.dp),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        RadioButton(
                            selected = option == currentMode,
                            onClick = null,
                        )
                        Spacer(modifier = Modifier.padding(start = 16.dp))
                        Text(
                            text = labels[index],
                            style = MaterialTheme.typography.bodyLarge,
                        )
                    }
                }
            }
        },
        confirmButton = {
            TextButton(onClick = onDismiss) {
                Text(stringResource(AndroidR.string.cancel))
            }
        },
    )
}

private inline fun LazyListScope.switchPreference(
    key: String,
    value: Boolean,
    crossinline title: @Composable (Boolean) -> Unit,
    modifier: Modifier = Modifier.fillMaxWidth(),
    crossinline enabled: (Boolean) -> Boolean = { true },
    noinline icon: @Composable ((Boolean) -> Unit)? = null,
    noinline summary: @Composable ((Boolean) -> Unit)? = null,
    noinline onValueChange: (Boolean) -> Unit,
) {
    item(key = key, contentType = "SwitchPreference") {
        SwitchPreference(
            value = value,
            title = { title(value) },
            modifier = modifier,
            enabled = enabled(value),
            icon = icon?.let { { it(value) } },
            summary = summary?.let { { it(value) } },
            onValueChange = onValueChange,
        )
    }
}

private fun Modifier.preferenceModifier(
    color: Color,
    shape: Shape,
): Modifier = padding(horizontal = 8.dp).background(color = color, shape = shape).clip(shape)

@Composable
private fun PreferenceTitle(resId: Int) {
    Text(
        text = stringResource(resId),
        style = MaterialTheme.typography.bodyLarge,
    )
}

@Suppress("ViewModelConstructorInComposable")
@PreviewLightDark
@Composable
private fun SettingsScreenPreview() {
    val app = LocalContext.current.applicationContext as android.app.Application
    PreviewWrapper {
        SettingsScreen(viewModel = FakeAppViewModel(app))
    }
}

private class PreviewSettingsViewModel : AppViewModel() {
    override val dashboardUiState: StateFlow<DashboardUiState> = MutableStateFlow(DashboardUiState.Loading).asStateFlow()

    override val settingsUiState: StateFlow<SettingsUiState> =
        MutableStateFlow(
            Ready(
                darkThemeConfig = DarkThemeConfig.FOLLOW_SYSTEM,
                useDynamicColor = true,
                debugLogs = false,
                injectionEnabled = true,
                forceDarkMode = ForceDarkMode.OFF,
                chartDefaultRange = Prefs.CHART_DEFAULT_RANGE.default,
                chartInteractiveEnabled = Prefs.CHART_INTERACTIVE_ENABLED.default,
                chartMode = Prefs.CHART_MODE.default,
            ),
        ).asStateFlow()

    override fun refreshAll() {}

    override fun triggerAutoUpdateIfEnabled() {}

    override fun setXposedActive(
        active: Boolean,
        frameworkVersion: String?,
    ) {
    }

    override fun <T : Any> savePref(
        pref: PrefSpec<T>,
        value: T,
    ) {
    }

    override fun setLauncherIconHidden(hidden: Boolean) {}

    override fun syncLocalToRemote() {}
}

package com.budgetguard.notifications

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Build
import androidx.core.app.NotificationCompat
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.modules.core.DeviceEventManagerModule

/**
 * Fires a single local (device-only) notification, e.g. to tell the user a
 * new budget cycle started and carried forward last month's income/fixed
 * expenses. No remote push service involved — everything stays on-device.
 */
class LocalNotificationModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    companion object {
        private const val CHANNEL_ID = "budgetguard_general"
        private const val CHANNEL_NAME = "Budget updates"
        const val TRANSACTION_EVENT = "BudgetGuardTransactionDetected"
    }

    private var detectionReceiver: BroadcastReceiver? = null

    /**
     * The listener service writes transactions with no JS involved. Relay that
     * to the running app so the UI updates immediately rather than on next
     * foreground.
     */
    override fun initialize() {
        super.initialize()
        val receiver = object : BroadcastReceiver() {
            override fun onReceive(context: Context?, intent: Intent?) {
                if (!reactApplicationContext.hasActiveReactInstance()) return
                reactApplicationContext
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                    .emit(TRANSACTION_EVENT, null)
            }
        }
        detectionReceiver = receiver
        val filter = IntentFilter(FinanceNotificationListener.ACTION_TRANSACTION_DETECTED)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            reactApplicationContext.registerReceiver(receiver, filter, Context.RECEIVER_NOT_EXPORTED)
        } else {
            reactApplicationContext.registerReceiver(receiver, filter)
        }
    }

    override fun invalidate() {
        detectionReceiver?.let { runCatching { reactApplicationContext.unregisterReceiver(it) } }
        detectionReceiver = null
        super.invalidate()
    }

    override fun getName() = "LocalNotification"

    /**
     * Every app that can post notifications, so the user can watch a bank we
     * never shipped a package name for. Launcher intent query rather than
     * QUERY_ALL_PACKAGES: it is the policy-friendly way to see real apps.
     */
    @ReactMethod
    fun getInstalledApps(promise: Promise) {
        val pm = reactApplicationContext.packageManager
        val intent = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER)
        val resolved = pm.queryIntentActivities(intent, 0)
        val seen = HashSet<String>()
        val list = Arguments.createArray()
        resolved
            .mapNotNull { it.activityInfo?.applicationInfo }
            .filter { seen.add(it.packageName) && it.packageName != reactApplicationContext.packageName }
            .map { it to pm.getApplicationLabel(it).toString() }
            .sortedBy { it.second.lowercase() }
            .forEach { (info, label) ->
                list.pushMap(
                    Arguments.createMap().apply {
                        putString("packageName", info.packageName)
                        putString("label", label)
                    },
                )
            }
        promise.resolve(list)
    }

    /**
     * The listener runs without a JS runtime, so the watch list has to live
     * somewhere it can read directly.
     */
    @ReactMethod
    fun setWatchedPackages(packages: ReadableArray, promise: Promise) {
        val set = HashSet<String>()
        for (i in 0 until packages.size()) packages.getString(i)?.let { set.add(it) }
        reactApplicationContext
            .getSharedPreferences(FinanceNotificationListener.PREFS, android.content.Context.MODE_PRIVATE)
            .edit()
            .putStringSet(FinanceNotificationListener.WATCHED_KEY, set)
            .apply()
        promise.resolve(true)
    }

    @ReactMethod
    fun getDefaultWatchedPackages(promise: Promise) {
        val list = Arguments.createArray()
        FinanceNotificationListener.KNOWN_SOURCES.forEach { list.pushString(it) }
        promise.resolve(list)
    }

    /**
     * Detection is invisible when it fails — the listener runs in another
     * process and every rejection is a silent return. This surfaces whether
     * the service is even receiving notifications and what it last decided.
     */
    @ReactMethod
    fun getDetectionDiagnostics(promise: Promise) {
        val context = reactApplicationContext
        val enabled = androidx.core.app.NotificationManagerCompat
            .getEnabledListenerPackages(context)
            .contains(context.packageName)
        val prefs = context.getSharedPreferences(FinanceNotificationListener.PREFS, android.content.Context.MODE_PRIVATE)
        val map = Arguments.createMap().apply {
            putBoolean("listenerEnabled", enabled)
            putDouble("lastAnyAt", prefs.getLong("lastAnyAt", 0L).toDouble())
            putDouble("lastKnownAt", prefs.getLong("lastKnownAt", 0L).toDouble())
            putString("lastPackage", prefs.getString("lastPackage", null))
            putString("lastOutcome", prefs.getString("lastOutcome", null))
            putInt("addedCount", prefs.getInt("addedCount", 0))
        }
        promise.resolve(map)
    }

    @ReactMethod
    fun show(title: String, body: String, notificationId: Int) {
        val context = reactApplicationContext
        val manager = context.getSystemService(android.content.Context.NOTIFICATION_SERVICE) as NotificationManager

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(CHANNEL_ID, CHANNEL_NAME, NotificationManager.IMPORTANCE_DEFAULT)
            manager.createNotificationChannel(channel)
        }

        val launchIntent = context.packageManager.getLaunchIntentForPackage(context.packageName)
        val pendingIntent = PendingIntent.getActivity(
            context, notificationId, launchIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )

        val notification = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(context.applicationInfo.icon)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(NotificationCompat.BigTextStyle().bigText(body))
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)
            .build()

        try {
            manager.notify(notificationId, notification)
        } catch (e: SecurityException) {
            // POST_NOTIFICATIONS not granted (Android 13+) — silently skip, the
            // in-app carry-forward banner still covers the same information.
        }
    }
}

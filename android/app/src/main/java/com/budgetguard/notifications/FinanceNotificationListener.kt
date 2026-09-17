package com.budgetguard.notifications

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Intent
import android.content.Context.MODE_PRIVATE
import android.database.sqlite.SQLiteDatabase
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import java.util.UUID

/**
 * Listens for payment-app notifications and turns them into transactions,
 * entirely on-device. Runs even when the JS/React Native runtime is not
 * alive, so it talks to the same SQLite file directly instead of going
 * through the app's TypeScript repositories (spec: notification-based
 * detection, no SMS permission, fully offline).
 */
class FinanceNotificationListener : NotificationListenerService() {

    companion object {
        const val WATCHED_KEY = "watchedPackages"

        /** Shipped defaults, used until the user chooses their own set. */
        val KNOWN_SOURCES = setOf(
            // UPI / wallets
            "com.google.android.apps.nbu.paisa.user", // Google Pay
            "com.phonepe.app",
            "net.one97.paytm",
            "com.dreamplug.androidapp",              // CRED
            "in.org.npci.upiapp",                    // BHIM
            "com.mobikwik_new",
            "com.freecharge.android",
            "com.samsung.android.spay",              // Samsung Pay / Wallet
            "com.myairtelapp",                       // Airtel Thanks
            "com.jio.myjio",
            "in.amazon.mShop.android.shopping",      // Amazon Pay
            "com.whatsapp.w4b",                      // WhatsApp Business Pay
            // Bank apps
            "com.csam.icici.bank.imobile",           // ICICI iMobile
            "com.snapwork.hdfc",                     // HDFC MobileBanking
            "com.sbi.lotusintouch",                  // SBI YONO
            "com.sbi.SBIFreedomPlus",                // SBI Anywhere
            "com.axis.mobile",                       // Axis Mobile
            "com.upi.axispay",
            "com.msf.kbank.mobile",                  // Kotak
            "com.bankofbaroda.mconnect",
            "com.canarabank.mobility",
            "com.fss.pnbpsp",                        // PNB
            "com.infrasofttech.CentralBank",
            "com.idbibank.abhay_card",
            "com.YESBANK",
            "com.indusind.indusmobile",
            "com.fedmobile",                         // Federal Bank
            "com.rblbank.mobank",
            // Text and mail
            "com.google.android.apps.messaging",     // SMS
            "com.samsung.android.messaging",
            "com.google.android.gm",                 // Gmail
        )

        private const val DB_NAME = "budget_guard.db"
        private const val DB_LOCATION = "default"

        /** Broadcast so a running app can reload instead of waiting for the next foreground. */
        const val ACTION_TRANSACTION_DETECTED = "com.budgetguard.TRANSACTION_DETECTED"

        const val PREFS = "detection_diagnostics"

        private const val AUTO_CONFIRM_THRESHOLD = 0.85
        private const val DEDUP_WINDOW_MS = 5 * 60 * 1000L
    }

    override fun onNotificationPosted(sbn: StatusBarNotification) {
        // Proof the service is alive at all, which is otherwise invisible.
        prefs().edit().putLong("lastAnyAt", System.currentTimeMillis()).apply()

        val extras = sbn.notification.extras
        val title = extras.getCharSequence("android.title")?.toString()
        val text = (extras.getCharSequence("android.bigText") ?: extras.getCharSequence("android.text"))?.toString()
        val bigText = extras.getCharSequence("android.bigText")?.toString()
        val subText = extras.getCharSequence("android.subText")?.toString()
        val watched = sbn.packageName in watchedPackages()
        val explanation = TransactionParser.explain(title, text)
        val rawEventId = if (watched) recordRawMessage(sbn, title, text, bigText, subText, explanation.parsed != null) else null

        val outcome = try {
            when {
                !watched -> "app not in the watched list"
                explanation.parsed == null -> explanation.reason
                else -> store(sbn, explanation.parsed, rawEventId)
            }
        } catch (e: Exception) {
            // Never let a malformed notification crash the listener service.
            "error: ${e.javaClass.simpleName}: ${e.message?.take(120)}"
        }

        if (watched) record(sbn.packageName, outcome)
    }

    private fun prefs() = applicationContext.getSharedPreferences(PREFS, MODE_PRIVATE)

    /** The user's chosen apps, falling back to the shipped defaults. */
    private fun watchedPackages(): Set<String> {
        val stored = prefs().getStringSet(WATCHED_KEY, null)
        return if (stored.isNullOrEmpty()) KNOWN_SOURCES else stored
    }

    /** Every rejection path used to be a silent return; now each one leaves a trace. */
    private fun record(packageName: String, outcome: String) {
        prefs().edit()
            .putString("lastPackage", packageName)
            .putString("lastOutcome", outcome)
            .putLong("lastKnownAt", System.currentTimeMillis())
            .apply()
    }

    /**
     * op-sqlite treats `location` as a sub-folder name, so the app's database is
     * at databases/default/budget_guard.db — not the plain getDatabasePath() spot.
     * Must stay in step with src/database/connection.ts.
     */
    private fun databaseFile(): java.io.File {
        val databases = applicationContext.getDatabasePath(DB_NAME).parentFile
        val nested = java.io.File(java.io.File(databases, DB_LOCATION), DB_NAME)
        return if (nested.exists()) nested else java.io.File(databases, DB_NAME)
    }

    private fun recordRawMessage(sbn: StatusBarNotification, title: String?, text: String?, bigText: String?, subText: String?, processed: Boolean): String? {
        val file = databaseFile()
        if (!file.exists()) return null
        val id = UUID.randomUUID().toString()
        SQLiteDatabase.openDatabase(file.path, null, SQLiteDatabase.OPEN_READWRITE).use { db ->
            val values = android.content.ContentValues().apply {
                put("id", id)
                put("package_name", sbn.packageName)
                put("title", title)
                put("text", text)
                put("big_text", bigText)
                put("sub_text", subText)
                put("timestamp", sbn.postTime)
                put("notification_key", sbn.key)
                put("processed", if (processed) 1 else 0)
                put("classification", if (processed) "parsed" else "ignored")
            }
            return if (db.insert("raw_notification_events", null, values) == -1L) null else id
        }
    }

    private fun store(sbn: StatusBarNotification, parsed: TransactionParser.ParsedTransaction, rawEventId: String?): String {
        val file = databaseFile()
        if (!file.exists()) return "database not found at ${file.path}"

        val db = SQLiteDatabase.openDatabase(file.path, null, SQLiteDatabase.OPEN_READWRITE)
        db.use {
            val cycleId = activeCycleId(it) ?: return "no active budget cycle"
            val categoryId = othersCategoryId(it, cycleId) ?: return "no Others category"
            val timestamp = sbn.postTime
            val direction = if (parsed.direction == TransactionParser.Direction.DEBIT) "DEBIT" else "CREDIT"

            if (isDuplicate(it, cycleId, parsed.amountPaise, direction, timestamp)) {
                return "duplicate of a recent transaction"
            }

            val rowId = insertTransaction(it, cycleId, categoryId, parsed, direction, timestamp, sbn.packageName)
            if (rowId == -1L) return "database rejected the insert"

            prefs().edit().putInt("addedCount", prefs().getInt("addedCount", 0) + 1).apply()
            notifyWidget()
            applicationContext.sendBroadcast(
                Intent(ACTION_TRANSACTION_DETECTED).setPackage(applicationContext.packageName),
            )
            return "added ₹${parsed.amountPaise / 100}"
        }
    }

    /**
     * The transaction went straight into SQLite with no JS runtime involved,
     * so nothing has told the home screen widgets to redraw.
     */
    private fun notifyWidget() {
        val manager = AppWidgetManager.getInstance(applicationContext)
        val providers = listOf(
            com.budgetguard.widgets.BudgetWidget::class.java,
            com.budgetguard.widgets.CategoriesWidget::class.java,
            com.budgetguard.widgets.TransactionsWidget::class.java,
            com.budgetguard.widgets.SavingsWidget::class.java,
            com.budgetguard.widgets.CalendarWidget::class.java,
        )
        providers.forEach { cls ->
            val provider = ComponentName(applicationContext, cls)
            val ids = manager.getAppWidgetIds(provider)
            if (ids.isNotEmpty()) {
                applicationContext.sendBroadcast(
                    Intent(AppWidgetManager.ACTION_APPWIDGET_UPDATE).apply {
                        component = provider
                        putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids)
                    }
                )
            }
        }
    }

    private fun activeCycleId(db: SQLiteDatabase): String? {
        db.rawQuery("SELECT id FROM budget_cycles WHERE status = 'ACTIVE' LIMIT 1", null).use { c ->
            return if (c.moveToFirst()) c.getString(0) else null
        }
    }

    private fun othersCategoryId(db: SQLiteDatabase, cycleId: String): String? {
        db.rawQuery(
            "SELECT id FROM categories WHERE cycle_id = ? AND is_system_category = 1 LIMIT 1",
            arrayOf(cycleId),
        ).use { c ->
            return if (c.moveToFirst()) c.getString(0) else null
        }
    }

    private fun isDuplicate(db: SQLiteDatabase, cycleId: String, amountPaise: Long, direction: String, timestamp: Long): Boolean {
        db.rawQuery(
            """SELECT id FROM transactions WHERE cycle_id = ? AND amount_paise = ? AND direction = ?
               AND timestamp BETWEEN ? AND ? LIMIT 1""",
            arrayOf(cycleId, amountPaise.toString(), direction, (timestamp - DEDUP_WINDOW_MS).toString(), (timestamp + DEDUP_WINDOW_MS).toString()),
        ).use { c ->
            return c.moveToFirst()
        }
    }

    private fun insertTransaction(
        db: SQLiteDatabase,
        cycleId: String,
        categoryId: String,
        parsed: TransactionParser.ParsedTransaction,
        direction: String,
        timestamp: Long,
        packageName: String,
    ): Long {
        val values = android.content.ContentValues().apply {
            put("id", UUID.randomUUID().toString())
            put("cycle_id", cycleId)
            put("amount_paise", parsed.amountPaise)
            put("direction", direction)
            put("type", if (direction == "CREDIT") "INCOME" else "VARIABLE_EXPENSE")
            put("category_id", categoryId)
            put("merchant", parsed.merchant)
            put("source", "UPI_NOTIFICATION")
            put("source_package", packageName)
            put("timestamp", timestamp)
            put("confidence", parsed.confidence)
            put("auto_confirmed", if (parsed.confidence >= AUTO_CONFIRM_THRESHOLD) 1 else 0)
        }
        return db.insert("transactions", null, values)
    }
}

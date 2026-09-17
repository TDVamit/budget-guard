package com.budgetguard.notifications

import java.math.BigDecimal
import java.math.RoundingMode

/**
 * Deterministic, regex-based parsing of payment notification text into a
 * candidate transaction. No ML/LLM involved (spec requirement) — purely
 * pattern matching with a confidence score so low-confidence hits land in
 * the "needs review" queue instead of being silently auto-confirmed.
 */
object TransactionParser {

    enum class Direction { DEBIT, CREDIT }

    data class ParsedTransaction(
        val amountPaise: Long,
        val direction: Direction,
        val merchant: String?,
        val confidence: Double,
    )

    /**
     * The full working of a parse attempt, for the debug log. parse() is a thin
     * wrapper over this so what the log shows is literally what was decided,
     * never a second implementation that can drift.
     */
    data class Explanation(
        val amountText: String? = null,
        val amountPaise: Long? = null,
        val directionKeyword: String? = null,
        val merchant: String? = null,
        val rejectedBy: String? = null,
        val confidence: Double = 0.0,
        val reason: String,
        val parsed: ParsedTransaction? = null,
    )

    private const val NUMBER = "[0-9][0-9,]*(?:\\.[0-9]{1,2})?"

    // Currency can lead ("Rs.100", "INR 99", "₹50.00") or trail ("200 rs",
    // "1,234.50 INR", "200 rupees") — both spellings show up in bank SMS.
    private val AMOUNT_REGEX = Regex(
        "(?:rs\\.?|inr|₹)\\s*($NUMBER)|($NUMBER)\\s*(?:rs\\b\\.?|inr\\b|rupees?\\b|₹)",
        RegexOption.IGNORE_CASE,
    )

    /** Newsletters quote prices and say things like "sentiment"; they are not alerts. */
    private val NEWSLETTER_MARKERS = listOf("digest", "newsletter", "unsubscribe", "sensex", "nifty")

    /**
     * How far an amount may sit from its debit/credit word. A real alert puts
     * them in the same clause; a market mail can have a price in a table and
     * the word paragraphs away.
     */
    private const val MAX_KEYWORD_GAP = 80

    private data class KeywordHit(val keyword: String, val index: Int, val direction: Direction)

    private val DEBIT_KEYWORDS = listOf(
        // "sent" alone is ambiguous: "Rahi sent you Rs 1" is money arriving, not
        // leaving. Only the outbound phrasing counts as a debit.
        "debited", "spent", "paid", "sent to", "withdrawn", "purchase of",
        // Card alerts rarely say "debited" — ICICI/HDFC/Axis phrase it as
        // "has been used for a transaction of INR ...".
        "used for a transaction", "transaction of", "txn of", "charged", "swiped",
        "payment of", "has been used",
    )
    private val CREDIT_KEYWORDS = listOf(
        "credited", "received", "deposited", "refunded", "added to",
        // UPI apps announce incoming money as "<name> sent you Rs X".
        "sent you", "sent me",
    )

    /** How much of the message counts as its subject matter, in characters. */
    private const val LEDE_LENGTH = 220

    // Notifications that mention money but are not real transactions.
    private val REJECT_KEYWORDS = listOf(
        "otp", "one time password", "will expire", "verification code",
        "available limit", "available balance", "minimum balance", "statement",
        "offer", "cashback up to", "win ", "reward points", "due on", "bill generated",
    )

    private const val TAIL =
        "\\s+(?:on|via|using|for|ref|txn|dated|\\d{1,2}[- ]?\\w{3,9})|[.,]|${'$'}"

    // \b stops "at" matching inside words like "statement". Tried in order, because
    // "debited from your account at Big Bazaar" should yield the shop, not the account.
    private val MERCHANT_REGEXES = listOf("at", "towards", "to", "from").map {
        Regex("\\b$it\\s+([A-Za-z0-9&.@_\\- ]{2,40}?)(?:$TAIL)", RegexOption.IGNORE_CASE)
    }

    // "towards VPA 8824258252-3@axl (Manish Kumar)" — the payee is in the brackets.
    private val VPA_NAME_REGEX = Regex(
        "(?:vpa|upi\\s*id)\\s+[^\\s(]+\\s*\\(([^)]{2,40})\\)",
        RegexOption.IGNORE_CASE,
    )

    // "your account ending", "the card" — the sentence's grammar, not a merchant.
    private val GENERIC_MERCHANT = Regex(
        "^(your|the|my)\\s+(account|a/c|acct|card|wallet)|^[0-9\\s.-]+${'$'}",
        RegexOption.IGNORE_CASE,
    )

    private fun findMerchant(body: String): String? {
        VPA_NAME_REGEX.find(body)?.groupValues?.get(1)?.clean()?.let { return it }
        UPI_MERCHANT_REGEX.find(body)?.groupValues?.get(1)?.clean()?.let { return it }
        for (regex in MERCHANT_REGEXES) {
            val candidate = regex.find(body)?.groupValues?.get(1)?.clean() ?: continue
            if (GENERIC_MERCHANT.containsMatchIn(candidate)) continue
            return candidate
        }
        return null
    }

    private fun String.clean(): String? = trim().trimEnd('.', ',').takeIf { it.isNotEmpty() }

    // "Info: UPI-661009446980-SWIGGY" — the merchant is the trailing segment.
    private val UPI_MERCHANT_REGEX = Regex(
        "UPI[-/ ]?[0-9]{4,}[-/]([A-Za-z0-9&@_-]{2,40})",
        RegexOption.IGNORE_CASE,
    )

    // A card alert states the transaction amount and then the remaining limit or
    // balance. Matching the wrong one would log a ₹29,511 coffee.
    private val AMOUNT_CONTEXT_BLOCKLIST = listOf("limit", "balance", "outstanding", "due")

    /** Every whole-word debit/credit keyword in the text, with its position. */
    private fun keywordHits(lower: String): List<KeywordHit> {
        val hits = ArrayList<KeywordHit>()
        for ((keywords, direction) in listOf(DEBIT_KEYWORDS to Direction.DEBIT, CREDIT_KEYWORDS to Direction.CREDIT)) {
            for (keyword in keywords) {
                // \b matters: "sent" must not match "sentiment" or "presented",
                // which is how a market newsletter became a ₹1,775 payment.
                Regex("\\b" + Regex.escape(keyword) + "\\b").findAll(lower).forEach {
                    hits.add(KeywordHit(keyword, it.range.first, direction))
                }
            }
        }
        return hits
    }

    private fun nearestKeyword(lower: String, amountIndex: Int): KeywordHit? =
        keywordHits(lower)
            .filter { kotlin.math.abs(it.index - amountIndex) <= MAX_KEYWORD_GAP }
            .minByOrNull { kotlin.math.abs(it.index - amountIndex) }

    private fun nearestKeywordAnywhere(lower: String): KeywordHit? = keywordHits(lower).firstOrNull()

    private fun pickAmount(body: String, lower: String): MatchResult? {
        for (m in AMOUNT_REGEX.findAll(body)) {
            val before = body.substring(maxOf(0, m.range.first - 32), m.range.first).lowercase()
            val after = body.substring(
                minOf(m.range.last + 1, body.length),
                minOf(m.range.last + 22, body.length),
            ).lowercase()
            if (AMOUNT_CONTEXT_BLOCKLIST.any { before.contains(it) || after.contains(it) }) continue
            // Prefer an amount that actually belongs to a transaction phrase.
            if (nearestKeyword(lower, m.range.first) != null) return m
        }
        return null
    }

    fun parse(title: String?, text: String?): ParsedTransaction? = explain(title, text).parsed

    fun explain(title: String?, text: String?): Explanation {
        val body = listOfNotNull(title, text).joinToString(" ").trim()
        if (body.isEmpty()) return Explanation(reason = "empty notification")
        val lower = body.lowercase()

        // Only the opening of the message decides what it *is*. Bank mails end with
        // boilerplate ("Never share your OTP...") that would otherwise veto a
        // perfectly good transaction alert.
        val lede = lower.take(LEDE_LENGTH)
        val rejectKeyword = REJECT_KEYWORDS.firstOrNull { lede.contains(it) }
        if (rejectKeyword != null) {
            return Explanation(rejectedBy = rejectKeyword, reason = "ignored: looks like \"$rejectKeyword\"")
        }

        val newsletter = NEWSLETTER_MARKERS.firstOrNull { lower.contains(it) }
        if (newsletter != null && nearestKeywordAnywhere(lower) == null) {
            return Explanation(rejectedBy = newsletter, reason = "looks like a newsletter, not an alert")
        }

        val amountMatch = pickAmount(body, lower)
            ?: return Explanation(reason = "no amount found next to a debit/credit word")
        // Group 1 is the currency-first form, group 2 the currency-last form.
        val amountText = amountMatch.groupValues[1].ifEmpty { amountMatch.groupValues[2] }
        val amountPaise = toPaise(amountText)
        if (amountPaise == null || amountPaise <= 0) {
            return Explanation(amountText = amountText, reason = "amount could not be read")
        }

        val nearest = nearestKeyword(lower, amountMatch.range.first)
        if (nearest == null) {
            return Explanation(
                amountText = amountText,
                amountPaise = amountPaise,
                reason = if (keywordHits(lower).isEmpty())
                    "no debit/credit word (e.g. debited, spent, credited)"
                else
                    "amount is not next to a debit/credit word",
            )
        }
        val direction = nearest.direction
        val directionKeyword = nearest.keyword

        val merchant = findMerchant(body)

        var confidence = 0.6
        confidence += 0.2 // a direction keyword is required to get this far
        if (merchant != null) confidence += 0.15
        if (amountText.contains(".")) confidence += 0.05
        confidence = confidence.coerceAtMost(1.0)

        return Explanation(
            amountText = amountText,
            amountPaise = amountPaise,
            directionKeyword = directionKeyword,
            merchant = merchant,
            confidence = confidence,
            reason = "matched",
            parsed = ParsedTransaction(amountPaise, direction, merchant, confidence),
        )
    }

    private fun toPaise(raw: String): Long? {
        return try {
            val cleaned = raw.replace(",", "")
            BigDecimal(cleaned).setScale(2, RoundingMode.HALF_UP)
                .multiply(BigDecimal(100))
                .toLong()
        } catch (e: NumberFormatException) {
            null
        }
    }
}

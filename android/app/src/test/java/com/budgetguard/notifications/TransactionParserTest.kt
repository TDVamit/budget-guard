package com.budgetguard.notifications

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Test

class TransactionParserTest {

    private fun parse(text: String) = TransactionParser.parse(null, text)

    @Test
    fun `currency before the amount`() {
        val p = parse("Rs.100 debited from your account")!!
        assertEquals(10000L, p.amountPaise)
        assertEquals(TransactionParser.Direction.DEBIT, p.direction)
    }

    @Test
    fun `currency after the amount`() {
        val p = parse("200 rs debited from your account")!!
        assertEquals(20000L, p.amountPaise)
        assertEquals(TransactionParser.Direction.DEBIT, p.direction)
    }

    @Test
    fun `suffix forms with decimals and grouping`() {
        assertEquals(123450L, parse("1,234.50 INR debited")!!.amountPaise)
        assertEquals(20000L, parse("200 rupees debited")!!.amountPaise)
    }

    @Test
    fun `credit direction and merchant`() {
        val p = parse("INR 500 credited from Acme Corp")!!
        assertEquals(50000L, p.amountPaise)
        assertEquals(TransactionParser.Direction.CREDIT, p.direction)
        assertEquals("Acme Corp", p.merchant)
    }

    @Test
    fun `a bare number is not an amount`() {
        assertNull(parse("200 debited from your account"))
    }

    @Test
    fun `no direction keyword means no transaction`() {
        assertNull(parse("Rs.100 something happened"))
    }

    @Test
    fun `balance and otp notifications are rejected`() {
        assertNull(parse("Rs.5,000 is your available balance"))
        assertNull(parse("Rs.100 debited - OTP 1234"))
    }

    private val iciciCardAlert =
        "Your ICICI Bank Credit Card XX0005 has been used for a transaction of INR 265.00 on " +
            "Sep 01, 2026 at 08:47:57. Info: UPI-661009446980-SWIGGY. The Available Credit Limit on " +
            "your card is INR 29,511.13 and Total Credit Limit is INR 70,000.00."

    @Test
    fun `icici card alert is detected`() {
        val p = parse(iciciCardAlert)!!
        assertEquals(26500L, p.amountPaise)
        assertEquals(TransactionParser.Direction.DEBIT, p.direction)
    }

    @Test
    fun `card alert takes the transaction amount not the credit limit`() {
        // 265.00 comes first here, but the limits must never win even so.
        val reordered =
            "Available Credit Limit is INR 29,511.13. Your card has been used for a transaction of INR 265.00."
        assertEquals(26500L, parse(reordered)!!.amountPaise)
    }

    @Test
    fun `merchant comes from the UPI info segment`() {
        assertEquals("SWIGGY", parse(iciciCardAlert)!!.merchant)
    }

    @Test
    fun `a balance-only alert is still ignored`() {
        assertNull(parse("Your available balance is INR 5,000.00"))
        assertNull(parse("Total Credit Limit is INR 70,000.00 and available limit is INR 29,511.13"))
    }

    private val hdfcUpiAlert =
        "Dear Customer, Greetings from HDFC Bank! Rs.154.00 is debited from your account ending 7861 " +
            "towards VPA 8824258252-3@axl (Manish Kumar) on 04-09-26. UPI transaction reference no.: 661307918133. " +
            "If you did not authorize this transaction, please report it immediately at: a. When in India (Toll free): 1800 258 6161"

    @Test
    fun `hdfc upi debit alert`() {
        val p = parse(hdfcUpiAlert)!!
        assertEquals(15400L, p.amountPaise)
        assertEquals(TransactionParser.Direction.DEBIT, p.direction)
        assertEquals("Manish Kumar", p.merchant)
    }

    @Test
    fun `merchant skips account boilerplate`() {
        assertEquals("Indian Oils", parse("Rs.400 debited from your account at Indian Oils")!!.merchant)
        assertNull(parse("Rs.400 debited from your account ending 7861")!!.merchant)
    }

    @Test
    fun `security footer does not veto a real transaction`() {
        val withFooter = iciciCardAlert +
            " Never share your OTP, URN, CVV or passwords with anyone even if the person claims to be a " +
            "bank employee. Sincerely, Team ICICI Bank"
        val p = parse(withFooter)!!
        assertEquals(26500L, p.amountPaise)
    }

    @Test
    fun `a real otp message is still rejected`() {
        assertNull(parse("123456 is your OTP for a transaction of Rs.500 at Amazon. Valid for 10 minutes."))
        assertNull(parse("Your one time password is 998877"))
    }

    // The real Groww Digest mail that was logged as a ₹1,775 payment: "positive
    // global sentiment" contains "sent", and SBI Life's price was in a table.
    private val growwDigest =
        "Groww Digest 04 September 2026 Sensex 76,515.43 Nifty 23,897.70. " +
            "The rise after 4 days of continuous selling in the markets may have been due to positive " +
            "global sentiment after the US Federal Reserve Governor's comments on interest rates. " +
            "Top Gainers NIFTY 50 SBI Life Rs 1,775.00 3.50% Tata Steel Rs 188.79 2.49% " +
            "HDFC Life Rs 546.40 2.42% Reliance Rs 1,322.00 1.50%. " +
            "A fall in the USD INR rate indicates the Rupee is getting stronger, hence it is presented in green."

    @Test
    fun `a market newsletter is not a payment`() {
        assertNull(parse(growwDigest))
    }

    @Test
    fun `sent does not match sentiment or presented`() {
        assertNull(parse("Market sentiment improved. Reliance Rs 1,322.00 closed higher."))
        assertNull(parse("The rate is presented in green. Gold Rs 1,54,884 today."))
    }

    @Test
    fun `an amount far from its keyword is not a transaction`() {
        val far = "Rs 5,000.00 " + "filler text ".repeat(12) + "was debited somewhere else entirely"
        assertNull(parse(far))
    }

    @Test
    fun `genuine alerts still parse after the proximity rule`() {
        assertEquals(15400L, parse(hdfcUpiAlert)!!.amountPaise)
        assertEquals(26500L, parse(iciciCardAlert)!!.amountPaise)
        assertEquals(40000L, parse("Rs.400 debited from your account at Indian Oils")!!.amountPaise)
        assertEquals(20000L, parse("200 rs debited from your account")!!.amountPaise)
    }

    @Test
    fun `sent you is money arriving, not leaving`() {
        val credit = parse("Rahi Damor sent you \u20B91.00 Punjab National Bank account has been successfully credited.")
        assertNotNull(credit)
        assertEquals(TransactionParser.Direction.CREDIT, credit!!.direction)
        assertEquals(100L, credit.amountPaise)
    }

    @Test
    fun `sending money out is still a debit`() {
        val debit = parse("Rs.200.00 sent to Rahi Damor from your PNB account.")
        assertNotNull(debit)
        assertEquals(TransactionParser.Direction.DEBIT, debit!!.direction)
    }
}

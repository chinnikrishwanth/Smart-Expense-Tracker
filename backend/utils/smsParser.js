class SMSParser {
  // Common patterns for Indian bank SMS
  static patterns = {
    upiDebit: [
      /Rs\.?\s*(\d+(?:\.\d{2})?)\s*(?:sent|debited|paid)\s*(?:to|from)\s*(?:.*?\s*)?(?:to|at|with)\s*([A-Za-z0-9\s\.\-]+?)(?:\.|\s+on|\s+via|\s+using|\s*$)/i,
      /(\d+(?:\.\d{2})?)\s*INR\s*(?:debited|paid)\s*to\s*([A-Za-z0-9\s\.\-]+)/i,
      /You\s+have\s+spent\s*Rs\.?\s*(\d+(?:\.\d{2})?)\s*at\s*([A-Za-z0-9\s\.\-]+)/i,
    ],
    upiCredit: [
      /Rs\.?\s*(\d+(?:\.\d{2})?)\s*(?:credited|received)\s*(?:from|by)\s*([A-Za-z0-9\s\.\-]+)/i,
      /(\d+(?:\.\d{2})?)\s*INR\s*received\s*from\s*([A-Za-z0-9\s\.\-]+)/i,
    ],
    generic: [
      /(?:(?:Rs\.?|INR)\s*)?(\d+(?:\.\d{2})?)\s*(?:has been|was)?\s*(?:debited|credited|paid|sent|received)\s*(?:to|from|by)\s*([A-Za-z0-9\s\.\-]+)/i,
    ]
  };

  // Bank keywords to filter SMS
  static bankKeywords = [
    'UPI', 'Debited', 'Credited', 'Transaction', 'Bank', 'Account',
    'Payment', 'Received', 'Sent', 'Paid', 'Transfer', 'Avl Bal',
    'IMPS', 'NEFT', 'RTGS', 'ATM', 'Card', 'VPA', 'UPI Ref'
  ];

  // Common bank names for identification
  static bankNames = {
    'HDFC': 'HDFC Bank',
    'ICICI': 'ICICI Bank',
    'SBI': 'State Bank of India',
    'AXIS': 'Axis Bank',
    'KOTAK': 'Kotak Mahindra Bank',
    'YES': 'Yes Bank',
    'PNB': 'Punjab National Bank',
    'BOB': 'Bank of Baroda',
    'CANARA': 'Canara Bank',
    'UNION': 'Union Bank',
  };

  static isTransactionSMS(smsBody) {
    const body = smsBody.toUpperCase();
    return this.bankKeywords.some(keyword => body.includes(keyword.toUpperCase()));
  }

  static extractBankName(smsBody) {
    const body = smsBody.toUpperCase();
    for (const [key, bankName] of Object.entries(this.bankNames)) {
      if (body.includes(key.toUpperCase())) {
        return bankName;
      }
    }
    return 'Unknown Bank';
  }

  static parseTransaction(smsBody) {
    if (!this.isTransactionSMS(smsBody)) {
      return null;
    }

    let amount = null;
    let merchant = null;
    let transactionType = null;

    // Try UPI debit patterns first
    for (const pattern of this.patterns.upiDebit) {
      const match = smsBody.match(pattern);
      if (match) {
        amount = parseFloat(match[1].replace(/,/g, ''));
        merchant = match[2].trim();
        transactionType = 'Debit';
        break;
      }
    }

    // Try UPI credit patterns
    if (!amount) {
      for (const pattern of this.patterns.upiCredit) {
        const match = smsBody.match(pattern);
        if (match) {
          amount = parseFloat(match[1].replace(/,/g, ''));
          merchant = match[2].trim();
          transactionType = 'Credit';
          break;
        }
      }
    }

    // Try generic patterns
    if (!amount) {
      for (const pattern of this.patterns.generic) {
        const match = smsBody.match(pattern);
        if (match) {
          amount = parseFloat(match[1].replace(/,/g, ''));
          merchant = match[2] ? match[2].trim() : 'Unknown';
          transactionType = smsBody.toLowerCase().includes('credited') ? 'Credit' : 'Debit';
          break;
        }
      }
    }

    // Extract UPI transaction ID if present
    const upiIdMatch = smsBody.match(/UPI\s*[\:\-\s]*([A-Za-z0-9]+(?:\.[A-Za-z0-9]+)*)/i);
    const upiTransactionId = upiIdMatch ? upiIdMatch[1] : null;

    // Extract date from SMS (if present)
    const dateMatch = smsBody.match(/(\d{1,2}\/\d{1,2}\/\d{2,4}|\d{1,2}-\d{1,2}-\d{2,4}|\d{1,2}\.\d{1,2}\.\d{2,4})/);
    let transactionDate = new Date();
    if (dateMatch) {
      const parsedDate = new Date(dateMatch[0].replace(/(\d+)[\/\-\.](\d+)[\/\-\.](\d+)/, '$2/$1/$3'));
      if (!isNaN(parsedDate.getTime())) {
        transactionDate = parsedDate;
      }
    }

    // Extract time from SMS (if present)
    const timeMatch = smsBody.match(/(\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM)?)/i);
    if (timeMatch) {
      const timeStr = timeMatch[0];
      const [time, modifier] = timeStr.split(' ');
      let [hours, minutes] = time.split(':');
      
      if (modifier) {
        if (modifier.toLowerCase() === 'pm' && hours < 12) hours = parseInt(hours) + 12;
        if (modifier.toLowerCase() === 'am' && hours == 12) hours = 0;
      }
      
      transactionDate.setHours(hours, minutes || 0, 0, 0);
    }

    if (amount && merchant) {
      return {
        amount,
        merchant: this.cleanMerchantName(merchant),
        transactionType,
        transactionDate,
        bankName: this.extractBankName(smsBody),
        upiTransactionId,
        isValid: true
      };
    }

    return null;
  }

  static cleanMerchantName(merchant) {
    // Remove common suffixes and clean up the name
    return merchant
      .replace(/\s+\.\s*$/, '')
      .replace(/\s*\/\s*$/, '')
      .replace(/^(?:to|at|from|by)\s+/i, '')
      .replace(/\s+(?:via|using|on|with|upi|ref|id|trxn|transaction).*$/i, '')
      .trim();
  }

  static categorizeExpense(merchant) {
    const merchantLower = merchant.toLowerCase();
    
    const categories = {
      'Food': ['restaurant', 'zomato', 'swiggy', 'food', 'cafe', 'pizza', 'burger', 'dining', 'eat'],
      'Shopping': ['amazon', 'flipkart', 'myntra', 'shopping', 'store', 'mart', 'supermarket'],
      'Transport': ['uber', 'ola', 'rapido', 'metro', 'bus', 'train', 'petrol', 'fuel'],
      'Entertainment': ['netflix', 'hotstar', 'prime', 'movie', 'theatre', 'cinema'],
      'Bills': ['electricity', 'water', 'gas', 'bill', 'recharge', 'mobile', 'internet'],
      'Healthcare': ['hospital', 'clinic', 'pharmacy', 'medicine', 'doctor', 'medical'],
    };

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => merchantLower.includes(keyword))) {
        return category;
      }
    }

    return 'Other';
  }
}

module.exports = SMSParser;
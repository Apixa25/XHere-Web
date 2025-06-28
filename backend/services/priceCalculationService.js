/**
 * Price Calculation Service
 * Handles all price-related calculations for the location trading system
 */

class PriceCalculationService {
  /**
   * Base price for locations (in credits)
   */
  static BASE_PRICE = 100;

  /**
   * Price multiplier for each purchase (doubling algorithm)
   */
  static PRICE_MULTIPLIER = 2;

  /**
   * Calculate the current price for a location using the doubling algorithm
   * @param {number} purchaseCount - Number of times the location has been purchased
   * @param {number} basePrice - Base price (default: 100 credits)
   * @returns {number} Calculated price
   */
  static calculatePrice(purchaseCount = 0, basePrice = this.BASE_PRICE) {
    return basePrice * Math.pow(this.PRICE_MULTIPLIER, purchaseCount);
  }

  /**
   * Calculate the next price for a location
   * @param {number} purchaseCount - Current purchase count
   * @param {number} basePrice - Base price (default: 100 credits)
   * @returns {number} Next price
   */
  static calculateNextPrice(purchaseCount = 0, basePrice = this.BASE_PRICE) {
    return this.calculatePrice(purchaseCount + 1, basePrice);
  }

  /**
   * Calculate price history for a location
   * @param {number} maxPurchases - Maximum number of purchases to calculate
   * @param {number} basePrice - Base price (default: 100 credits)
   * @returns {Array} Array of prices for each purchase
   */
  static calculatePriceHistory(maxPurchases = 10, basePrice = this.BASE_PRICE) {
    const priceHistory = [];
    for (let i = 0; i <= maxPurchases; i++) {
      priceHistory.push({
        purchaseNumber: i,
        price: this.calculatePrice(i, basePrice),
        cumulativeCost: this.calculateCumulativeCost(i, basePrice)
      });
    }
    return priceHistory;
  }

  /**
   * Calculate cumulative cost to reach a certain purchase number
   * @param {number} purchaseCount - Purchase count
   * @param {number} basePrice - Base price (default: 100 credits)
   * @returns {number} Cumulative cost
   */
  static calculateCumulativeCost(purchaseCount = 0, basePrice = this.BASE_PRICE) {
    let total = 0;
    for (let i = 0; i < purchaseCount; i++) {
      total += this.calculatePrice(i, basePrice);
    }
    return total;
  }

  /**
   * Calculate the profit for a seller (80% of sale price)
   * @param {number} salePrice - Price the location was sold for
   * @returns {number} Profit for the seller
   */
  static calculateSellerProfit(salePrice) {
    return Math.floor(salePrice * 0.8); // 80% to seller, 20% platform fee
  }

  /**
   * Calculate platform fee from a sale
   * @param {number} salePrice - Price the location was sold for
   * @returns {number} Platform fee
   */
  static calculatePlatformFee(salePrice) {
    return salePrice - this.calculateSellerProfit(salePrice);
  }

  /**
   * Get price information for display
   * @param {number} currentPurchaseCount - Current purchase count
   * @param {number} basePrice - Base price (default: 100 credits)
   * @returns {Object} Price information object
   */
  static getPriceInfo(currentPurchaseCount = 0, basePrice = this.BASE_PRICE) {
    const currentPrice = this.calculatePrice(currentPurchaseCount, basePrice);
    const nextPrice = this.calculateNextPrice(currentPurchaseCount, basePrice);
    const priceIncrease = nextPrice - currentPrice;
    const priceIncreasePercentage = ((priceIncrease / currentPrice) * 100).toFixed(1);

    return {
      currentPrice,
      nextPrice,
      priceIncrease,
      priceIncreasePercentage,
      purchaseCount: currentPurchaseCount,
      basePrice,
      priceHistory: this.calculatePriceHistory(Math.min(currentPurchaseCount + 5, 10), basePrice)
    };
  }

  /**
   * Validate if a price is reasonable (prevent exponential growth issues)
   * @param {number} price - Price to validate
   * @param {number} maxPrice - Maximum allowed price (default: 1,000,000)
   * @returns {boolean} Whether the price is reasonable
   */
  static validatePrice(price, maxPrice = 1000000) {
    return price > 0 && price <= maxPrice;
  }

  /**
   * Get the maximum purchase count before price becomes unreasonable
   * @param {number} basePrice - Base price (default: 100 credits)
   * @param {number} maxPrice - Maximum allowed price (default: 1,000,000)
   * @returns {number} Maximum reasonable purchase count
   */
  static getMaxReasonablePurchaseCount(basePrice = this.BASE_PRICE, maxPrice = 1000000) {
    return Math.floor(Math.log2(maxPrice / basePrice));
  }

  /**
   * Format price for display
   * @param {number} price - Price in credits
   * @returns {string} Formatted price string
   */
  static formatPrice(price) {
    if (price >= 1000) {
      return `${(price / 1000).toFixed(1)}k credits`;
    }
    return `${price} credits`;
  }

  /**
   * Calculate price trend analysis
   * @param {number} currentPurchaseCount - Current purchase count
   * @param {number} basePrice - Base price (default: 100 credits)
   * @returns {Object} Price trend analysis
   */
  static analyzePriceTrend(currentPurchaseCount = 0, basePrice = this.BASE_PRICE) {
    const currentPrice = this.calculatePrice(currentPurchaseCount, basePrice);
    const nextPrice = this.calculateNextPrice(currentPurchaseCount, basePrice);
    const maxReasonableCount = this.getMaxReasonablePurchaseCount(basePrice);
    
    return {
      currentPrice,
      nextPrice,
      priceIncrease: nextPrice - currentPrice,
      priceIncreasePercentage: ((nextPrice - currentPrice) / currentPrice * 100).toFixed(1),
      purchasesUntilMax: Math.max(0, maxReasonableCount - currentPurchaseCount),
      isNearMax: currentPurchaseCount >= maxReasonableCount - 2,
      trend: currentPurchaseCount < 3 ? 'early' : 
             currentPurchaseCount < 7 ? 'mid' : 'late'
    };
  }
}

module.exports = PriceCalculationService; 
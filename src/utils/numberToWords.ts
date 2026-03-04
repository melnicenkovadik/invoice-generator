const ones = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen',
];
const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function convertGroup(n: number): string {
  if (n === 0) return '';
  if (n < 20) return ones[n];
  if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? '-' + ones[n % 10].toLowerCase() : '');
  return ones[Math.floor(n / 100)] + ' hundred' + (n % 100 ? ' ' + convertGroup(n % 100) : '');
}

export function numberToWords(amount: number, currency = 'USD'): string {
  if (amount === 0) return 'Zero US dollars and 00 cents';

  const dollars = Math.floor(amount);
  const cents = Math.round((amount - dollars) * 100);

  const parts: string[] = [];

  if (dollars >= 1_000_000) {
    parts.push(convertGroup(Math.floor(dollars / 1_000_000)) + ' million');
    const remainder = dollars % 1_000_000;
    if (remainder >= 1000) {
      parts.push(convertGroup(Math.floor(remainder / 1000)) + ' thousand');
    }
    const last = remainder % 1000;
    if (last) parts.push(convertGroup(last));
  } else if (dollars >= 1000) {
    parts.push(convertGroup(Math.floor(dollars / 1000)) + ' thousand');
    const remainder = dollars % 1000;
    if (remainder) parts.push(convertGroup(remainder));
  } else {
    parts.push(convertGroup(dollars));
  }

  const currencyName = currency === 'USD' ? 'US dollars' : currency === 'EUR' ? 'euros' : currency;
  const centsStr = cents.toString().padStart(2, '0');

  return `${parts.join(' ')} ${currencyName} and ${centsStr} cents`;
}

export function calculateTotal(prices: string[]): number {
  return prices.reduce((sum, p) => {
    const num = parseFloat(p);
    return sum + (isNaN(num) ? 0 : num);
  }, 0);
}

export function formatCurrency(amount: number): string {
  return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

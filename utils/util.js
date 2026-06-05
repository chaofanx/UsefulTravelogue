function formatDate(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  const weekDays = ['星期天', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  const weekDay = weekDays[date.getDay()];
  return `${Number(m)}月${Number(d)}日 ${weekDay}`;
}

function formatMonth(dateStr) {
  if (!dateStr) return '';
  const [y, m] = dateStr.split('-');
  return `${y}年${Number(m)}月`;
}

function formatAmount(amount) {
  return Number(amount).toFixed(2);
}

function getWeekDayCN(dateStr) {
  const weekDays = ['星期天', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  const [y, m, d] = dateStr.split('-');
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  return weekDays[date.getDay()];
}

function getAvatarText(name) {
  if (!name) return '';
  return name.charAt(0);
}

function formatDateShort(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${Number(m)}/${Number(d)}`;
}

module.exports = {
  formatDate,
  formatMonth,
  formatAmount,
  getWeekDayCN,
  getAvatarText,
  formatDateShort
};

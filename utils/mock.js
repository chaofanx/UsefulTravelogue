function groupBillsByDate(billList) {
  const groups = {};
  billList.forEach(bill => {
    if (!groups[bill.date]) {
      groups[bill.date] = {
        date: bill.date,
        bills: [],
        totalOut: 0,
        totalIn: 0
      };
    }
    groups[bill.date].bills.push(bill);
    groups[bill.date].totalOut += bill.amount;
  });
  return Object.values(groups).sort((a, b) => b.date.localeCompare(a.date));
}

function groupSchedulesByDate(scheduleList) {
  const groups = {};
  scheduleList.forEach(item => {
    if (!groups[item.date]) {
      groups[item.date] = {
        date: item.date,
        dayOfWeek: item.dayOfWeek,
        schedules: []
      };
    }
    groups[item.date].schedules.push(item);
  });
  return Object.values(groups).sort((a, b) => b.date.localeCompare(a.date));
}

module.exports = {
  groupBillsByDate,
  groupSchedulesByDate
};

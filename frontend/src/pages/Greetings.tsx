function CurrentDateDisplay() {
  const today = new Date();
  // Format the date as a local string (e.g., "1/25/2026")
  const formattedDate = today.toLocaleDateString();
  return formattedDate;
}

function Greetings() {
  const now = new Date();
  // The comparison logic is better done using the actual hour number
  const currentHour = now.getHours();

  if (currentHour >= 5 && currentHour < 12) {
    return "Good Morning";
  } else if (currentHour >= 12 && currentHour < 17) {
    // 5:00 PM is 17 hours
    return "Good Afternoon";
  } else if (currentHour >= 17 && currentHour < 21) {
    // 9:00 PM is 21 hours
    return "Good Evening";
  } else {
    // Covers 9:00 PM to 5:00 AM (21:00 to 05:00)
    return "Good Night";
  }
}

export { CurrentDateDisplay, Greetings };
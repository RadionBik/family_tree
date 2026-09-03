// Full years from `birth` to `death`, or to today for the living. null when unknown.
export function ageOn(birth, death) {
  if (!birth) return null;
  const b = new Date(birth);
  if (Number.isNaN(b.getTime())) return null;
  const e = death ? new Date(death) : new Date();
  let age = e.getFullYear() - b.getFullYear();
  const months = e.getMonth() - b.getMonth();
  if (months < 0 || (months === 0 && e.getDate() < b.getDate())) age -= 1;
  return age >= 0 ? age : null;
}

// "1953" for the living, "1953–2020" for the deceased, "" when unknown.
export function lifeYears(birth, death) {
  const b = birth ? birth.slice(0, 4) : "";
  const d = death ? death.slice(0, 4) : "";
  if (b && d) return `${b}–${d}`;
  if (d) return `†${d}`;
  return b;
}
